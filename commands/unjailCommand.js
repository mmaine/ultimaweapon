const { EmbedBuilder } = require('discord.js');
const { rolesToRestoreIds, muteRoleId, logChannelId } = require('../config');
const { removeJailedUser } = require('../utils/storage');

exports.handleUnjailCommand = async (interaction) => {
    const targetUser = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true);
    const guild = interaction.guild;
    const memberToUnjail = await guild.members.fetch(targetUser.id);

    // Proceed to unjail the user
    await memberToUnjail.roles.remove(muteRoleId);
    await memberToUnjail.roles.add(rolesToRestoreIds);
    removeJailedUser(targetUser.id);

    // Prepare and send the unjail message to the log channel
    const logChannel = await guild.channels.fetch(logChannelId);
    const unjailEmbed = new EmbedBuilder()
        .setTitle(`${targetUser.tag} has been unjailed.`)
        .setDescription(`${targetUser.toString()} (${targetUser.id}) has been unjailed by ${interaction.user.tag}.`)
        .setThumbnail(targetUser.displayAvatarURL())
        .addFields(
            { name: 'Unjailed by', value: `${interaction.user.tag}`, inline: true },
            { name: 'Reason for unjailing', value: reason, inline: true }
        )
        .setColor('#00FF00');
    await logChannel.send({ embeds: [unjailEmbed] });

    // Respond to the user who invoked the command with an ephemeral message
    await interaction.reply({ content: `You unjailed ${targetUser}.`, ephemeral: true });
};
