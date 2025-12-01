const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Responde con Pong!'),
    
    async execute(interaction) {
        const os = require('os');
        const instanceId = `${os.hostname()}::${process.pid}`;

        // Defer early to avoid interaction race/timeouts
        let didDefer = false;
        try {
            await interaction.deferReply({ flags: 64 });
            didDefer = true;
        } catch (e) {
            console.error('ping: failed to defer reply (may be already acknowledged):', e?.message || e);
        }

        const embed = new EmbedBuilder()
            // Use a thin space (U+2009) between the emoji and text for a smaller gap
            .setTitle('🏓\u2009\u2009Pong!')
            .setColor('#3C83F6');

        const payload = { embeds: [embed], flags: 64 };

        // safe notify helper inline
        const safeNotify = async (p) => {
            try {
                if (didDefer) {
                    await interaction.editReply(p);
                } else if (interaction.replied) {
                    await interaction.followUp(p);
                } else {
                    await interaction.reply(p);
                }
            } catch (err) {
                try { await interaction.followUp(p); } catch (e) { console.error('ping: safeNotify failed:', e); }
            }
        };

        console.log(`ping: instance=${instanceId} didDefer=${didDefer}, interaction.deferred=${interaction.deferred}, interaction.replied=${interaction.replied}`);
        await safeNotify(payload);
    },
};
