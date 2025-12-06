const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Removed unused utils to keep the bot minimal (only ping command)

// Crear cliente de Discord con los intents necesarios
const client = new Client({
    intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildVoiceStates
    ]
});

// Inicializar colecciones
client.commands = new Collection();

// Cargar comandos
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`✅ Comando cargado: ${command.data.name}`);
    } else {
        console.log(`⚠️ El comando en ${filePath} no tiene las propiedades 'data' o 'execute' requeridas.`);
    }
}

// Cargar eventos
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
    console.log(`✅ Evento cargado: ${event.name}`);
}

// Manejar errores
process.on('unhandledRejection', async (error) => {
    console.error('Unhandled promise rejection:', error);
    // forward to log channel if configured
    try {
        if (process.env.LOG_CHANNEL_ID && client) {
            const ch = await client.channels.fetch(process.env.LOG_CHANNEL_ID).catch(() => null);
            if (ch && ch.isTextBased()) {
                const text = `Unhandled rejection: ${error && (error.stack || error.message) ? (error.stack || error.message) : String(error)}`;
                await ch.send({ content: text });
            }
        }
    } catch (e) {
        console.error('Failed to send unhandledRejection to log channel:', e);
    }
});
// Validate token presence before attempting to login
if (!process.env.DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN is not set. Create a `.env` file with DISCORD_TOKEN=your_token');
    process.exit(1);
}

// Iniciar el bot with safe error handling
(async () => {
    try {
        await client.login(process.env.DISCORD_TOKEN);
    } catch (err) {
        console.error('❌ Failed to login. Please verify `DISCORD_TOKEN` in your .env file is correct.');
        console.error(err);
        process.exit(1);
    }
})();
