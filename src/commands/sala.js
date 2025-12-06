const { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

// Store active rooms in memory (in production, use a database)
const activeGroups = new Map();
// Track when channels became empty
const emptyTimestamps = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sala')
        .setDescription('Gestión de salas de voz para estudio o proyectos')
        .addSubcommand(subcommand =>
            subcommand
                .setName('crear')
                .setDescription('Crea una nueva sala de voz temporal')
                .addStringOption(option =>
                    option
                        .setName('nombre')
                        .setDescription('Nombre de la sala')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('descripcion')
                        .setDescription('Descripción de la sala')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option
                        .setName('limite')
                        .setDescription('Límite de miembros')
                        .setMinValue(2)
                        .setMaxValue(20)
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('unirse')
                .setDescription('Únete a una sala existente')
                .addStringOption(option =>
                    option
                        .setName('nombre')
                        .setDescription('Nombre de la sala a la que deseas unirte')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('listar')
                .setDescription('Lista todas las salas disponibles')),
    
    async execute(interaction) {
        await interaction.deferReply();

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'crear') {
            const nombre = interaction.options.getString('nombre');
            const descripcion = interaction.options.getString('descripcion');
            const limite = interaction.options.getInteger('limite') || 10;

            // Check if room already exists
            if (activeGroups.has(nombre.toLowerCase())) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Error')
                    .setDescription(`Ya existe una sala llamada **${nombre}**`)
                    .setColor('#EF4444');
                return interaction.editReply({ embeds: [embed] });
            }

            try {
                // Create voice channel
                const voiceChannel = await interaction.guild.channels.create({
                    name: `🎙️ ${nombre}`,
                    type: ChannelType.GuildVoice,
                    userLimit: limite,
                    reason: `Sala creada por ${interaction.user.tag}`
                });

                // Store group info
                activeGroups.set(nombre.toLowerCase(), {
                    nombre,
                    descripcion,
                    limite,
                    creador: interaction.user.id,
                    channelId: voiceChannel.id,
                    miembros: [interaction.user.id]
                });

                const embed = new EmbedBuilder()
                    .setTitle('✅ Sala Creada')
                    .setColor('#10B981')
                    .addFields(
                        { name: '📝 Nombre', value: nombre, inline: true },
                        { name: '👥 Límite', value: `${limite} miembros`, inline: true },
                        { name: '📋 Descripción', value: descripcion, inline: false },
                        { name: '🎙️ Canal de Voz', value: `<#${voiceChannel.id}>`, inline: false },
                        { name: '👤 Creador', value: `<@${interaction.user.id}>`, inline: false }
                    )
                    .setFooter({ text: 'El canal se eliminará cuando todos salgan' });

                await interaction.editReply({ embeds: [embed] });

                // Monitor channel for cleanup
                // Wait 5 minutes before starting to check, giving people time to join
                setTimeout(() => {
                    const checkInterval = setInterval(async () => {
                        try {
                            const channel = await interaction.guild.channels.fetch(voiceChannel.id, { force: true });
                            if (channel && channel.members.size === 0) {
                                const now = Date.now();
                                const emptyTime = emptyTimestamps.get(voiceChannel.id);
                                
                                if (!emptyTime) {
                                    // Channel just became empty, mark the time
                                    emptyTimestamps.set(voiceChannel.id, now);
                                } else if (now - emptyTime >= 60000) {
                                    // Channel has been empty for 1 minute, delete it
                                    await channel.delete('Sala vacía por más de 1 minuto');
                                    activeGroups.delete(nombre.toLowerCase());
                                    emptyTimestamps.delete(voiceChannel.id);
                                    clearInterval(checkInterval);
                                }
                            } else if (channel && channel.members.size > 0) {
                                // Channel has people, clear the empty timestamp
                                emptyTimestamps.delete(voiceChannel.id);
                            }
                        } catch (error) {
                            clearInterval(checkInterval);
                            activeGroups.delete(nombre.toLowerCase());
                            emptyTimestamps.delete(voiceChannel.id);
                        }
                    }, 30000); // Check every 30 seconds
                }, 300000); // Wait 5 minutes before starting checks

            } catch (error) {
                console.error('Error creating group:', error);
                const embed = new EmbedBuilder()
                    .setTitle('❌ Error')
                    .setDescription('No se pudo crear el canal de voz. Verifica los permisos del bot.')
                    .setColor('#EF4444');
                await interaction.editReply({ embeds: [embed] });
            }

        } else if (subcommand === 'unirse') {
            const nombre = interaction.options.getString('nombre');
            const group = activeGroups.get(nombre.toLowerCase());

            if (!group) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Sala no encontrada')
                    .setDescription(`No existe una sala llamada **${nombre}**. Usa \`/sala listar\` para ver salas disponibles.`)
                    .setColor('#EF4444');
                return interaction.editReply({ embeds: [embed] });
            }

            const embed = new EmbedBuilder()
                .setTitle('✅ Información de la Sala')
                .setDescription(`Para unirte a la sala **${group.nombre}**, únete al canal de voz:`)
                .setColor('#10B981')
                .addFields(
                    { name: '🎙️ Canal de Voz', value: `<#${group.channelId}>`, inline: false },
                    { name: '📋 Descripción', value: group.descripcion, inline: false },
                    { name: '👥 Límite', value: `${group.limite} miembros`, inline: true }
                );

            await interaction.editReply({ embeds: [embed] });

        } else if (subcommand === 'listar') {
            if (activeGroups.size === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('📋 Salas Disponibles')
                    .setDescription('No hay salas activas en este momento.\nUsa `/sala crear` para crear una nueva.')
                    .setColor('#3C83F6');
                return interaction.editReply({ embeds: [embed] });
            }

            const embed = new EmbedBuilder()
                .setTitle('📋 Salas Disponibles')
                .setDescription('Aquí están todas las salas activas:')
                .setColor('#3C83F6');

            for (const [key, group] of activeGroups) {
                try {
                    const channel = await interaction.guild.channels.fetch(group.channelId);
                    const miembrosActuales = channel ? channel.members.size : 0;
                    embed.addFields({
                        name: `🔹 ${group.nombre}`,
                        value: `${group.descripcion}\n🎙️ <#${group.channelId}>\n👥 ${miembrosActuales}/${group.limite} miembros`,
                        inline: false
                    });
                } catch (error) {
                    // Channel might have been deleted
                    activeGroups.delete(key);
                }
            }

            embed.setFooter({ text: 'Usa /sala unirse <nombre> para más información' });

            await interaction.editReply({ embeds: [embed] });
        }
    },
};
