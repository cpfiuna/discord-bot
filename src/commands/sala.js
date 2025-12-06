const { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

// Store active rooms in memory (in production, use a database)
const activeGroups = new Map();
// Track when channels became empty and their deletion timeouts
const emptyTimestamps = new Map();
const deletionTimeouts = new Map();

// Set up voice state update listener for tracking channel occupancy
function setupVoiceStateListener(client) {
    if (client._salaVoiceListenerSetup) return; // Already set up
    client._salaVoiceListenerSetup = true;

    client.on('voiceStateUpdate', (oldState, newState) => {
        // Check both old and new channels in case someone left or joined
        const channelsToCheck = new Set();
        if (oldState.channelId) channelsToCheck.add(oldState.channelId);
        if (newState.channelId) channelsToCheck.add(newState.channelId);

        for (const channelId of channelsToCheck) {
            // Find if this channel is a managed sala
            let roomName = null;
            let roomKey = null;
            for (const [key, group] of activeGroups) {
                if (group.channelId === channelId) {
                    roomName = group.nombre;
                    roomKey = key;
                    break;
                }
            }

            if (!roomKey) continue; // Not a managed channel

            const channel = oldState.guild?.channels.cache.get(channelId) || newState.guild?.channels.cache.get(channelId);
            if (!channel) {
                // Channel was deleted externally, clean up
                activeGroups.delete(roomKey);
                emptyTimestamps.delete(channelId);
                if (deletionTimeouts.has(channelId)) {
                    clearTimeout(deletionTimeouts.get(channelId));
                    deletionTimeouts.delete(channelId);
                }
                continue;
            }

            const memberCount = channel.members.size;
            console.log(`[Sala] Canal ${roomName} ahora tiene ${memberCount} miembro(s)`);

            if (memberCount === 0) {
                const now = Date.now();
                const emptyTime = emptyTimestamps.get(channelId);

                if (!emptyTime) {
                    // Channel just became empty
                    emptyTimestamps.set(channelId, now);
                    console.log(`[Sala] Canal ${roomName} está vacío. Será eliminado en 1 minuto si nadie se une.`);
                    
                    // Set a timeout to delete after 1 minute of being empty
                    const timeoutId = setTimeout(async () => {
                        try {
                            // Double-check it's still empty and timeout hasn't been cancelled
                            if (!emptyTimestamps.has(channelId)) {
                                deletionTimeouts.delete(channelId);
                                return; // Someone rejoined, abort deletion
                            }

                            const timeEmpty = Date.now() - emptyTimestamps.get(channelId);
                            if (timeEmpty >= 60000) { // 1 minute
                                // Fetch fresh channel data to ensure it still exists
                                const ch = await channel.guild.channels.fetch(channelId).catch(() => null);
                                if (ch && ch.members.size === 0) {
                                    console.log(`[Sala] Eliminando canal ${roomName} después de 1 minuto vacío.`);
                                    await ch.delete('Sala vacía por más de 1 minuto');
                                    activeGroups.delete(roomKey);
                                    emptyTimestamps.delete(channelId);
                                    deletionTimeouts.delete(channelId);
                                } else {
                                    // Channel has members now, clean up tracking
                                    emptyTimestamps.delete(channelId);
                                    deletionTimeouts.delete(channelId);
                                }
                            } else {
                                // Not enough time has passed, clean up
                                deletionTimeouts.delete(channelId);
                            }
                        } catch (error) {
                            console.error(`[Sala] Error eliminando canal ${roomName}:`, error);
                            activeGroups.delete(roomKey);
                            emptyTimestamps.delete(channelId);
                            deletionTimeouts.delete(channelId);
                        }
                    }, 60000); // 1 minute
                    
                    deletionTimeouts.set(channelId, timeoutId);
                }
            } else if (memberCount > 0) {
                // Channel has people, cancel any pending deletion
                if (emptyTimestamps.has(channelId)) {
                    console.log(`[Sala] Canal ${roomName} tiene ${memberCount} miembro(s). Cancelando eliminación.`);
                    emptyTimestamps.delete(channelId);
                    
                    // Cancel the pending timeout
                    if (deletionTimeouts.has(channelId)) {
                        clearTimeout(deletionTimeouts.get(channelId));
                        deletionTimeouts.delete(channelId);
                    }
                }
            }
        }
    });
}

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
        // Set up the voice state listener (only runs once)
        setupVoiceStateListener(interaction.client);

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

            // Check bot permissions
            if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Error de Permisos')
                    .setDescription('El bot necesita el permiso "Gestionar Canales" para crear salas.')
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
                    createdAt: Date.now()
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
                    .setFooter({ text: 'El canal se eliminará automáticamente después de 1 minuto vacío' });

                await interaction.editReply({ embeds: [embed] });

                // The voice state listener will handle automatic cleanup

            } catch (error) {
                console.error('Error creating group:', error);
                
                // Clean up if channel was created but something else failed
                const key = nombre.toLowerCase();
                if (activeGroups.has(key)) {
                    const group = activeGroups.get(key);
                    try {
                        const ch = await interaction.guild.channels.fetch(group.channelId).catch(() => null);
                        if (ch) await ch.delete('Limpieza por error en creación');
                    } catch (cleanupError) {
                        console.error('Error en limpieza:', cleanupError);
                    }
                    activeGroups.delete(key);
                }
                
                const embed = new EmbedBuilder()
                    .setTitle('❌ Error')
                    .setDescription('No se pudo crear el canal de voz. Verifica los permisos del bot.')
                    .setColor('#EF4444');
                await interaction.editReply({ embeds: [embed] });
            }

        } else if (subcommand === 'unirse') {
            const nombre = interaction.options.getString('nombre');
            const key = nombre.toLowerCase();
            const group = activeGroups.get(key);

            if (!group) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Sala no encontrada')
                    .setDescription(`No existe una sala llamada **${nombre}**. Usa \`/sala listar\` para ver salas disponibles.`)
                    .setColor('#EF4444');
                return interaction.editReply({ embeds: [embed] });
            }

            // Verify channel still exists
            try {
                const channel = await interaction.guild.channels.fetch(group.channelId).catch(() => null);
                if (!channel) {
                    // Channel was deleted externally, clean up
                    activeGroups.delete(key);
                    emptyTimestamps.delete(group.channelId);
                    if (deletionTimeouts.has(group.channelId)) {
                        clearTimeout(deletionTimeouts.get(group.channelId));
                        deletionTimeouts.delete(group.channelId);
                    }
                    
                    const embed = new EmbedBuilder()
                        .setTitle('❌ Sala no disponible')
                        .setDescription(`La sala **${nombre}** ya no existe.`)
                        .setColor('#EF4444');
                    return interaction.editReply({ embeds: [embed] });
                }

                const miembrosActuales = channel.members.size;
                const embed = new EmbedBuilder()
                    .setTitle('✅ Información de la Sala')
                    .setDescription(`Para unirte a la sala **${group.nombre}**, únete al canal de voz:`)
                    .setColor('#10B981')
                    .addFields(
                        { name: '🎙️ Canal de Voz', value: `<#${group.channelId}>`, inline: false },
                        { name: '📋 Descripción', value: group.descripcion, inline: false },
                        { name: '👥 Ocupación', value: `${miembrosActuales}/${group.limite} miembros`, inline: true }
                    );

                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                console.error('Error fetching channel:', error);
                const embed = new EmbedBuilder()
                    .setTitle('❌ Error')
                    .setDescription('No se pudo obtener la información de la sala.')
                    .setColor('#EF4444');
                await interaction.editReply({ embeds: [embed] });
            }

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

            const keysToDelete = [];
            let validRoomsCount = 0;

            for (const [key, group] of activeGroups) {
                try {
                    const channel = await interaction.guild.channels.fetch(group.channelId).catch(() => null);
                    if (!channel) {
                        // Channel was deleted externally
                        keysToDelete.push(key);
                        continue;
                    }
                    
                    const miembrosActuales = channel.members.size;
                    embed.addFields({
                        name: `🔹 ${group.nombre}`,
                        value: `${group.descripcion}\n🎙️ <#${group.channelId}>\n👥 ${miembrosActuales}/${group.limite} miembros`,
                        inline: false
                    });
                    validRoomsCount++;
                } catch (error) {
                    console.error(`Error fetching channel ${group.nombre}:`, error);
                    keysToDelete.push(key);
                }
            }

            // Clean up deleted channels
            for (const key of keysToDelete) {
                const group = activeGroups.get(key);
                if (group) {
                    activeGroups.delete(key);
                    emptyTimestamps.delete(group.channelId);
                    if (deletionTimeouts.has(group.channelId)) {
                        clearTimeout(deletionTimeouts.get(group.channelId));
                        deletionTimeouts.delete(group.channelId);
                    }
                }
            }

            // If all channels were deleted during iteration
            if (validRoomsCount === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('📋 Salas Disponibles')
                    .setDescription('No hay salas activas en este momento.\nUsa `/sala crear` para crear una nueva.')
                    .setColor('#3C83F6');
                return interaction.editReply({ embeds: [embed] });
            }

            embed.setFooter({ text: 'Usa /sala unirse <nombre> para más información' });

            await interaction.editReply({ embeds: [embed] });
        }
    },
};
