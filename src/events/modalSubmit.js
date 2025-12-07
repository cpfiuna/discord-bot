const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isModalSubmit()) return;

        // Handle /say modal submissions
        if (interaction.customId === 'say_modal') {
            try {
                const text = interaction.fields.getTextInputValue('say_message') || '';

                if (!text || text.trim().length === 0) {
                    await interaction.reply({ content: '❌ El mensaje no puede estar vacío.', ephemeral: true });
                    return;
                }

                // Acknowledge to the submitter and send the message publicly in the same channel
                await interaction.reply({ content: 'Mensaje enviado.', ephemeral: true });

                const ch = interaction.channel;
                if (!ch || !ch.isTextBased()) {
                    try { await interaction.followUp({ content: 'No se puede enviar el mensaje: el canal no es textual.', ephemeral: true }); } catch (e) { /* ignore */ }
                    return;
                }

                await ch.send({ content: text });
            } catch (err) {
                console.error('say_modal submit error:', err);
                try { await interaction.reply({ content: '❌ Error al enviar el mensaje.', ephemeral: true }); } catch (e) { /* ignore */ }
            }

            return;
        }

        // Existing code modal handling
        if (interaction.customId.startsWith('code_modal_')) {
            const lenguaje = interaction.customId.replace('code_modal_', '');
            const codigo = interaction.fields.getTextInputValue('code_input');

            // Validate code input
            if (!codigo || codigo.trim().length === 0) {
                try {
                    await interaction.reply({ content: '❌ El código no puede estar vacío.', ephemeral: true });
                } catch (error) {
                    console.error('Error responding to empty code submission:', error);
                }
                return;
            }

            try {
                const embed = new EmbedBuilder()
                    .setTitle(`💻 Código en ${lenguaje}`)
                    .setDescription(`\`\`\`${lenguaje}\n${codigo}\n\`\`\``)
                    .setColor('#3C83F6')
                    .setFooter({ text: `Compartido por ${interaction.user.username}` })
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
            } catch (error) {
                console.error('Error submitting code modal:', error);
                try {
                    await interaction.reply({ content: '❌ Ocurrió un error al compartir el código.', ephemeral: true });
                } catch (replyError) {
                    console.error('Error sending error message:', replyError);
                }
            }
        }
    },
};
