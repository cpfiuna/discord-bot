const { SlashCommandBuilder, PermissionFlagsBits, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setpresence')
        .setDescription('Cambia la presencia del bot (solo administradores)')
        .addStringOption(option =>
            option.setName('texto')
                .setDescription('El texto de la presencia del bot')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('tipo')
                .setDescription('El tipo de presencia')
                .setRequired(false)
                .addChoices(
                    { name: 'Playing', value: 'Playing' },
                    { name: 'Streaming', value: 'Streaming' },
                    { name: 'Listening', value: 'Listening' },
                    { name: 'Watching', value: 'Watching' },
                    { name: 'Competing', value: 'Competing' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        // Double-check permissions at runtime
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ 
                content: '❌ Solo los administradores pueden usar este comando.', 
                flags: 64 
            });
        }

        let newText = interaction.options.getString('texto');
        const newType = interaction.options.getString('tipo');

        // Validate and sanitize text input
        if (newText) {
            // Discord presence text limit is 128 characters
            if (newText.length > 128) {
                return interaction.reply({
                    content: '❌ El texto de presencia no puede exceder 128 caracteres.',
                    flags: 64
                });
            }
            // Remove quotes and newlines that would break .env format
            newText = newText.replace(/["'\n\r]/g, '');
        }

        // If nothing provided, show current settings
        if (!newText && !newType) {
            const currentText = process.env.BOT_PRESENCE || 'Listo — usa "/" para comandos';
            const currentType = process.env.BOT_PRESENCE_TYPE || 'Listening';
            
            return interaction.reply({
                content: `**Presencia actual:**\n` +
                         `📝 Texto: \`${currentText}\`\n` +
                         `🎭 Tipo: \`${currentType}\`\n\n` +
                         `Usa \`/setpresence texto:<texto> tipo:<tipo>\` para cambiar.`,
                flags: 64
            });
        }

        await interaction.deferReply({ flags: 64 });

        try {
            // Read .env file
            const envPath = path.join(__dirname, '..', '..', '.env');
            let envContent = '';
            
            if (fs.existsSync(envPath)) {
                envContent = fs.readFileSync(envPath, 'utf8');
            }

            // Update BOT_PRESENCE if provided
            if (newText) {
                const presenceRegex = /^BOT_PRESENCE=.*$/m;
                const newPresenceLine = `BOT_PRESENCE="${newText}"`;
                
                if (presenceRegex.test(envContent)) {
                    envContent = envContent.replace(presenceRegex, newPresenceLine);
                } else {
                    envContent += `\n${newPresenceLine}\n`;
                }
                
                process.env.BOT_PRESENCE = newText;
            }

            // Update BOT_PRESENCE_TYPE if provided
            if (newType) {
                const typeRegex = /^BOT_PRESENCE_TYPE=.*$/m;
                const newTypeLine = `BOT_PRESENCE_TYPE=${newType}`;
                
                if (typeRegex.test(envContent)) {
                    envContent = envContent.replace(typeRegex, newTypeLine);
                } else {
                    envContent += `\n${newTypeLine}\n`;
                }
                
                process.env.BOT_PRESENCE_TYPE = newType;
            }

            // Write updated .env
            fs.writeFileSync(envPath, envContent, 'utf8');

            // Apply the presence change immediately
            const finalText = process.env.BOT_PRESENCE || 'Listo — usa "/" para comandos';
            const typeMap = {
                'Playing': ActivityType.Playing,
                'Streaming': ActivityType.Streaming,
                'Listening': ActivityType.Listening,
                'Watching': ActivityType.Watching,
                'Competing': ActivityType.Competing,
            };
            const finalType = typeMap[process.env.BOT_PRESENCE_TYPE] || ActivityType.Listening;
            
            interaction.client.user.setActivity(finalText, { type: finalType });

            const changes = [];
            if (newText) changes.push(`📝 Texto: \`${newText}\``);
            if (newType) changes.push(`🎭 Tipo: \`${newType}\``);

            await interaction.editReply({
                content: `✅ **Presencia actualizada:**\n${changes.join('\n')}\n\n` +
                         `*Los cambios se han guardado en .env y aplicado inmediatamente.*`
            });

            console.log(`Presence updated by ${interaction.user.tag}: ${changes.join(', ')}`);

            // Send audit log to LOG_CHANNEL_ID if configured
            try {
                if (process.env.LOG_CHANNEL_ID) {
                    const logChannel = await interaction.client.channels.fetch(process.env.LOG_CHANNEL_ID).catch(() => null);
                    if (logChannel && logChannel.isTextBased()) {
                        await logChannel.send({
                            content: `🔧 **Presencia actualizada** por ${interaction.user.tag} (${interaction.user.id})\n${changes.join('\n')}`
                        }).catch(e => console.error('Failed to send audit log:', e));
                    }
                }
            } catch (e) {
                console.error('Failed to send audit log:', e);
            }

        } catch (error) {
            console.error('Error updating presence:', error);
            await interaction.editReply({
                content: '❌ Hubo un error al actualizar la presencia. Revisa los logs del bot.'
            }).catch(() => {});
        }
    },
};
