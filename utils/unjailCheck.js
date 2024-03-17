const { EmbedBuilder } = require('discord.js');
const { muteRoleId, rolesToRestoreIds, logChannelId } = require('../config');
const { getJailedUsers, removeJailedUser } = require('.utils/storage');

exports.checkUnjailOnStart = async (client) => {
    const now = Date.now();
    const jailedUsers = getJailedUsers();
    const logChannel = await client.channels.fetch(logChannelId).catch(console.error); // Fetch the log channel once at the start

    for (const [userId, details] of Object.entries(jailedUsers)) {
        const unjailUser = async () => {
            try {
                const guild = await client.guilds.fetch(details.guildId);
                const member = await guild.members.fetch(userId);
                await member.roles.remove(muteRoleId); // Remove mute role
                for (const roleId of details.originalRoles) { // Add back original roles
                    try {
                        await member.roles.add(roleId);
                    } catch (innerError) {
                        console.error(`Failed to restore role ${roleId} to ${userId}:`, innerError);
                    }
                }
                removeJailedUser(userId); // Remove user from jailed list

                // Send a notification to the log channel
                if (logChannel) {
                    const unjailEmbed = new EmbedBuilder()
                    setTitle(`${targetUser.tag} has served their sentence.`)
                    .setDescription(`${targetUser.toString()} (${targetUser.id})'s jail time has expired and were let back in to the server.`)
                    .setThumbnail(targetUser.displayAvatarURL())
                    .setColor('#00FF00'); // Green color for unjail notification
                    await logChannel.send({ embeds: [unjailEmbed] });
                }
            } catch (error) {
                console.error(`Failed to unjail ${userId} after bot restart:`, error);
            }
        };

        if (details.unjailTime > now) {
            // The user still needs to be jailed, calculate remaining time
            const remainingTime = details.unjailTime - now;
            // Reset the unjail timeout based on remaining time
            setTimeout(unjailUser, remainingTime);
        } else {
            // If the unjail time has passed, unjail the user immediately
            unjailUser();
        }
    }
};
