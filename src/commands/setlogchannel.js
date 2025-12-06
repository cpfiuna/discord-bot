const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setlogchannel')
        .setDescription('Configura el canal de logs del bot (solo administradores)')
        .addChannelOption(option =>
            option.setName('canal')
                .setDescription('El canal donde se enviarán logs de auditoría')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('desactivar')
                .setDescription('Desactivar logs públicos (solo consola)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        // Double-check permissions at runtime
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ 
                content: '❌ Solo los administradores pueden usar este comando.', 
                flags: 64 
            });
        }

        const canal = interaction.options.getChannel('canal');
        const desactivar = interaction.options.getBoolean('desactivar');

        // If nothing provided, show current settings
        if (!canal && !desactivar) {
            const currentChannelId = process.env.LOG_CHANNEL_ID;
            let status = '❌ No configurado';
            
            if (currentChannelId) {
                try {
                    const channel = await interaction.guild.channels.fetch(currentChannelId).catch(() => null);
                    status = channel ? `✅ <#${currentChannelId}>` : `⚠️ Canal no encontrado (ID: ${currentChannelId})`;
                } catch (e) {
                    status = `⚠️ Error al verificar canal (ID: ${currentChannelId})`;
                }
            }
            
            return interaction.reply({
                content: `**Canal de logs actual:**\n${status}\n\n` +
                         `Usa \`/setlogchannel canal:#canal\` para cambiar o \`/setlogchannel desactivar:True\` para desactivar.`,
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

            let message = '';

            if (desactivar) {
                // Remove or comment out LOG_CHANNEL_ID
                const logRegex = /^LOG_CHANNEL_ID=.*$/m;
                
                if (logRegex.test(envContent)) {
                    envContent = envContent.replace(logRegex, '# LOG_CHANNEL_ID=');
                }
                
                delete process.env.LOG_CHANNEL_ID;
                message = '✅ Logs públicos desactivados. Los logs seguirán en consola.';
                
            } else if (canal) {
                // Verify bot can send messages in the channel
                const permissions = canal.permissionsFor(interaction.guild.members.me);
                if (!permissions.has('SendMessages')) {
                    return interaction.editReply({
                        content: `❌ No tengo permisos para enviar mensajes en <#${canal.id}>. Por favor otorga permisos de "Enviar Mensajes".`
                    });
                }

                const logRegex = /^#?\s*LOG_CHANNEL_ID=.*$/m;
                const newLogLine = `LOG_CHANNEL_ID=${canal.id}`;
                
                if (logRegex.test(envContent)) {
                    envContent = envContent.replace(logRegex, newLogLine);
                } else {
                    envContent += `\n${newLogLine}\n`;
                }
                
                process.env.LOG_CHANNEL_ID = canal.id;
                message = `✅ Canal de logs actualizado a <#${canal.id}>`;
            }

            // Write updated .env
            fs.writeFileSync(envPath, envContent, 'utf8');

            await interaction.editReply({ content: message });

            console.log(`Log channel updated by ${interaction.user.tag}: ${message}`);

            // Send audit log to NEW channel if it was just set
            try {
                if (process.env.LOG_CHANNEL_ID && canal) {
                    const logChannel = await interaction.client.channels.fetch(process.env.LOG_CHANNEL_ID).catch(() => null);
                    if (logChannel && logChannel.isTextBased()) {
                        await logChannel.send({
                            content: `🔧 **Canal de logs configurado** por ${interaction.user.tag} (${interaction.user.id})\nEste canal recibirá logs de auditoría y eventos del bot.`
                        }).catch(e => console.error('Failed to send audit log:', e));
                    }
                }
            } catch (e) {
                console.error('Failed to send audit log:', e);
            }

        } catch (error) {
            console.error('Error updating log channel:', error);
            await interaction.editReply({
                content: '❌ Hubo un error al actualizar el canal de logs. Revisa los logs del bot.'
            }).catch(() => {});
        }
    },
};
