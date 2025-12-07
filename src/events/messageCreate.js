const { PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Directory where uploaded files will be stored (relative to repo root)
const UPLOAD_DIR = path.join(process.cwd(), 'assets', 'uploads');

// Ensure upload directory exists
try { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); } catch (e) { console.error('Failed to create upload dir:', e); }

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        try {
            // Ignore bots
            if (message.author.bot) return;

            const prefix = process.env.COMMAND_PREFIX || '!';
            if (!message.content.startsWith(prefix)) return;

            // Preserve multiline text after the command (don't collapse newlines)
            const afterPrefix = message.content.slice(prefix.length);
            // capture the command (first non-space token) and the rest (including newlines)
            const m = afterPrefix.match(/^([^\s]+)([\s\S]*)$/);
            const command = m ? m[1].toLowerCase() : afterPrefix.toLowerCase().trim();
            const text = m ? m[2].trimStart() : '';

            // All message-based commands require Administrator permission
            const member = message.member;
            const hasAdmin = member.permissions ? member.permissions.has(PermissionFlagsBits.Administrator) : false;

            // Helper: permission guard (admin only)
            const ensurePerms = async () => {
                if (!hasAdmin) {
                    await message.reply({ content: '❌ Solo los administradores pueden usar este comando.' });
                    return false;
                }
                return true;
            };

            // Handle `say` - repost attachments/ text (existing behavior)
            if (command === 'say') {
                if (!await ensurePerms()) return;

                const attachments = message.attachments ? Array.from(message.attachments.values()) : [];

                if (attachments.length === 0 && !text) {
                    await message.reply({ content: 'Proporciona texto o sube un archivo para que el bot lo reenvíe.' });
                    return;
                }

                const files = attachments.slice(0, 10).map(a => ({ attachment: a.url, name: a.name }));
                await message.channel.send({ content: text || undefined, files: files.length ? files : undefined });

                try { await message.react('✅'); } catch (e) { /* ignore */ }
                return;
            }

            // Handle `upload` - save attachments to local UPLOAD_DIR
            if (command === 'upload') {
                if (!await ensurePerms()) return;

                const attachments = message.attachments ? Array.from(message.attachments.values()) : [];
                if (attachments.length === 0) {
                    await message.reply({ content: 'No se detectaron archivos adjuntos para guardar.' });
                    return;
                }

                // Use global fetch to download attachments (Node 18+)
                const saved = [];
                for (const a of attachments.slice(0, 10)) {
                    try {
                        const url = a.url;
                        const name = path.basename(a.name || url.split('/').pop() || `file-${Date.now()}`);
                        // sanitize name to avoid traversal
                        const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '_');
                        let dest = path.join(UPLOAD_DIR, safeName);
                        // if exists, append timestamp
                        if (fs.existsSync(dest)) {
                            const parsed = path.parse(safeName);
                            const newName = `${parsed.name}-${Date.now()}${parsed.ext}`;
                            dest = path.join(UPLOAD_DIR, newName);
                        }

                        const res = await fetch(url);
                        if (!res.ok) throw new Error(`download failed ${res.status}`);
                        const buffer = await res.arrayBuffer();
                        fs.writeFileSync(dest, Buffer.from(buffer));
                        saved.push(path.basename(dest));
                    } catch (e) {
                        console.error('upload: failed to save attachment', e);
                    }
                }

                if (saved.length === 0) {
                    await message.reply({ content: 'No se pudieron guardar los archivos adjuntos.' });
                } else {
                    await message.reply({ content: `Archivos guardados: ${saved.join(', ')}` });
                }
                return;
            }

            // Handle `send <filename>` - send a local file from UPLOAD_DIR
            if (command === 'send') {
                if (!await ensurePerms()) return;

                const filename = text.split(/\s+/)[0];
                if (!filename) {
                    await message.reply({ content: 'Indica el nombre del archivo a enviar. Ej: `!send imagen.png`' });
                    return;
                }

                // sanitize and resolve
                const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
                const filePath = path.join(UPLOAD_DIR, safe);
                if (!fs.existsSync(filePath)) {
                    await message.reply({ content: `No se encontró el archivo: ${safe}` });
                    return;
                }

                try {
                    await message.channel.send({ files: [filePath] });
                    try { await message.react('✅'); } catch (e) { /* ignore */ }
                } catch (e) {
                    console.error('send: failed to send file', e);
                    await message.reply({ content: 'Error al enviar el archivo.' });
                }

                return;
            }

        } catch (err) {
            console.error('messageCreate event error:', err);
            try { await message.reply({ content: 'Ocurrió un error al intentar reenviar el archivo.' }); } catch (e) { /* ignore */ }
        }
    },
};
