const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    // keep this hidden from public listings
    public: false,
    data: new SlashCommandBuilder()
        .setName('testlog')
        .setDescription('Enviar un mensaje de prueba al canal de logs configurado'),

    async execute(interaction) {
        // Check admin permissions
        if (!interaction.guild) {
            return interaction.reply({ content: 'Este comando solo puede usarse en un servidor.', flags: 64 });
        }

        const member = interaction.member;
        const hasPermission = member.permissions.has('Administrator');

        if (!hasPermission) {
            return interaction.reply({ content: '❌ Este comando solo puede ser usado por administradores.', flags: 64 });
        }

        // Acknowledge quickly so we have time to fetch/send
        // Use flags instead of `ephemeral` as the latter is deprecated
        await interaction.deferReply({ flags: 64 });

        const channelId = process.env.LOG_CHANNEL_ID;
        if (!channelId) return interaction.editReply({ content: 'No hay `LOG_CHANNEL_ID` configurado en el .env.' });

        try {
            const ch = await interaction.client.channels.fetch(channelId);
            if (!ch || !ch.isTextBased()) {
                await interaction.editReply({ content: `No se pudo resolver el canal \`${channelId}\` o no es un canal de texto.` });
                return;
            }

            const text = `Mensaje de prueba de logs enviado por ${interaction.user.tag} (ID: ${interaction.user.id})`;
            await ch.send({ content: text });
            await interaction.editReply({ content: `Mensaje de prueba enviado a <#${channelId}>.` });
        } catch (err) {
            console.error('Failed to send test log:', err);
            await interaction.editReply({ content: `Error al enviar el mensaje de prueba: ${err.message}` });
        }
    },
};
