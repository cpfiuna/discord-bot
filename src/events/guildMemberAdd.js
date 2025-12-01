const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        const guild = member.guild;

        // Prefer explicit channel from env, fall back to systemChannel, then first writable text channel
        const channelId = process.env.GREETING_CHANNEL_ID;
        let channel = channelId ? guild.channels.cache.get(channelId) : null;

        if (!channel) channel = guild.systemChannel || null;

        if (!channel) {
            channel = guild.channels.cache.find(c => c.isTextBased && c.isTextBased() && c.permissionsFor(guild.members.me)?.has('SendMessages')) || null;
        }

        if (!channel) {
            console.log(`No suitable channel found to send welcome message in guild ${guild.id}`);
            return;
        }

        // Use the test greeting as the canonical welcome embed
        const embed = new EmbedBuilder()
            .setTitle('👋 ¡Bienvenido/a al servidor! 💻')
            .setDescription(`¡Hola <@${member.id}>! Bienvenido al servidor oficial del Club de Programación FIUNA <:cpf:1379350250099179540>. Nos alegra que estés acá.`)
            .setColor('#3C83F6')
            .setThumbnail(member.displayAvatarURL({ extension: 'png', size: 256 }))
            .addFields(
                { name: '', value: 'Este es un espacio para aprender, compartir y construir comunidad entre todos. Sentite libre de presentarte, unirte a las conversaciones y preguntar sobre lo que sea.', inline: false },
                { name: '', value: '¡Disfrutá tu estadía y bienvenido/a a la comunidad!', inline: false }
            );

        try {
            await channel.send({ embeds: [embed] });
        } catch (err) {
            console.error('Failed to send welcome message:', err);
        }
    }
};
