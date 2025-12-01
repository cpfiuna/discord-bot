const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isModalSubmit()) return;
        
        if (interaction.customId.startsWith('code_modal_')) {
            const lenguaje = interaction.customId.replace('code_modal_', '');
            const codigo = interaction.fields.getTextInputValue('code_input');

            const embed = new EmbedBuilder()
                .setTitle(`💻 Código en ${lenguaje}`)
                .setDescription(`\`\`\`${lenguaje}\n${codigo}\n\`\`\``)
                .setColor('#3C83F6')
                .setFooter({ text: `Compartido por ${interaction.user.username}` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
    },
};
