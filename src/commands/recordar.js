const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const cron = require('node-cron');

// Store active reminders in memory (in production, use a database)
const activeReminders = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('recordar')
        .setDescription('Crea recordatorios para eventos')
        .addSubcommand(subcommand =>
            subcommand
                .setName('crear')
                .setDescription('Crea un nuevo recordatorio')
                .addStringOption(option =>
                    option
                        .setName('mensaje')
                        .setDescription('Mensaje del recordatorio')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option
                        .setName('minutos')
                        .setDescription('En cuántos minutos recordar (deja vacío si usas fecha)')
                        .setMinValue(1)
                        .setRequired(false))
                .addStringOption(option =>
                    option
                        .setName('fecha')
                        .setDescription('Fecha y hora (formato: DD/MM/YYYY HH:MM)')
                        .setRequired(false))
                .addBooleanOption(option =>
                    option
                        .setName('global')
                        .setDescription('Enviar recordatorio a todo el servidor (solo admin/comisión/lead)')
                        .setRequired(false))
                .addChannelOption(option =>
                    option
                        .setName('canal')
                        .setDescription('Canal donde enviar el recordatorio global (opcional)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('listar')
                .setDescription('Lista tus recordatorios activos'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('cancelar')
                .setDescription('Cancela un recordatorio')
                .addIntegerOption(option =>
                    option
                        .setName('id')
                        .setDescription('ID del recordatorio a cancelar')
                        .setRequired(true))),
    
    async execute(interaction) {
        const os = require('os');
        const instanceId = `${os.hostname()}::${process.pid}`;

        // Defer early to avoid interaction race/timeouts
        let didDefer = false;
        try {
            await interaction.deferReply({ flags: 64 });
            didDefer = true;
        } catch (e) {
            console.error('recordar: failed to defer reply (may be already acknowledged):', e?.message || e);
        }

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
                    console.error('recordar: safeNotify failed:', e); 
                }
            }
        };

        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;

        if (subcommand === 'crear') {
            const mensaje = interaction.options.getString('mensaje');
            const minutos = interaction.options.getInteger('minutos');
            const fechaStr = interaction.options.getString('fecha');
            const isGlobal = interaction.options.getBoolean('global') || false;
            const targetChannel = interaction.options.getChannel('canal');

            // Check permissions for global reminders
            if (isGlobal) {
                const member = interaction.member;
                const hasPermission = member.permissions.has('Administrator') ||
                    member.roles.cache.some(role => 
                        role.name === 'Comision Directiva' || 
                        role.name === 'Lead' ||
                        role.name === 'Admin'
                    );

                if (!hasPermission) {
                    const embed = new EmbedBuilder()
                        .setTitle('❌ Permisos insuficientes')
                        .setDescription('Solo los miembros con rol de **Admin**, **Comision Directiva** o **Lead** pueden crear recordatorios globales.')
                        .setColor('#EF4444');
                    await safeNotify({ embeds: [embed], flags: 64 });
                    return;
                }
            }

            let targetDate;

            // Calculate target date based on input
            if (minutos) {
                targetDate = new Date(Date.now() + minutos * 60 * 1000);
            } else if (fechaStr) {
                // Parse DD/MM/YYYY HH:MM format
                const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/;
                const match = fechaStr.match(dateRegex);
                
                if (!match) {
                    const embed = new EmbedBuilder()
                        .setTitle('❌ Formato de fecha inválido')
                        .setDescription('Usa el formato: `DD/MM/YYYY HH:MM`\nEjemplo: `25/12/2025 15:30`')
                        .setColor('#EF4444');
                    await safeNotify({ embeds: [embed], flags: 64 });
                    return;
                }

                const [, day, month, year, hour, minute] = match;
                targetDate = new Date(year, month - 1, day, hour, minute);

                // Validate date is in the future
                if (targetDate <= new Date()) {
                    const embed = new EmbedBuilder()
                        .setTitle('❌ Fecha inválida')
                        .setDescription('La fecha debe ser en el futuro.')
                        .setColor('#EF4444');
                    await safeNotify({ embeds: [embed], flags: 64 });
                    return;
                }
            } else {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Parámetro faltante')
                    .setDescription('Debes especificar `minutos` o `fecha`.')
                    .setColor('#EF4444');
                await safeNotify({ embeds: [embed], flags: 64 });
                return;
            }

            // Generate unique reminder ID
            const reminderId = Date.now();
            
            // Calculate delay in milliseconds
            const delay = targetDate.getTime() - Date.now();

            // Schedule the reminder
            const timeoutId = setTimeout(async () => {
                try {
                    const reminderEmbed = new EmbedBuilder()
                        .setTitle('⏰ Recordatorio')
                        .setDescription(mensaje)
                        .setColor('#3C83F6')
                        .setFooter({ text: `Recordatorio creado el ${new Date(reminderId).toLocaleString('es-PY')}` })
                        .setTimestamp();

                    if (isGlobal) {
                        // Send to specified channel or the channel where command was used
                        const channel = targetChannel || interaction.channel;
                        await channel.send({ 
                            content: '@everyone',
                            embeds: [reminderEmbed] 
                        });
                    } else {
                        // Send DM to user
                        await interaction.user.send({ embeds: [reminderEmbed] });
                    }
                    
                    // Remove from active reminders
                    const userReminders = activeReminders.get(userId) || [];
                    activeReminders.set(userId, userReminders.filter(r => r.id !== reminderId));
                } catch (error) {
                    console.error('Error sending reminder:', error);
                }
            }, delay);

            // Store reminder info
            const userReminders = activeReminders.get(userId) || [];
            userReminders.push({
                id: reminderId,
                mensaje,
                targetDate,
                timeoutId,
                channelId: targetChannel?.id || interaction.channelId,
                isGlobal
            });
            activeReminders.set(userId, userReminders);

            const embed = new EmbedBuilder()
                .setTitle('✅ Recordatorio creado')
                .setDescription(`${isGlobal ? '🌍 Recordatorio global programado' : 'Te recordaré'}: **${mensaje}**`)
                .setColor('#10B981')
                .addFields(
                    { name: '📅 Fecha', value: targetDate.toLocaleString('es-PY'), inline: true },
                    { name: '🆔 ID', value: `${reminderId}`, inline: true },
                    { name: '📍 Tipo', value: isGlobal ? 'Global (@everyone)' : 'Personal (DM)', inline: true }
                );

            if (isGlobal && targetChannel) {
                embed.addFields({ name: '📢 Canal', value: `<#${targetChannel.id}>`, inline: true });
            }

            embed.setFooter({ text: isGlobal ? 'Se enviará al canal especificado' : 'Recibirás un mensaje privado cuando llegue el momento' });

            console.log(`recordar: instance=${instanceId} didDefer=${didDefer}, interaction.deferred=${interaction.deferred}, interaction.replied=${interaction.replied}`);
            await safeNotify({ embeds: [embed], flags: 64 });

        } else if (subcommand === 'listar') {
            const userReminders = activeReminders.get(userId) || [];

            if (userReminders.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('📋 Tus Recordatorios')
                    .setDescription('No tenés recordatorios activos.\nUsa `/recordar crear` para crear uno.')
                    .setColor('#3C83F6');
                await safeNotify({ embeds: [embed], flags: 64 });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('📋 Tus Recordatorios')
                .setDescription(`Tenés ${userReminders.length} recordatorio(s) activo(s):`)
                .setColor('#3C83F6');

            userReminders.forEach((reminder, index) => {
                const timeLeft = reminder.targetDate - new Date();
                const minutesLeft = Math.floor(timeLeft / 60000);
                const hoursLeft = Math.floor(minutesLeft / 60);
                const daysLeft = Math.floor(hoursLeft / 24);

                let timeStr;
                if (daysLeft > 0) {
                    timeStr = `En ${daysLeft} día(s)`;
                } else if (hoursLeft > 0) {
                    timeStr = `En ${hoursLeft} hora(s)`;
                } else {
                    timeStr = `En ${minutesLeft} minuto(s)`;
                }

                const tipoIcon = reminder.isGlobal ? '🌍' : '👤';
                const tipoText = reminder.isGlobal ? 'Global' : 'Personal';

                embed.addFields({
                    name: `${tipoIcon} ID: ${reminder.id} (${tipoText})`,
                    value: `**Mensaje:** ${reminder.mensaje}\n**Fecha:** ${reminder.targetDate.toLocaleString('es-PY')}\n**${timeStr}**`,
                    inline: false
                });
            });

            embed.setFooter({ text: 'Usa /recordar cancelar id:<ID> para cancelar un recordatorio' });

            console.log(`recordar: instance=${instanceId} didDefer=${didDefer}, interaction.deferred=${interaction.deferred}, interaction.replied=${interaction.replied}`);
            await safeNotify({ embeds: [embed], flags: 64 });

        } else if (subcommand === 'cancelar') {
            const reminderId = interaction.options.getInteger('id');
            const userReminders = activeReminders.get(userId) || [];
            const reminderIndex = userReminders.findIndex(r => r.id === reminderId);

            if (reminderIndex === -1) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Recordatorio no encontrado')
                    .setDescription(`No se encontró un recordatorio con ID \`${reminderId}\`.\nUsa \`/recordar listar\` para ver tus recordatorios.`)
                    .setColor('#EF4444');
                await safeNotify({ embeds: [embed], flags: 64 });
                return;
            }

            // Cancel the timeout
            const reminder = userReminders[reminderIndex];
            clearTimeout(reminder.timeoutId);

            // Remove from array
            userReminders.splice(reminderIndex, 1);
            activeReminders.set(userId, userReminders);

            const embed = new EmbedBuilder()
                .setTitle('✅ Recordatorio cancelado')
                .setDescription(`El recordatorio "${reminder.mensaje}" ha sido cancelado.`)
                .setColor('#10B981');

            console.log(`recordar: instance=${instanceId} didDefer=${didDefer}, interaction.deferred=${interaction.deferred}, interaction.replied=${interaction.replied}`);
            await safeNotify({ embeds: [embed], flags: 64 });
        }
    },
};
