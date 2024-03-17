// unjailCommand.js
const { EmbedBuilder } = require('discord.js');
const { muteRoleId, logChannelId, allowedRoleIds } = require('../config');
const { getJailedUser, removeJailedUser } = require('../utils/storage');

exports.handleUnjailCommand = async (interaction) => {
    const hasPermission = interaction.member.roles.cache.some(role => allowedRoleIds.includes(role.id));

    if (!hasPermission) {
        await interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
        return;
    }

    await interaction.deferReply({ ephemeral: true });

    const targetUser = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true);
    const guild = interaction.guild;
    const memberToUnjail = await guild.members.fetch(targetUser.id);

    const jailedUserInfo = getJailedUser(targetUser.id);
    if (!jailedUserInfo) {
        await interaction.editReply({ content: `${targetUser.tag} is currently not jailed.` });
        return;
    }

    // Unjailing the user
    await memberToUnjail.roles.remove(muteRoleId);
    if (jailedUserInfo.originalRoles) {
        for (const roleId of jailedUserInfo.originalRoles) {
            try {
                await memberToUnjail.roles.add(roleId);
            } catch (error) {
                console.error(`Failed to restore role ${roleId} to ${targetUser.tag}:`, error);
            }
        }
    }

    removeJailedUser(targetUser.id);

    // Log the unjailing
    const logChannel = await guild.channels.fetch(logChannelId);
    const unjailEmbed = new EmbedBuilder()
        .setTitle(`${targetUser.tag} has been unjailed.`)
        .setDescription(`${interaction.user.tag} has unjailed ${targetUser.tag}.`)
        .setThumbnail(targetUser.displayAvatarURL())
        .addFields(
            { name: 'Unjailed by', value: interaction.user.tag, inline: true },
            { name: 'Reason', value: reason, inline: false }
        )
        .setColor('#00FF00');

    await logChannel.send({ embeds: [unjailEmbed] });
    await interaction.editReply({ content: `You have successfully unjailed ${targetUser.tag}.` });
};
