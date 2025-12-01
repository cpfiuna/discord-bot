const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    // mark as non-public so it doesn't appear in the `/commands` listing
    public: false,
    data: new SlashCommandBuilder()
        .setName('testgreeting')
        .setDescription('Enviar un saludo de prueba al canal de bienvenida configurado')
        .addUserOption(option => option.setName('user').setDescription('Usuario a saludar').setRequired(false)),

    async execute(interaction) {
        const guild = interaction.guild;
        const targetUser = interaction.options.getUser('user') || interaction.user;

        // Acknowledge early to avoid interaction timeouts when sending messages to other channels
        let didDefer = false;
        try {
            // `ephemeral` in response options is deprecated; use flags (64) for ephemeral responses
            await interaction.deferReply({ flags: 64 });
            didDefer = true;
        } catch (e) {
            // If already acknowledged, we'll handle that later when sending the final response
            console.error('Warning: failed to defer reply (may be already acknowledged):', e?.message || e);
        }

        // For testing, send the greeting to the channel where the command was invoked.
        let channel = interaction.channel;

        const os = require('os');
        const instanceId = `${os.hostname()}::${process.pid}`;

        // Helper to reply/edit/followUp depending on whether we deferred
        const safeNotify = async (payload) => {
            try {
                if (didDefer) {
                    await interaction.editReply(payload);
                } else if (interaction.replied) {
                    await interaction.followUp(payload);
                } else {
                    await interaction.reply(payload);
                }
            } catch (e) {
                try { await interaction.followUp(payload); } catch (ee) { console.error('safeNotify failed:', ee); }
            }
        };

        // If for some reason interaction.channel is not available or not writable, fall back to configured channel or system channel.
        if (!channel || !(channel.isTextBased && channel.permissionsFor(guild.members.me)?.has('SendMessages'))) {
            const channelId = process.env.GREETING_CHANNEL_ID;
            channel = channelId ? guild.channels.cache.get(channelId) : null;
            if (!channel) channel = guild.systemChannel || null;
            if (!channel) {
                channel = guild.channels.cache.find(c => c.isTextBased && c.permissionsFor(guild.members.me)?.has('SendMessages')) || null;
            }
        }

        if (!channel) {
            const payload = { content: 'No hay ningún canal disponible para enviar el saludo.', flags: 64 };
            await safeNotify(payload);
            return;
        }

        // Build the same produced embed used by the join handler
        const embed = new EmbedBuilder()
            .setTitle('👋 ¡Bienvenido/a al servidor! 💻')
            .setDescription(`¡Hola <@${targetUser.id}>! Bienvenido al servidor oficial del Club de Programación FIUNA <:cpf:1379350250099179540>. Nos alegra que estés acá.`)
            .setColor('#3C83F6')
            .setThumbnail(targetUser.displayAvatarURL ? targetUser.displayAvatarURL({ extension: 'png', size: 256 }) : null)
            .addFields(
                { name: '', value: 'Este es un espacio para aprender, compartir y construir comunidad entre todos. Sentite libre de presentarte, unirte a las conversaciones y preguntar sobre lo que sea.', inline: false },
                { name: '', value: '¡Disfrutá tu estadía y bienvenido/a a la comunidad!', inline: false }
            )
        
        try {
            await channel.send({ embeds: [embed] });

            const successPayload = { content: `Saludo enviado a <#${channel.id}>.` };

            // Diagnostic logging to help debug Unknown interaction (10062) issues
            console.log(`testgreeting: instance=${instanceId} didDefer=${didDefer}, interaction.deferred=${interaction.deferred}, interaction.replied=${interaction.replied}`);

            try {
                await safeNotify({ ...successPayload, flags: 64 });
            } catch (replyErr) {
                console.error('Failed to notify user after sending greeting (safeNotify):', replyErr);
            }
        } catch (err) {
            console.error('Failed to send test greeting:', err);
            const failPayload = { content: 'Error al enviar el saludo. Revisa los permisos y el ID del canal.' };
            console.log(`testgreeting (error path): instance=${instanceId} didDefer=${didDefer}, interaction.deferred=${interaction.deferred}, interaction.replied=${interaction.replied}`);
            try {
                await safeNotify({ ...failPayload, flags: 64 });
            } catch (replyErr) {
                console.error('Failed to notify user of greeting error (safeNotify):', replyErr);
            }
        }
    },
};
