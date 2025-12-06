const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('emojis')
        .setDescription('Lista todos los emojis personalizados del servidor con sus IDs'),
    
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        // Check if command is used in a guild
        if (!interaction.guild) {
            return interaction.editReply('Este comando solo puede usarse en un servidor.');
        }

        const guild = interaction.guild;
        const emojis = guild.emojis.cache;

        if (emojis.size === 0) {
            return interaction.editReply('No hay emojis personalizados en este servidor.');
        }

        try {
            const embed = new EmbedBuilder()
                .setTitle('🎨 Emojis Personalizados del Servidor')
                .setColor('#3C83F6')
                .setDescription('Aquí están todos los emojis personalizados con sus IDs y formato de uso:');

            // Group emojis in fields (Discord has a limit of 25 fields and 6000 chars total)
            const emojiList = emojis.map(emoji => {
                const format = emoji.animated ? `<a:${emoji.name}:${emoji.id}>` : `<:${emoji.name}:${emoji.id}>`;
                return `${emoji} **${emoji.name}**\n\`${format}\`\nID: \`${emoji.id}\``;
            });

            // Respect Discord's 25 field limit and approximate char limit
            const chunkSize = 10;
            const maxFields = 25;
            let fieldCount = 0;
            
            for (let i = 0; i < emojiList.length && fieldCount < maxFields; i += chunkSize) {
                const chunk = emojiList.slice(i, i + chunkSize);
                const fieldValue = chunk.join('\n\n');
                
                // Check if adding this field would exceed limits
                if (fieldValue.length > 1024) {
                    // Split the chunk further if it's too long
                    const smallerChunk = chunk.slice(0, 5);
                    embed.addFields({
                        name: i === 0 ? 'Emojis' : '\u200b',
                        value: smallerChunk.join('\n\n'),
                        inline: false
                    });
                    fieldCount++;
                    // Process remaining emojis in next iteration
                    i -= (chunkSize - 5);
                } else {
                    embed.addFields({
                        name: i === 0 ? 'Emojis' : '\u200b',
                        value: fieldValue,
                        inline: false
                    });
                    fieldCount++;
                }
            }

            if (fieldCount >= maxFields && emojiList.length > fieldCount * chunkSize) {
                embed.setFooter({ text: `Mostrando primeros ${fieldCount * chunkSize} de ${emojiList.length} emojis` });
            }

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in emojis command:', error);
            await interaction.editReply('Ocurrió un error al listar los emojis.').catch(console.error);
        }
    },
};
