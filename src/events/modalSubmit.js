const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isModalSubmit()) return;
        
        if (interaction.customId.startsWith('code_modal_')) {
            const lenguaje = interaction.customId.replace('code_modal_', '');
            const codigo = interaction.fields.getTextInputValue('code_input');

            // Validate code input
            if (!codigo || codigo.trim().length === 0) {
                try {
                    await interaction.reply({ 
                        content: '❌ El código no puede estar vacío.', 
                        flags: 64 
                    });
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
                    await interaction.reply({ 
                        content: '❌ Ocurrió un error al compartir el código.', 
                        flags: 64 
                    });
                } catch (replyError) {
                    console.error('Error sending error message:', replyError);
                }
            }
        }
    },
};
