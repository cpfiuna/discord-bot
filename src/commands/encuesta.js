const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('encuesta')
        .setDescription('Crea una encuesta rápida')
        .addStringOption(option =>
            option
                .setName('pregunta')
                .setDescription('La pregunta de la encuesta')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('opcion1')
                .setDescription('Primera opción')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('opcion2')
                .setDescription('Segunda opción')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('opcion3')
                .setDescription('Tercera opción')
                .setRequired(false))
        .addStringOption(option =>
            option
                .setName('opcion4')
                .setDescription('Cuarta opción')
                .setRequired(false)),
    
    async execute(interaction) {
        await interaction.deferReply();

        // Check if bot has permissions to add reactions
        if (interaction.guild) {
            const botMember = interaction.guild.members.me;
            const channel = interaction.channel;
            
            if (!channel.permissionsFor(botMember).has('AddReactions')) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Permisos insuficientes')
                    .setDescription('El bot necesita el permiso "Añadir Reacciones" para crear encuestas.')
                    .setColor('#EF4444');
                return interaction.editReply({ embeds: [embed] });
            }
        }

        const pregunta = interaction.options.getString('pregunta');
        const opciones = [
            interaction.options.getString('opcion1'),
            interaction.options.getString('opcion2'),
            interaction.options.getString('opcion3'),
            interaction.options.getString('opcion4')
        ].filter(op => op !== null);

        const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];
        
        const descripcion = opciones.map((op, index) => `${emojis[index]} ${op}`).join('\n\n');

        const embed = new EmbedBuilder()
            .setTitle('📊 ' + pregunta)
            .setDescription(descripcion)
            .setColor('#3C83F6')
            .setFooter({ text: `Encuesta creada por ${interaction.user.username}` })
            .setTimestamp();

        try {
            const message = await interaction.editReply({ embeds: [embed] });

            // Agregar reacciones para votar (in parallel for speed)
            await Promise.all(
                opciones.map((_, i) => message.react(emojis[i]).catch(err => {
                    console.error(`Error adding reaction ${emojis[i]}:`, err);
                }))
            );
        } catch (error) {
            console.error('Error creating encuesta:', error);
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Error')
                .setDescription('No se pudo crear la encuesta. Verifica los permisos del bot.')
                .setColor('#EF4444');
            await interaction.editReply({ embeds: [errorEmbed] }).catch(console.error);
        }
    },
};
