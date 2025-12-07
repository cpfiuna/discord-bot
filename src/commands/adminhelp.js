const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('adminhelp')
        .setDescription('Muestra ayuda detallada sobre comandos de administración (solo administradores)')
        .addStringOption(option =>
            option
                .setName('comando')
                .setDescription('Ver ayuda detallada de un comando específico')
                .setRequired(false)
                .addChoices(
                    { name: 'setpresence', value: 'setpresence' },
                    { name: 'setgreeting', value: 'setgreeting' },
                    { name: 'setlogchannel', value: 'setlogchannel' },
                    { name: 'botstats', value: 'botstats' },
                    { name: 'serverinfo', value: 'serverinfo' },
                    { name: 'shutdown', value: 'shutdown' },
                    { name: 'say', value: 'say' },
                    { name: 'imagen', value: 'imagen' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        try {
            // Double-check permissions at runtime
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ 
                    content: '❌ Solo los administradores pueden usar este comando.', 
                    ephemeral: true
                });
            }

            await interaction.deferReply({ ephemeral: true });

        const comandoEspecifico = interaction.options.getString('comando');

        // Define admin command details
        const commandDetails = {
            setpresence: {
                category: '⚙️ Configuración',
                usage: '/setpresence [texto:<texto>] [tipo:<tipo>]',
                description: 'Cambia la presencia (estado) del bot. Modifica el texto y/o tipo de actividad que aparece bajo el nombre del bot.',
                implemented: true,
                examples: [
                    '`/setpresence` - Ver configuración actual',
                    '`/setpresence texto:"tus comandos" tipo:Listening`',
                    '`/setpresence texto:"con la comunidad" tipo:Playing`',
                    '`/setpresence tipo:Watching` - Solo cambiar tipo',
                    '**Tipos disponibles:** Playing, Streaming, Listening, Watching, Competing'
                ]
            },
            setgreeting: {
                category: '⚙️ Configuración',
                usage: '/setgreeting [canal:<#canal>] [desactivar:True]',
                description: 'Configura el canal donde se enviarán mensajes de bienvenida automáticos cuando nuevos miembros se unan al servidor.',
                implemented: true,
                examples: [
                    '`/setgreeting` - Ver canal actual',
                    '`/setgreeting canal:#bienvenidas` - Establecer canal',
                    '`/setgreeting desactivar:True` - Desactivar mensajes de bienvenida',
                    '**Nota:** El canal debe tener permisos de envío para el bot'
                ]
            },
            setlogchannel: {
                category: '⚙️ Configuración',
                usage: '/setlogchannel [canal:<#canal>] [desactivar:True]',
                description: 'Configura el canal donde el bot enviará logs de auditoría y eventos importantes (cambios de config, errores, etc).',
                implemented: true,
                examples: [
                    '`/setlogchannel` - Ver canal actual',
                    '`/setlogchannel canal:#logs-bot` - Establecer canal',
                    '`/setlogchannel desactivar:True` - Desactivar logs públicos',
                    '**Nota:** Los logs siempre se guardan en consola'
                ]
            },
            botstats: {
                category: '📊 Diagnóstico',
                usage: '/botstats',
                description: 'Muestra estadísticas del bot: uptime, uso de memoria, servidores conectados, comandos ejecutados y estado del sistema.',
                implemented: true,
                examples: [
                    '`/botstats` - Ver estadísticas completas',
                    '**Incluye:** Tiempo activo, RAM, CPU, servidores, miembros totales'
                ]
            },
            serverinfo: {
                category: '📊 Diagnóstico',
                usage: '/serverinfo',
                description: 'Muestra información detallada del servidor actual: miembros, roles, canales, fecha de creación y configuración.',
                implemented: true,
                examples: [
                    '`/serverinfo` - Ver información del servidor',
                    '**Incluye:** Conteo de miembros, roles, canales, boost level, creación'
                ]
            },
            shutdown: {
                category: '🔧 Mantenimiento',
                usage: '/shutdown <confirmar:sí>',
                description: 'Apaga el bot de forma segura. Requiere confirmación explícita. Envía log de auditoría antes de cerrar.',
                implemented: true,
                examples: [
                    '`/shutdown confirmar:sí` - Apagar el bot',
                    '**Advertencia:** Requiere acceso al servidor para reiniciarlo',
                    '**Nota:** Usa solo para mantenimiento planificado'
                ]
            },
            say: {
                category: '📬 Mensajería',
                usage: '/say',
                description: 'Envía un mensaje formateado a través del bot. Abre un modal para ingresar texto multilínea con soporte completo de Markdown y citas.',
                implemented: true,
                examples: [
                    '`/say` - Abrir modal para escribir mensaje',
                    '**Soporta:** Markdown, citas (>), negritas, cursivas, saltos de línea',
                    '**Uso:** Útil para anuncios, reglas, mensajes oficiales del servidor',
                    '**Nota:** El mensaje se envía en el canal actual'
                ]
            },
            imagen: {
                category: '📬 Mensajería',
                usage: '/imagen <archivo:nombre>',
                description: 'Envía una imagen o archivo previamente guardada desde el almacenamiento del bot como archivo adjunto real (no embed).',
                implemented: true,
                examples: [
                    '`/imagen archivo:logo.png` - Enviar imagen guardada',
                    '**Paso previo:** Sube una imágen para enviar y escribe `!upload` (mensaje) para guardar archivos primero',
                    '**Nota:** Los archivos se guardan en `assets/uploads`',
                    '**Uso:** Ideal para imágenes oficiales, logos, recursos del servidor'
                ]
            }
        };

        // If specific command requested, show detailed help
        if (comandoEspecifico && commandDetails[comandoEspecifico]) {
            const cmd = commandDetails[comandoEspecifico];
            const embed = new EmbedBuilder()
                .setTitle(`🔒 Admin: /${comandoEspecifico}`)
                .setColor(cmd.implemented ? '#10B981' : '#F59E0B')
                .setDescription(cmd.description)
                .addFields(
                    { name: '📂 Categoría', value: cmd.category, inline: true },
                    { name: '📊 Estado', value: cmd.implemented ? '✅ Implementado' : '⏳ Planeado', inline: true },
                    { name: '💡 Uso', value: `\`${cmd.usage}\``, inline: false },
                    { name: '📝 Ejemplos', value: cmd.examples.join('\n'), inline: false }
                )
                .setFooter({ text: 'Usa /adminhelp para ver todos los comandos de admin' });

            await interaction.editReply({ embeds: [embed] });
            return;
        }

        // Show general admin help with all categories
        const embed = new EmbedBuilder()
            .setTitle('🔒 Panel de Administración - Ayuda')
            .setDescription('Comandos exclusivos para administradores del bot. Estos comandos permiten configurar y mantener el bot sin editar archivos.')
            .setColor('#3C83F6')
            .setThumbnail('https://recursos.cpfiuna.io/Imagenes/Logos/cpf-logo-square.png');

        // Group commands by category
        const categories = {
            '⚙️ Configuración': [],
            '🔧 Mantenimiento': [],
            '📊 Diagnóstico': [],
            '📬 Mensajería': []
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

        embed.addFields(
            {
                name: '💡 Consejo',
                value: 'Usa `/adminhelp comando:<nombre>` para ver ejemplos y detalles de uso.\nEjemplo: `/adminhelp comando:setpresence`',
                inline: false
            }
        );

        embed.setFooter({ text: 'Club de Programación FIUNA | Comandos de Administración' });

        await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('adminhelp command error:', error);
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content: '❌ Ocurrió un error al mostrar la ayuda.' });
                } else {
                    await interaction.reply({ content: '❌ Ocurrió un error al mostrar la ayuda.', ephemeral: true });
                }
            } catch (e) {
                console.error('Failed to send error message:', e);
            }
        }
    },
};
