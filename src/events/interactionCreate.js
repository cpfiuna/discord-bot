const { Collection } = require('discord.js');

// Map of commandName -> Map of userId -> timestamp
const cooldowns = new Collection();

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        // Manejar comandos slash
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`❌ No se encontró el comando ${interaction.commandName}.`);
                return;
            }

            // Cooldown handling
            const now = Date.now();
            const cooldownAmount = (command.cooldown || parseInt(process.env.COMMAND_COOLDOWN || '3')) * 1000;

            if (!cooldowns.has(command.data.name)) {
                cooldowns.set(command.data.name, new Collection());
            }

            const timestamps = cooldowns.get(command.data.name);
            const userId = interaction.user.id;
            if (timestamps.has(userId)) {
                const expirationTime = timestamps.get(userId) + cooldownAmount;
                if (now < expirationTime) {
                    const timeLeft = Math.ceil((expirationTime - now) / 1000);
                    return interaction.reply({ content: `Enfriamiento: espera ${timeLeft}s antes de usar /${command.data.name} de nuevo.`, flags: 64 });
                }
            }

            timestamps.set(userId, now);
            setTimeout(() => timestamps.delete(userId), cooldownAmount);

            try {
                await command.execute(interaction);

                // Report successful usage to logs (non-blocking)
                try {
                    const logger = require('../lib/logger');
                    const os = require('os');
                    const instanceId = `${os.hostname()}::${process.pid}`;
                    logger.sendUsage(interaction.client, { commandName: command.data?.name || interaction.commandName, interaction, instanceId })
                        .catch(e => console.error('Logger sendUsage failed:', e));
                } catch (e) {
                    console.error('Failed to route usage to logger helper:', e);
                }

            } catch (error) {
                console.error('Error ejecutando comando:', error);

                // If the error is caused by a race between multiple instances (interaction already acknowledged
                // or unknown interaction), don't flood the log channel with those expected race errors.
                const isInteractionRace = error && (error.code === 40060 || error.code === 10062);
                if (!isInteractionRace) {
                    try {
                        const logger = require('../lib/logger');
                        const os = require('os');
                        const instanceId = `${os.hostname()}::${process.pid}`;
                        logger.sendError(interaction.client, { commandName: command.data?.name || interaction.commandName, interaction, error, instanceId })
                            .catch(e => console.error('Logger sendError failed:', e));
                    } catch (e) {
                        console.error('Failed to route error to logger helper:', e);
                    }
                } else {
                    // Log to console for diagnostics but avoid sending to LOG_CHANNEL_ID
                    console.warn('Interaction race detected; skipping log channel report for error code', error.code);
                }

                const errorMessage = {
                    content: '❌ Hubo un error al ejecutar este comando.',
                    flags: 64
                };

                try {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp(errorMessage);
                    } else {
                        await interaction.reply(errorMessage);
                    }
                } catch (replyErr) {
                    // Interaction may be expired or otherwise invalid (10062). Log and move on.
                    console.error('No se pudo responder al interaction con el mensaje de error:', replyErr);
                }
            }
        }
        
        // Manejar botones y selectores (para futuras funcionalidades)
        else if (interaction.isButton()) {
            // Lógica para botones
            console.log(`🔘 Botón presionado: ${interaction.customId}`);
        }
        
        else if (interaction.isStringSelectMenu()) {
            // Lógica para menús desplegables
            console.log(`📋 Menú seleccionado: ${interaction.customId}`);
        }
    },
};
