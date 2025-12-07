const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Enviar un mensaje formateado a través del bot (solo administradores)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    /**
     * Muestra un modal para recopilar contenido de mensaje multilínea del usuario.
     * Permiso: solo administradores pueden usar este comando.
     */
    async execute(interaction) {
        try {
            // Verificar permisos de administrador en tiempo de ejecución
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ content: '❌ Solo los administradores pueden usar este comando.', ephemeral: true });
            }

            // Construir modal
            const modal = new ModalBuilder()
                .setCustomId('say_modal')
                .setTitle('Enviar mensaje a través del bot');

            const messageInput = new TextInputBuilder()
                .setCustomId('say_message')
                .setLabel('Mensaje (soporta Markdown y citas)')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setPlaceholder('Pega tu mensaje aquí, incluyendo citas y saltos de línea');

            const row1 = new ActionRowBuilder().addComponents(messageInput);

            modal.addComponents(row1);

            await interaction.showModal(modal);
        } catch (err) {
            console.error('say command error:', err);
            try { await interaction.reply({ content: '❌ Ocurrió un error al abrir el modal.', ephemeral: true }); } catch (e) { /* ignore */ }
        }
    },
};
