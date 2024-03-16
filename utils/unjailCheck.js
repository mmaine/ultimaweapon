const { getJailedUsers, removeJailedUser } = require('./storage');
const { muteRoleId } = require('../config');

exports.checkUnjailOnStart = async (client) => {
    const jailedUsers = getJailedUsers();
    const now = Date.now();

    for (const [userId, details] of Object.entries(jailedUsers)) {
        if (details.unjailTime <= now) {
            try {
                const guild = await client.guilds.fetch(details.guildId);
                const member = await guild.members.fetch(userId);
                const muteRole = guild.roles.cache.get(muteRoleId);
                if (muteRole) {
                    await member.roles.remove(muteRole);
                    for (const roleId of details.originalRoles) {
                        const role = guild.roles.cache.get(roleId);
                        if (role) {
                            await member.roles.add(role);
                        }
                    }
                }
                removeJailedUser(userId);
                console.log(`Unjailed ${userId} upon bot restart.`);
            } catch (error) {
                console.error(`Failed to unjail ${userId} upon bot restart:`, error);
            }
        }
    }
};
