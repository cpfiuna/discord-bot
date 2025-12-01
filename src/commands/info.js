const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Información sobre el Club de Programación FIUNA'),
    
    async execute(interaction) {
        await interaction.deferReply();

        const embed = new EmbedBuilder()
            .setTitle('ℹ️ Sobre el Club de Programación FIUNA')
            .setDescription('El Club de Programación de la Facultad de Ingeniería de la Universidad Nacional de Asunción <:cpf:1379350250099179540> es una comunidad de estudiantes apasionados por la tecnología y la programación.')
            .setColor('#3C83F6')
            .setThumbnail('https://recursos.cpfiuna.io/Imagenes/Logos/cpf-logo-square.png')
            .addFields(
                {
                    name: '🎯 Misión',
                    value: 'Fomentar el aprendizaje colaborativo, compartir conocimientos y desarrollar habilidades de programación entre los estudiantes.',
                    inline: false
                },
                {
                    name: '💡 Actividades',
                    value: 'Talleres, charlas técnicas, hackathons, proyectos colaborativos, conferencias, competencias y más.',
                    inline: false
                },
                {
                    name: '🤝 Uníte',
                    value: 'Todos son bienvenidos, sin importar su nivel de experiencia en programación. Completá el formulario de admisión [acá](https://cpfiuna.io/admision).',
                    inline: false
                }
            );

        await interaction.editReply({ embeds: [embed] });
    },
};
