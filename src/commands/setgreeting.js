const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setgreeting')
        .setDescription('Configura el canal de mensajes de bienvenida (solo administradores)')
        .addChannelOption(option =>
            option.setName('canal')
                .setDescription('El canal donde se enviarán mensajes de bienvenida')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('desactivar')
                .setDescription('Desactivar mensajes de bienvenida')
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
            const currentChannelId = process.env.GREETING_CHANNEL_ID;
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
                content: `**Canal de bienvenida actual:**\n${status}\n\n` +
                         `Usa \`/setgreeting canal:#canal\` para cambiar o \`/setgreeting desactivar:True\` para desactivar.`,
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
                // Remove or comment out GREETING_CHANNEL_ID
                const greetingRegex = /^GREETING_CHANNEL_ID=.*$/m;
                
                if (greetingRegex.test(envContent)) {
                    envContent = envContent.replace(greetingRegex, '# GREETING_CHANNEL_ID=');
                }
                
                delete process.env.GREETING_CHANNEL_ID;
                message = '✅ Mensajes de bienvenida desactivados.';
                
            } else if (canal) {
                // Verify bot can send messages in the channel
                const permissions = canal.permissionsFor(interaction.guild.members.me);
                if (!permissions.has('SendMessages')) {
                    return interaction.editReply({
                        content: `❌ No tengo permisos para enviar mensajes en <#${canal.id}>. Por favor otorga permisos de "Enviar Mensajes".`
                    });
                }

                const greetingRegex = /^#?\s*GREETING_CHANNEL_ID=.*$/m;
                const newGreetingLine = `GREETING_CHANNEL_ID=${canal.id}`;
                
                if (greetingRegex.test(envContent)) {
                    envContent = envContent.replace(greetingRegex, newGreetingLine);
                } else {
                    envContent += `\n${newGreetingLine}\n`;
                }
                
                process.env.GREETING_CHANNEL_ID = canal.id;
                message = `✅ Canal de bienvenida actualizado a <#${canal.id}>`;
            }

            // Write updated .env
            fs.writeFileSync(envPath, envContent, 'utf8');

            await interaction.editReply({ content: message });

            console.log(`Greeting channel updated by ${interaction.user.tag}: ${message}`);

            // Send audit log
            try {
                if (process.env.LOG_CHANNEL_ID) {
                    const logChannel = await interaction.client.channels.fetch(process.env.LOG_CHANNEL_ID).catch(() => null);
                    if (logChannel && logChannel.isTextBased()) {
                        await logChannel.send({
                            content: `🔧 **Canal de bienvenida actualizado** por ${interaction.user.tag} (${interaction.user.id})\n${message}`
                        }).catch(e => console.error('Failed to send audit log:', e));
                    }
                }
            } catch (e) {
                console.error('Failed to send audit log:', e);
            }

        } catch (error) {
            console.error('Error updating greeting channel:', error);
            await interaction.editReply({
                content: '❌ Hubo un error al actualizar el canal de bienvenida. Revisa los logs del bot.'
            }).catch(() => {});
        }
    },
};
