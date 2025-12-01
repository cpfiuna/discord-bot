const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('emojis')
        .setDescription('Lista todos los emojis personalizados del servidor con sus IDs'),
    
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;
        const emojis = guild.emojis.cache;

        if (emojis.size === 0) {
            return interaction.editReply('No hay emojis personalizados en este servidor.');
        }

        const embed = new EmbedBuilder()
            .setTitle('🎨 Emojis Personalizados del Servidor')
            .setColor('#3C83F6')
            .setDescription('Aquí están todos los emojis personalizados con sus IDs y formato de uso:');

        // Group emojis in fields (Discord has a limit of 25 fields)
        const emojiList = emojis.map(emoji => {
            const format = emoji.animated ? `<a:${emoji.name}:${emoji.id}>` : `<:${emoji.name}:${emoji.id}>`;
            return `${emoji} **${emoji.name}**\n\`${format}\`\nID: \`${emoji.id}\``;
        });

        // Split into chunks if too many emojis
        const chunkSize = 10;
        for (let i = 0; i < emojiList.length; i += chunkSize) {
            const chunk = emojiList.slice(i, i + chunkSize);
            embed.addFields({
                name: i === 0 ? 'Emojis' : '\u200b',
                value: chunk.join('\n\n'),
                inline: false
            });
        }

        await interaction.editReply({ embeds: [embed] });
    },
};
