const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Directorio donde se almacenan los archivos subidos
const UPLOAD_DIR = path.join(process.cwd(), 'assets', 'uploads');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('imagen')
        .setDescription('Enviar una imagen previamente guardada como archivo adjunto (solo administradores)')
        .addStringOption(opt =>
            opt.setName('archivo')
               .setDescription('El nombre exacto del archivo almacenado en assets/uploads')
               .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            // Verificar permisos de administrador en tiempo de ejecución
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ content: '❌ Solo los administradores pueden usar este comando.', ephemeral: true });
            }

            const filename = interaction.options.getString('archivo', true).trim();

            // sanitize and resolve
            const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
            const resolved = path.resolve(UPLOAD_DIR, safe);

            // asegurar que el archivo está dentro de UPLOAD_DIR
            if (!resolved.startsWith(path.resolve(UPLOAD_DIR))) {
                return interaction.reply({ content: '❌ Nombre de archivo inválido.', ephemeral: true });
            }

            if (!fs.existsSync(resolved)) {
                return interaction.reply({ content: `❌ Archivo no encontrado: ${safe}`, ephemeral: true });
            }

            await interaction.deferReply({ ephemeral: true });

            // enviar archivo al canal
            const ch = interaction.channel;
            if (!ch || !ch.isTextBased()) {
                return interaction.editReply({ content: '❌ No se puede enviar el archivo: el canal no es textual.' });
            }

            await ch.send({ files: [resolved] });
            await interaction.editReply({ content: `✅ Archivo enviado: ${safe}` });
        } catch (err) {
            console.error('imagen command error:', err);
            try { await interaction.reply({ content: '❌ Ocurrió un error al enviar el archivo.', ephemeral: true }); } catch (e) { /* ignore */ }
        }
    },
};
