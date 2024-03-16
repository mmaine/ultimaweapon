const { EmbedBuilder } = require('discord.js');
const { rolesToRestoreIds, muteRoleId } = require('../config');
const { removeJailedUser, getJailedUsers } = require('../utils/storage');

exports.handleUnjailCommand = async (interaction) => {
    const targetUser = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true);
    const guild = interaction.guild;
    const memberToUnjail = await guild.members.fetch(targetUser.id);

    const jailedUsers = getJailedUsers();
    const jailedUserInfo = jailedUsers[targetUser.id];

    if (!jailedUserInfo) {
        await interaction.reply({ content: `${targetUser.tag} is not currently jailed.`, ephemeral: true });
        return;
    }

    await memberToUnjail.roles.add(jailedUserInfo.originalRoles);
    await memberToUnjail.roles.remove(muteRoleId);

    removeJailedUser(targetUser.id);

    const embed = new EmbedBuilder()
        .setTitle(`${targetUser.tag} has been pardoned.`)
        .setDescription(`${interaction.user.tag} has pardoned ${targetUser.tag} from jail.`)
        .addFields(
            { name: 'Sentence Left', value: `${Math.max(Math.round((jailedUserInfo.unjailTime - Date.now()) / 60000), 0)} minutes`, inline: true },
            { name: 'Pardoner', value: `${interaction.user.tag}`, inline: true },
            { name: 'Reason', value: reason, inline: false }
        )
        .setColor('#00FF00');

    await interaction.reply({ embeds: [embed], ephemeral: true });
};
