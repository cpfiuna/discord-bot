const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const os = require('os');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botstats')
        .setDescription('Muestra estadísticas del bot (solo administradores)')
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
            const client = interaction.client;

            // Calculate uptime
            const uptime = process.uptime();
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor((uptime % 86400) / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);
            const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

            // Memory usage
            const memUsage = process.memoryUsage();
            const memUsedMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
            const memTotalMB = (memUsage.heapTotal / 1024 / 1024).toFixed(2);
            const memRssMB = (memUsage.rss / 1024 / 1024).toFixed(2);

            // System info
            const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
            const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
            const usedMem = (totalMem - freeMem).toFixed(2);
            const memPercent = ((usedMem / totalMem) * 100).toFixed(1);

            // Guild and user stats
            const guildCount = client.guilds.cache.size;
            let totalMembers = 0;
            let totalChannels = 0;
            
            client.guilds.cache.forEach(guild => {
                totalMembers += guild.memberCount;
                totalChannels += guild.channels.cache.size;
            });

            // CPU info
            const cpus = os.cpus();
            const cpuModel = cpus[0].model;
            const cpuCount = cpus.length;

            // Platform info
            const platform = os.platform();
            const nodeVersion = process.version;
            const instanceId = `${os.hostname()}::${process.pid}`;

            // Discord.js version
            const djsVersion = require('discord.js').version;

            const embed = new EmbedBuilder()
                .setTitle('📊 Estadísticas del Bot')
                .setColor('#3C83F6')
                .setDescription(`Información del sistema y estadísticas de uso`)
                .addFields(
                    {
                        name: '⏱️ Tiempo Activo',
                        value: `\`${uptimeString}\`\nDesde: <t:${Math.floor(Date.now() / 1000 - uptime)}:F>`,
                        inline: true
                    },
                    {
                        name: '🌐 Servidores',
                        value: `\`${guildCount}\` servidor${guildCount !== 1 ? 'es' : ''}\n\`${totalMembers}\` miembros totales\n\`${totalChannels}\` canales`,
                        inline: true
                    },
                    {
                        name: '💾 Memoria del Bot',
                        value: `Heap: \`${memUsedMB}\` / \`${memTotalMB}\` MB\nRSS: \`${memRssMB}\` MB`,
                        inline: true
                    },
                    {
                        name: '🖥️ Memoria del Sistema',
                        value: `\`${usedMem}\` / \`${totalMem}\` GB (${memPercent}%)\nLibre: \`${freeMem}\` GB`,
                        inline: true
                    },
                    {
                        name: '⚙️ CPU',
                        value: `\`${cpuModel}\`\nNúcleos: \`${cpuCount}\``,
                        inline: true
                    },
                    {
                        name: '🔧 Sistema',
                        value: `Plataforma: \`${platform}\`\nNode.js: \`${nodeVersion}\`\nDiscord.js: \`v${djsVersion}\``,
                        inline: true
                    },
                    {
                        name: '🆔 Instancia',
                        value: `\`${instanceId}\``,
                        inline: false
                    }
                )
                .setFooter({ text: `Solicitado por ${interaction.user.tag}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

            console.log(`Bot stats viewed by ${interaction.user.tag}`);

        } catch (error) {
            console.error('Error getting bot stats:', error);
            await interaction.editReply({
                content: `❌ Error al obtener estadísticas: ${error.message}`
            }).catch(() => {});
        }
    },
};
