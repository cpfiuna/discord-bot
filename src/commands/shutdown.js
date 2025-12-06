const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shutdown')
        .setDescription('Apaga el bot de forma segura (solo administradores)')
        .addStringOption(option =>
            option.setName('confirmar')
                .setDescription('Escribe "sí" para confirmar el apagado')
                .setRequired(true)
                .addChoices(
                    { name: 'Sí, apagar el bot', value: 'si' },
                    { name: 'No, cancelar', value: 'no' }
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

        const confirmar = interaction.options.getString('confirmar');

        if (confirmar !== 'si') {
            return interaction.reply({
                content: '✅ Apagado cancelado. El bot seguirá funcionando.',
                flags: 64
            });
        }

        await interaction.deferReply({ flags: 64 });

        try {
            const client = interaction.client;

            // Calculate uptime for log
            const uptime = process.uptime();
            const uptimeMinutes = Math.floor(uptime / 60);
            const uptimeHours = Math.floor(uptimeMinutes / 60);

            await interaction.editReply({
                content: `🛑 **Apagando el bot...**\n\nEl bot se detendrá en unos momentos.\n\n` +
                         `⏱️ Tiempo activo: ${uptimeHours}h ${uptimeMinutes % 60}m\n` +
                         `👤 Solicitado por: ${interaction.user.tag}\n\n` +
                         `⚠️ **Nota:** Necesitarás acceso al servidor para reiniciar el bot.`
            });

            console.log(`\n${'='.repeat(50)}`);
            console.log(`🛑 SHUTDOWN REQUESTED by ${interaction.user.tag} (${interaction.user.id})`);
            console.log(`Server: ${interaction.guild.name} (${interaction.guild.id})`);
            console.log(`Uptime: ${uptimeHours}h ${uptimeMinutes % 60}m`);
            console.log(`${'='.repeat(50)}\n`);

            // Send audit log to LOG_CHANNEL_ID if configured
            try {
                if (process.env.LOG_CHANNEL_ID) {
                    const logChannel = await client.channels.fetch(process.env.LOG_CHANNEL_ID).catch(() => null);
                    if (logChannel && logChannel.isTextBased() && logChannel.id !== interaction.channelId) {
                        await logChannel.send({
                            content: `🛑 **Bot apagado** por ${interaction.user.tag} (${interaction.user.id})\n` +
                                     `Servidor: ${interaction.guild.name}\n` +
                                     `Tiempo activo: ${uptimeHours}h ${uptimeMinutes % 60}m`
                        }).catch(e => console.error('Failed to send shutdown log:', e));
                    }
                }
            } catch (e) {
                console.error('Failed to send shutdown audit log:', e);
            }

            // Give time for messages to send
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Graceful shutdown
            console.log('Destroying client connection...');
            client.destroy();

            console.log('Exiting process...');
            process.exit(0);

        } catch (error) {
            console.error('Error during shutdown:', error);
            await interaction.editReply({
                content: `❌ Error durante el apagado: ${error.message}\n\nEl bot podría seguir funcionando.`
            }).catch(() => {});
        }
    },
};
