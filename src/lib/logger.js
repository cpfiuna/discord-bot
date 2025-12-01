const { EmbedBuilder } = require('discord.js');
const os = require('os');

function shortStack(error) {
    if (!error) return 'No error information';
    const s = (error.stack || error.message || String(error));
    // Keep embed small: limit to ~1900 chars
    return s.length > 1900 ? s.slice(0, 1897) + '...' : s;
}

async function sendError(client, { commandName, interaction, error, instanceId }) {
    if (!process.env.LOG_CHANNEL_ID) {
        console.error('LOG_CHANNEL_ID not configured — fallback logging:');
        console.error(commandName, error);
        return;
    }

    try {
        const ch = await client.channels.fetch(process.env.LOG_CHANNEL_ID).catch(() => null);
        if (!ch || !(ch.isTextBased && ch.isTextBased())) {
            console.error('Configured LOG_CHANNEL_ID is not a text channel or could not be fetched.');
            return;
        }

        const user = interaction?.user;
        const guild = interaction?.guild;
        const channel = interaction?.channel;

        const embed = new EmbedBuilder()
            .setTitle(`❌ Error ejecutando comando /${commandName}`)
            .setColor(0xE74C3C)
            .addFields(
                { name: 'Usuario', value: user ? `${user.tag} (${user.id})` : 'Desconocido', inline: true },
                { name: 'Canal', value: channel ? `#${channel.name || channel.id} (${channel.id})` : (interaction ? `ID: ${interaction.channelId || 'unknown'}` : 'Desconocido'), inline: true },
                { name: 'Servidor', value: guild ? `${guild.name} (${guild.id})` : 'Direct/Desconocido', inline: false },
                { name: 'Instancia', value: instanceId || `${os.hostname()}::${process.pid}`, inline: true },
                { name: 'Error', value: '```' + shortStack(error) + '```', inline: false }
            )
            .setTimestamp(new Date());

        await ch.send({ embeds: [embed] });
    } catch (e) {
        console.error('Failed to send error log to LOG_CHANNEL_ID:', e);
    }
}

module.exports = { sendError };

async function sendUsage(client, { commandName, interaction, instanceId }) {
    if (!process.env.LOG_CHANNEL_ID) return;

    try {
        const ch = await client.channels.fetch(process.env.LOG_CHANNEL_ID).catch(() => null);
        if (!ch || !(ch.isTextBased && ch.isTextBased())) return;

        const user = interaction?.user;
        const guild = interaction?.guild;
        const channel = interaction?.channel;

        // Build a short description of options if present
        let optionsDesc = 'Ninguna';
        try {
            if (interaction && interaction.options && typeof interaction.options.data !== 'undefined') {
                const opts = interaction.options.data.map(o => `${o.name}: ${o.value ?? '[object]'}`);
                if (opts.length) optionsDesc = opts.join(', ');
            }
        } catch (e) {
            optionsDesc = 'Error leyendo opciones';
        }

        const embed = new EmbedBuilder()
            .setTitle(`⚡ Comando ejecutado: /${commandName}`)
            .setColor(0x3498DB)
            .addFields(
                { name: 'Usuario', value: user ? `${user.tag} (${user.id})` : 'Desconocido', inline: true },
                { name: 'Canal', value: channel ? `#${channel.name || channel.id} (${channel.id})` : (interaction ? `ID: ${interaction.channelId || 'unknown'}` : 'Desconocido'), inline: true },
                { name: 'Servidor', value: guild ? `${guild.name} (${guild.id})` : 'Direct/Desconocido', inline: false },
                { name: 'Opciones', value: optionsDesc, inline: false },
                { name: 'Instancia', value: instanceId || `${require('os').hostname()}::${process.pid}`, inline: true }
            )
            .setTimestamp(new Date());

        await ch.send({ embeds: [embed] });
    } catch (e) {
        console.error('Failed to send usage log to LOG_CHANNEL_ID:', e);
    }
}

module.exports = { sendError, sendUsage };

