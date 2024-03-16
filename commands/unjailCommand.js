// unjailCommand.js
const { EmbedBuilder } = require('discord.js');
const { muteRoleId, logChannelId, allowedRoleIds } = require('../config');
const { getJailedUser, removeJailedUser } = require('../utils/storage');

exports.handleUnjailCommand = async (interaction) => {
    await interaction.deferReply({ ephemeral: true });

    const hasPermission = allowedRoleIds.some(roleId => interaction.member.roles.cache.has(roleId));

    if (!hasPermission) {
        await interaction.editReply({ content: "You don't have permission to use this command." });
        return;
    }

    const targetUser = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true);
    const guild = interaction.guild;
    const memberToUnjail = await guild.members.fetch(targetUser.id);

    // The invoking user (the one who used the command)
    const invokingUser = interaction.user; // This line defines 'invokingUser'

    const jailedUserInfo = getJailedUser(targetUser.id);
    if (!jailedUserInfo) {
        await interaction.editReply({ content: `${targetUser.tag} is currently not jailed.` });
        return;
    }

    await memberToUnjail.roles.remove(muteRoleId);
    const originalRoles = jailedUserInfo.originalRoles || [];
    originalRoles.forEach(async roleId => {
        await memberToUnjail.roles.add(roleId);
    });

    removeJailedUser(targetUser.id);

    const logChannel = await guild.channels.fetch(logChannelId);
    const unjailEmbed = new EmbedBuilder()
    .setTitle(`${targetUser.tag} has been pardoned.`)
    .setDescription(`${invokingUser.tag} has pardoned ${targetUser.tag} from jail.`)
    .setThumbnail(targetUser.displayAvatarURL())
    .addFields(
        // If remainingMinutes or similar data was part of your original design,
        // make sure it is correctly calculated and included here.
        // Otherwise, you may need to adjust this part according to available data.
        { name: 'Pardoner', value: invokingUser.tag, inline: true },
        { name: 'Reason', value: reason, inline: false }
    )
    .setColor('#00FF00');

    logChannel.send({ embeds: [unjailEmbed] });
    await interaction.editReply({ content: `You have unjailed ${targetUser.tag}.` });
};
