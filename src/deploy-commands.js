const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];

// Leer todos los archivos de comandos
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
        console.log(`✅ Comando cargado: ${command.data.name}`);
    } else {
        console.log(`⚠️ El comando en ${filePath} no tiene las propiedades 'data' o 'execute' requeridas.`);
    }
}

// Construir y preparar instancia del módulo REST
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// Registrar comandos
(async () => {
    try {
        console.log(`🔄 Comenzando a registrar ${commands.length} comandos slash.`);

        // Registrar comandos en el servidor específico (desarrollo)
        if (process.env.DISCORD_GUILD_ID) {
            const data = await rest.put(
                Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
                { body: commands },
            );
            console.log(`✅ ${data.length} comandos registrados exitosamente en el servidor de desarrollo.`);
        }
        
        // También registrar globalmente (opcional, toma hasta 1 hora en aplicarse)
        // const globalData = await rest.put(
        //     Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
        //     { body: commands },
        // );
        // console.log(`✅ ${globalData.length} comandos registrados globalmente.`);

    } catch (error) {
        console.error('❌ Error registrando comandos:', error);
    }
})();
