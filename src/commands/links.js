const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('links')
        .setDescription('Enlaces y redes sociales del Club de Programación FIUNA'),
    
    async execute(interaction) {
        const os = require('os');
        const instanceId = `${os.hostname()}::${process.pid}`;

        // Defer early to avoid interaction race/timeouts
        let didDefer = false;
        try {
            await interaction.deferReply({ flags: 64 });
            didDefer = true;
        } catch (e) {
            console.error('links: failed to defer reply (may be already acknowledged):', e?.message || e);
        }

        const embed = new EmbedBuilder()
            .setTitle('🔗 Enlaces del Club de Programación FIUNA')
            .setDescription('Seguinos en nuestras redes sociales y mantenete al día con todas nuestras actividades!')
            .setColor('#3C83F6')
            .setThumbnail('https://recursos.cpfiuna.io/Imagenes/Logos/cpf-logo-square.png')
            .addFields(
                {
                    name: '<:githublogo:1445111955479072879> GitHub',
                    value: '[github.com/cpfiuna](https://github.com/cpfiuna)',
                    inline: true
                },
                {
                    name: '<:xlogo:1445111891507806311> X (Twitter)',
                    value: '[x.com/cpfiuna](https://x.com/cpfiuna)',
                    inline: true
                },
                {
                    name: '<:instagramlogo:1445111939653959802> Instagram',
                    value: '[instagram.com/cpfiuna](https://instagram.com/cpfiuna)',
                    inline: true
                },
                {
                    name: '<:youtubelogo:1445111914693791744> YouTube',
                    value: '[youtube.com/@cpfiuna](https://youtube.com/@cpfiuna)',
                    inline: true
                },
                {
                    name: '<:linkedinlogo:1445112192373358683> LinkedIn',
                    value: '[linkedin.com/company/cpfiuna](https://www.linkedin.com/company/cpfiuna)',
                    inline: true
                },
                {
                    name: '<:maillogo:1445114236757086278> Email',
                    value: '[clubdeprogramacion@ing.una.py](mailto:clubdeprogramacion@ing.una.py)',
                    inline: true
                }
            );

        const payload = { embeds: [embed], flags: 64 };

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
                try { 
                    await interaction.followUp(p); 
                } catch (e) { 
                    console.error('links: safeNotify failed:', e); 
                }
            }
        };

        console.log(`links: instance=${instanceId} didDefer=${didDefer}, interaction.deferred=${interaction.deferred}, interaction.replied=${interaction.replied}`);
        await safeNotify(payload);
    },
};
