const { EmbedBuilder } = require('discord.js');
const { muteRoleId, logChannelId } = require('../config');
const { getJailedUser, removeJailedUser } = require('../utils/storage');

exports.handleUnjailCommand = async (interaction) => {
    await interaction.deferReply({ ephemeral: true }); // Acknowledge the interaction immediately

    const targetUser = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true);
    const guild = interaction.guild;
    const memberToUnjail = await guild.members.fetch(targetUser.id);

    // The invoking user (the one who used the command)
    const invokingUser = interaction.user; // This line defines 'invokingUser'

    // Check if the user is currently jailed
    const jailedUserInfo = getJailedUser(targetUser.id);
    if (!jailedUserInfo) {
        // User is not currently jailed, edit the initial deferred reply
        await interaction.editReply({ content: `${targetUser.tag} is currently not jailed.` });
        return;
    }

    // Proceed to unjail the user
    await memberToUnjail.roles.remove(muteRoleId);
    const originalRoles = jailedUserInfo.originalRoles || [];
    for (const roleId of originalRoles) {
        try {
            await memberToUnjail.roles.add(roleId);
        } catch (error) {
            console.error(`Failed to restore role ${roleId} to ${targetUser.tag}:`, error);
        }
    }
    removeJailedUser(targetUser.id);

    // Prepare and send the unjail message to the log channel
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
    await logChannel.send({ embeds: [unjailEmbed] });

    // Finally, edit the initial deferred reply instead of sending a new one
    await interaction.editReply({ content: `You unjailed ${targetUser.tag}.` });
};
