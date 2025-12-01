const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('code')
        .setDescription('Comparte código formateado (límite 4000 caracteres)')
        .addStringOption(option =>
            option
                .setName('lenguaje')
                .setDescription('Selecciona el lenguaje de programación')
                .setRequired(true)
                .addChoices(
                    { name: 'JavaScript', value: 'javascript' },
                    { name: 'TypeScript', value: 'typescript' },
                    { name: 'Python', value: 'python' },
                    { name: 'Java', value: 'java' },
                    { name: 'C', value: 'c' },
                    { name: 'C++', value: 'cpp' },
                    { name: 'C#', value: 'csharp' },
                    { name: 'HTML', value: 'html' },
                    { name: 'CSS', value: 'css' },
                    { name: 'SQL', value: 'sql' },
                    { name: 'Bash', value: 'bash' }
                )),
    
    async execute(interaction) {
        const lenguaje = interaction.options.getString('lenguaje');

        // Create modal for multi-line code input
        const modal = new ModalBuilder()
            .setCustomId(`code_modal_${lenguaje}`)
            .setTitle(`📝 Código en ${lenguaje}`);

        const codeInput = new TextInputBuilder()
            .setCustomId('code_input')
            .setLabel('Escribe o pega tu código aquí')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('function ejemplo() {\n  console.log("Hola mundo!");\n}\n\nSe respetan las líneas y el formato.')
            .setRequired(true)
            .setMaxLength(4000);

        const row = new ActionRowBuilder().addComponents(codeInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    },
};
