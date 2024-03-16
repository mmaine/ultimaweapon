const { Client, GatewayIntentBits } = require('discord.js');
const { muteRoleId, rolesToRestoreIds } = require('../config');
const { getJailedUsers, removeJailedUser } = require('./storage');

exports.checkUnjailOnStart = async (client) => {
    const now = Date.now();
    const jailedUsers = getJailedUsers();

    for (const [userId, details] of Object.entries(jailedUsers)) {
        if (details.unjailTime > now) {
            // The user still needs to be jailed, calculate remaining time
            const remainingTime = details.unjailTime - now;

            // Reset the unjail timeout based on remaining time
            setTimeout(async () => {
                try {
                    const guild = await client.guilds.fetch(details.guildId);
                    const member = await guild.members.fetch(userId);
                    await member.roles.remove(muteRoleId);
                    for (const roleId of details.originalRoles) {
                        const role = await guild.roles.fetch(roleId);
                        await member.roles.add(role);
                    }
                    removeJailedUser(userId);
                } catch (error) {
                    console.error(`Failed to unjail ${userId} after bot restart:`, error);
                }
            }, remainingTime);
        } else {
            // If the unjail time has passed, remove the jail immediately
            try {
                const guild = await client.guilds.fetch(details.guildId);
                const member = await guild.members.fetch(userId);
                await member.roles.remove(muteRoleId);
                for (const roleId of details.originalRoles) {
                    const role = await guild.roles.fetch(roleId);
                    await member.roles.add(role);
                }
                removeJailedUser(userId);
            } catch (error) {
                console.error(`Failed to remove expired jail for ${userId} after bot restart:`, error);
            }
        }
    }
};
