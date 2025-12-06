const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Muestra ayuda detallada sobre los comandos del bot')
        .addStringOption(option =>
            option
                .setName('comando')
                .setDescription('Ver ayuda detallada de un comando específico')
                .setRequired(false)
                .addChoices(
                    { name: 'info', value: 'info' },
                    { name: 'links', value: 'links' },
                    { name: 'encuesta', value: 'encuesta' },
                    { name: 'sala', value: 'sala' },
                    { name: 'code', value: 'code' },
                    { name: 'recordar', value: 'recordar' },
                    { name: 'ping', value: 'ping' }
                )),
    
    async execute(interaction) {
        const os = require('os');
        const instanceId = `${os.hostname()}::${process.pid}`;

        // Defer early to avoid interaction race/timeouts
        let didDefer = false;
        try {
            await interaction.deferReply({ flags: 64 });
            didDefer = true;
        } catch (e) {
            console.error('help: failed to defer reply (may be already acknowledged):', e?.message || e);
        }

        const comandoEspecifico = interaction.options.getString('comando');

        // Helper function to safely notify
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
                    console.error('help: safeNotify failed:', e); 
                }
            }
        };

        // Define command categories and details
        const commandDetails = {
            info: {
                category: '📚 Información',
                usage: '/info',
                description: 'Muestra información detallada sobre el Club de Programación FIUNA, su misión, actividades y cómo unirse.',
                examples: ['`/info` - Ver información del club']
            },
            links: {
                category: '📚 Información',
                usage: '/links',
                description: 'Muestra todos los enlaces y redes sociales del Club de Programación FIUNA (GitHub, X, Instagram, YouTube, LinkedIn, Email).',
                examples: ['`/links` - Ver todas las redes sociales']
            },
            encuesta: {
                category: '🛠️ Utilidades',
                usage: '/encuesta <pregunta> <opcion1> <opcion2> [opcion3] [opcion4]',
                description: 'Crea una encuesta rápida con 2 a 4 opciones. Los miembros pueden votar usando reacciones.',
                examples: [
                    '`/encuesta pregunta:"¿Lenguaje favorito?" opcion1:"JavaScript" opcion2:"Python" opcion3:"Java"`',
                    '`/encuesta pregunta:"¿Reunión presencial?" opcion1:"Sí" opcion2:"No"`'
                ]
            },
            sala: {
                category: '🎙️ Salas de Voz',
                usage: '/sala <crear|unirse|listar>',
                description: 'Gestiona salas de voz temporales para estudio o proyectos. Las salas se eliminan automáticamente después de 1 minuto de estar vacías.',
                examples: [
                    '`/sala crear nombre:"Estudio Python" descripcion:"Estudiando para el final" limite:5`',
                    '`/sala listar` - Ver todas las salas disponibles',
                    '`/sala unirse nombre:"Estudio Python"` - Información sobre una sala específica',
                    '**Nota:** Las salas vacías se eliminan automáticamente tras 1 minuto sin miembros'
                ]
            },
            code: {
                category: '💻 Código',
                usage: '/code <lenguaje>',
                description: 'Comparte código formateado. Selecciona el lenguaje, apretá enter y se abrirá un formulario para pegar tu código con formato preservado.',
                examples: [
                    '`/code lenguaje:"JavaScript"` - Compartir código JavaScript',
                    '`/code lenguaje:"Python"` - Compartir código Python',
                    'Soporta: JavaScript, TypeScript, Python, Java, C, C++, C#, HTML, CSS, SQL, Bash'
                ]
            },
            recordar: {
                category: '🛠️ Utilidades',
                usage: '/recordar <crear|listar|cancelar>',
                description: 'Crea y gestiona recordatorios personales o globales. Los recordatorios globales solo pueden ser creados por Admin/Comisión/Lead.',
                examples: [
                    '`/recordar crear mensaje:"Reunión del club" minutos:30` - Recordatorio personal en 30 minutos',
                    '`/recordar crear mensaje:"Hackathon" fecha:"15/12/2025 10:00"` - Recordatorio en fecha específica',
                    '`/recordar crear mensaje:"Evento importante" minutos:60 global:True` - Recordatorio global (requiere permisos)',
                    '`/recordar listar` - Ver todos tus recordatorios activos',
                    '`/recordar cancelar id:123456789` - Cancelar un recordatorio específico'
                ]
            },
            ping: {
                category: '🔧 Sistema',
                usage: '/ping',
                description: 'Verifica si el bot está funcionando correctamente.',
                examples: ['`/ping` - Responde con "Pong!"']
            }
        };

        // If specific command requested, show detailed help
        if (comandoEspecifico && commandDetails[comandoEspecifico]) {
            const cmd = commandDetails[comandoEspecifico];
            const embed = new EmbedBuilder()
                .setTitle(`📖 Ayuda: /${comandoEspecifico}`)
                .setColor('#3C83F6')
                .setDescription(cmd.description)
                .addFields(
                    { name: '📂 Categoría', value: cmd.category, inline: true },
                    { name: '💡 Uso', value: `\`${cmd.usage}\``, inline: false },
                    { name: '📝 Ejemplos', value: cmd.examples.join('\n'), inline: false }
                )
                .setFooter({ text: 'Usa /help para ver todos los comandos' });

            const payload = { embeds: [embed], flags: 64 };
            await safeNotify(payload);
            return;
        }

        // Show general help with all categories
        const embed = new EmbedBuilder()
            .setTitle('📚 Ayuda del Bot - Club de Programación FIUNA')
            .setDescription('Bienvenido al sistema de ayuda. Acá encontrarás todos los comandos organizados por categoría.')
            .setColor('#3C83F6')
            .setThumbnail('https://recursos.cpfiuna.io/Imagenes/Logos/cpf-logo-square.png');

        // Group commands by category
        const categories = {
            '📚 Información': [],
            '💻 Código': [],
            '🛠️ Utilidades': [],
            '🎙️ Salas de Voz': [],
            '🔧 Sistema': []
        };

        for (const [cmdName, details] of Object.entries(commandDetails)) {
            if (categories[details.category]) {
                categories[details.category].push(`- \`/${cmdName}\` - ${details.description.split('.')[0]}`);
            }
        }

        // Add fields for each category
        for (const [category, commands] of Object.entries(categories)) {
            if (commands.length > 0) {
                embed.addFields({
                    name: category,
                    value: commands.join('\n'),
                    inline: false
                });
            }
        }

        embed.addFields({
            name: '💡 Consejo',
            value: 'Usa `/help comando:<nombre>` para ver ejemplos y detalles de uso de cada comando.\nEjemplo: `/help comando:encuesta`',
            inline: false
        });

        embed.setFooter({ text: 'Club de Programación FIUNA | Lista de Comandos' });

        const payload = { embeds: [embed], flags: 64 };

        console.log(`help: instance=${instanceId} didDefer=${didDefer}, interaction.deferred=${interaction.deferred}, interaction.replied=${interaction.replied}`);
        await safeNotify(payload);
    },
};
