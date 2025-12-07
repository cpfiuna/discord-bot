const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(process.cwd(), 'assets', 'uploads');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listar')
        .setDescription('Listar archivos guardados en el repositorio del bot (solo administradores)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ content: '❌ Solo los administradores pueden usar este comando.', ephemeral: true });
            }

            await interaction.deferReply({ ephemeral: true });

            let files = [];
            try {
                files = fs.readdirSync(UPLOAD_DIR).filter(f => fs.statSync(path.join(UPLOAD_DIR, f)).isFile());
            } catch (e) {
                files = [];
            }

            if (!files || files.length === 0) {
                await interaction.editReply({ content: 'No hay archivos guardados en `assets/uploads`.' });
                return;
            }

            // Chunk into a message-friendly size if needed
            const embed = new EmbedBuilder()
                .setTitle('📁 Archivos guardados')
                .setDescription(`Se encontraron ${files.length} archivos en el almacenamiento.`)
                .setColor('#3C83F6');

            const listText = files.slice(0, 50).map(f => `• ${f}`).join('\n');
            embed.addFields({ name: 'Archivos (primeros 50)', value: listText });

            if (files.length > 50) {
                embed.addFields({ name: 'Nota', value: `Se muestran los primeros 50 archivos. Usa el nombre mostrado con \'/imagen\' para enviar uno.` });
            }

            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            console.error('listar command error:', err);
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content: '❌ Ocurrió un error listando los archivos.' });
                } else {
                    await interaction.reply({ content: '❌ Ocurrió un error listando los archivos.', ephemeral: true });
                }
            } catch (e) { /* ignore */ }
        }
    }
};
