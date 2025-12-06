const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Muestra información detallada del servidor (solo administradores)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        // Double-check permissions at runtime
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ 
                content: '❌ Solo los administradores pueden usar este comando.', 
                flags: 64 
            });
        }

        await interaction.deferReply({ flags: 64 });

        try {
            const guild = interaction.guild;

            // Fetch owner
            const owner = await guild.fetchOwner().catch(() => null);

            // Channel counts by type
            const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
            const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
            const categories = guild.channels.cache.filter(c => c.type === 4).size;
            const totalChannels = guild.channels.cache.size;

            // Member stats
            const totalMembers = guild.memberCount;
            const botCount = guild.members.cache.filter(m => m.user.bot).size;
            const humanCount = totalMembers - botCount;

            // Role count
            const roleCount = guild.roles.cache.size;

            // Boost info
            const boostLevel = guild.premiumTier;
            const boostCount = guild.premiumSubscriptionCount || 0;

            // Verification level
            const verificationLevels = {
                0: 'Ninguno',
                1: 'Bajo',
                2: 'Medio',
                3: 'Alto',
                4: 'Muy Alto'
            };
            const verificationLevel = verificationLevels[guild.verificationLevel] || 'Desconocido';

            // Creation date
            const createdTimestamp = Math.floor(guild.createdTimestamp / 1000);

            // Features
            const features = guild.features.length > 0 
                ? guild.features.slice(0, 5).map(f => `\`${f}\``).join(', ') + (guild.features.length > 5 ? '...' : '')
                : 'Ninguna';

            const embed = new EmbedBuilder()
                .setTitle(`📋 Información del Servidor`)
                .setColor('#3C83F6')
                .setThumbnail(guild.iconURL({ size: 256 }))
                .addFields(
                    {
                        name: '🏷️ Nombre',
                        value: `\`${guild.name}\``,
                        inline: true
                    },
                    {
                        name: '🆔 ID',
                        value: `\`${guild.id}\``,
                        inline: true
                    },
                    {
                        name: '👑 Dueño',
                        value: owner ? `${owner.user.tag}\n<@${owner.id}>` : 'Desconocido',
                        inline: true
                    },
                    {
                        name: '👥 Miembros',
                        value: `Total: \`${totalMembers}\`\nHumanos: \`${humanCount}\`\nBots: \`${botCount}\``,
                        inline: true
                    },
                    {
                        name: '📁 Canales',
                        value: `Total: \`${totalChannels}\`\nTexto: \`${textChannels}\`\nVoz: \`${voiceChannels}\`\nCategorías: \`${categories}\``,
                        inline: true
                    },
                    {
                        name: '🎭 Roles',
                        value: `\`${roleCount}\` roles`,
                        inline: true
                    },
                    {
                        name: '🚀 Boost',
                        value: `Nivel: \`${boostLevel}\`\nBoosts: \`${boostCount}\``,
                        inline: true
                    },
                    {
                        name: '🔒 Verificación',
                        value: `\`${verificationLevel}\``,
                        inline: true
                    },
                    {
                        name: '📅 Creado',
                        value: `<t:${createdTimestamp}:F>\n<t:${createdTimestamp}:R>`,
                        inline: true
                    }
                );

            if (guild.description) {
                embed.addFields({
                    name: '📝 Descripción',
                    value: guild.description,
                    inline: false
                });
            }

            embed.addFields({
                name: '✨ Características',
                value: features,
                inline: false
            });

            if (guild.banner) {
                embed.setImage(guild.bannerURL({ size: 512 }));
            }

            embed.setFooter({ text: `Solicitado por ${interaction.user.tag}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

            console.log(`Server info viewed by ${interaction.user.tag} in ${guild.name}`);

        } catch (error) {
            console.error('Error getting server info:', error);
            await interaction.editReply({
                content: `❌ Error al obtener información del servidor: ${error.message}`
            }).catch(() => {});
        }
    },
};
