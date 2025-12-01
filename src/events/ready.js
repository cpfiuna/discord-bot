module.exports = {
    // Use 'clientReady' to follow discord.js v15+ naming and avoid deprecation warnings
    name: 'clientReady',
    once: true,
    execute(client) {
        // ASCII banner (use an array of single-quoted lines so backticks ` appear verbatim)
        //https://patorjk.com/software/taag/#p=display&f=Roman&t=%3C%2Fcpf-bot%3E&x=none&v=4&h=4&w=80&we=false
        const banner = [                                                                                        
                "            88                       .o88o.          .o8                     .         ",
                "   .dP     .8'                       888 `\"         \"888                   .o8   Yb    ",
                " .dP      .8'   .ooooo.  oo.ooooo.  o888oo           888oooo.   .ooooo.  .o888oo  `Yb  ",
                "dP       .8'   d88' `\"Y8  888' `88b  888             d88' `88b d88' `88b   888      `Yb",
                "Yb      .8'    888        888   888  888    8888888  888   888 888   888   888      .dP",
                " `Yb   .8'     888   .o8  888   888  888             888   888 888   888   888 .  .dP  ",
                "   `Yb 88      `Y8bod8P'  888bod8P' o888o            `Y8bod8P' `Y8bod8P'   \"888\" dP    ",
                "                          888                                                          ",
                "                         o888o                                                         ",
        ].join('\n');

        console.log(banner);
        console.log(`¡${client.user.tag} está conectado y listo!`);

        // Use configurable presence text (falls back to a sensible Spanish default)
        const { ActivityType } = require('discord.js');
        const presenceText = process.env.BOT_PRESENCE || 'Listo — usa "/" para comandos';
        client.user.setActivity(presenceText, { type: ActivityType.Watching });

        // Send a startup log identifying this instance (hostname + PID)
        try {
            const os = require('os');
            const instanceId = `${os.hostname()}::${process.pid}`;
            console.log(`Instance startup id=${instanceId}`);

            if (process.env.LOG_CHANNEL_ID) {
                client.channels.fetch(process.env.LOG_CHANNEL_ID)
                    .then(ch => {
                        if (ch && ch.isTextBased && ch.isTextBased()) {
                            ch.send({ content: `✅ Bot started on instance **${instanceId}** at ${new Date().toISOString()}` })
                                .catch(e => console.error('Failed to send startup log to channel:', e));
                        }
                    })
                    .catch(e => console.error('Failed to fetch log channel on ready:', e));
            }
        } catch (e) {
            console.error('Error while sending startup diagnostics:', e);
        }
    },
};
