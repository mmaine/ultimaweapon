// warningsCommand.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getWarnings } = require('../utils/storage');
const { allowedRoleIds } = require('../config');

exports.handleWarningsCommand = async (interaction) => {
    const hasPermission = allowedRoleIds.some(roleId => interaction.member.roles.cache.has(roleId));
    if (!hasPermission) {
        await interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
        return;
    }

    const targetUser = interaction.options.getUser('user'); // Fetch the targeted user if specified

    await interaction.deferReply({ ephemeral: false });

    if (targetUser) {
        const allWarnings = getWarnings(); // This retrieves all warnings.
        const userWarnings = allWarnings[targetUser.id] || []; // Safely ensures an array, even if no warnings.
        const embed = new EmbedBuilder()
            .setTitle(`Warnings for ${targetUser.tag}`)
            .setColor('#FFA500');

        if (userWarnings.length === 0) {
            embed.setDescription("This user has no warnings.");
        } else {
            userWarnings.forEach((warning, index) => {
                const warnedByUser = interaction.guild.members.cache.get(warning.warnedBy)?.user.tag || `ID: ${warning.warnedBy}`;
                embed.addFields({ 
                    name: `Warning #${index + 1}`, 
                    value: `Severity: ${warning.severity}, Reason: ${warning.reason}, Warned by: ${warnedByUser}, Time: <t:${Math.floor(warning.timestamp / 1000)}:f>` 
                });
            });
        }
        await interaction.editReply({ embeds: [embed] });
    } else {
        // If no specific user is targeted, show a summary of all users with warnings
        const allWarnings = getWarnings();
        const usersWarnings = Object.entries(allWarnings)
            .map(([userId, warnings]) => ({
                userId,
                totalSeverity: warnings.reduce((total, warning) => total + warning.severity, 0)
            }))
            .sort((a, b) => b.totalSeverity - a.totalSeverity);

        let page = 0;
        const usersPerPage = 10;
        const totalPages = Math.ceil(usersWarnings.length / usersPerPage);

        const generateEmbed = (page) => {
            const start = page * usersPerPage;
            const end = start + usersPerPage;
            const usersOnPage = usersWarnings.slice(start, end);

            const embed = new EmbedBuilder()
                .setTitle(`All Users' Warnings (Page ${page + 1} of ${totalPages})`)
                .setColor('#FFA500');

            usersOnPage.forEach(({ userId, totalSeverity }) => {
                const displayName = interaction.guild.members.cache.get(userId)?.user.tag || `User ID: ${userId}`;
                embed.addFields({ name: displayName, value: `Total Severity: ${totalSeverity}`, inline: false });
            });

            return embed;
        };

        const initialEmbed = generateEmbed(page);
        const components = totalPages > 1 ? [new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('previous').setLabel('Previous').setStyle(ButtonStyle.Primary).setDisabled(page === 0),
                new ButtonBuilder().setCustomId('next').setLabel('Next').setStyle(ButtonStyle.Primary).setDisabled(page === totalPages - 1)
            )] : [];
        await interaction.editReply({ embeds: [initialEmbed], components });

        if (totalPages > 1) {
            const filter = i => ['previous', 'next'].includes(i.customId) && i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                page = i.customId === 'previous' ? Math.max(0, page - 1) : Math.min(totalPages - 1, page + 1);
                const updatedEmbed = generateEmbed(page);
                const updatedComponents = [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId('previous').setLabel('Previous').setStyle(ButtonStyle.Primary).setDisabled(page === 0),
                            new ButtonBuilder().setCustomId('next').setLabel('Next').setStyle(ButtonStyle.Primary).setDisabled(page === totalPages - 1)
                        )
                ];
                await i.update({ embeds: [updatedEmbed], components: updatedComponents });
            });

            collector.on('end', () => interaction.editReply({ components: [] }));
        }
    }
};
