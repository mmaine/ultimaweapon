// jailSchedule.js
const { EmbedBuilder } = require('discord.js');
const {
    getJailedUsers,
    removeJailedUser,
    getTotalSeverity,
    loadData,
    saveData
} = require('./storage'); // Adjust './storage' if the file is in a different directory


const { muteRoleId, rolesToRestoreIds, logChannelId, warningThresholds } = require('../config');

exports.startJailCheckSchedule = (client) => {
    setInterval(async () => {
        const now = Date.now();
        const data = loadData(); // Load the entire storage data
        const jailedUsers = getJailedUsers();

        for (const [userId, { originalRoles, unjailTime, guildId }] of Object.entries(jailedUsers)) {
            const userTotalSeverity = getTotalSeverity(userId);
            const shouldUnjail = unjailTime <= now || userTotalSeverity < warningThresholds.find(threshold => userTotalSeverity < threshold.severity)?.severity;

            if (shouldUnjail) {
                try {
                    const guild = await client.guilds.fetch(guildId);
                    const member = await guild.members.fetch(userId);

                    await member.roles.remove(muteRoleId).catch(console.error);
                    originalRoles.forEach(async roleId => {
                        await member.roles.add(roleId).catch(console.error);
                    });

                    removeJailedUser(userId); // Remove user from jailed list in storage

                    const logChannel = await guild.channels.fetch(logChannelId);
                    const unjailEmbed = new EmbedBuilder()
                        .setTitle(`${member.user.tag} has been unjailed.`)
                        .setDescription(`${member.toString()} (${userId})'s jail time has expired or severity reduced.`)
                        .setThumbnail(member.user.displayAvatarURL())
                        .setColor('#00FF00');
                    await logChannel.send({ embeds: [unjailEmbed] });
                } catch (error) {
                    console.error(`Failed to unjail ${userId}:`, error);
                }
            }
        }

        saveData(data); // Save any changes to the data
    }, 60000); // Check every minute, adjust as needed
};

exports.decayWarnings = async (client) => {
    const data = loadData();
    const now = Date.now();
    let changesMade = false;

    for (const [userId, warnings] of Object.entries(data.warnings)) {
        let userTotalSeverity = getTotalSeverity(userId);
        let decayOccurred = false;

        warnings.forEach(warning => {
            const monthsElapsed = (now - warning.timestamp) / (1000 * 60 * 60 * 24 * 30);
            if (monthsElapsed >= 3 && warning.severity > 0) {
                warning.severity = 0;
                decayOccurred = true;
                changesMade = true;
            }
        });

        if (decayOccurred) {
            const user = await client.users.fetch(userId).catch(console.error);
            const logChannel = client.channels.cache.get(logChannelId);
            if (user && logChannel) {
                const decayEmbed = new EmbedBuilder()
                    .setTitle('Warning Decayed')
                    .setDescription(`${user.tag} has had a warning's severity reduced due to time elapsed.`)
                    .setThumbnail(user.displayAvatarURL())
                    .addFields({ name: 'New Total Severity', value: String(getTotalSeverity(userId)), inline: true })
                    .setColor('#FFA500');
                await logChannel.send({ embeds: [decayEmbed] });
            }
        }
    }

    if (changesMade) {
        saveData(data); // Only save if there were changes
    }
};
