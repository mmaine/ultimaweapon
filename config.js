require('dotenv').config(); // Ensure this is at the top

module.exports = {
    token: process.env.TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: '840349073210867722',
    muteRoleId: '901408158864531476',
    allowedRoleIds: [
        '915988071990853712', // Admin
        '1102233253085192254', // Chief Mod
        '884438270191218709', // Mod
        '1192548649507508376', // Trial Mod
        '1192568517577416865', // Support
        // ... add other roles allowed to use the command
    ],
    rolesToRestoreIds: [
        '1055939686754963577', // high five
        '841457773370933279', // washed up gamer
        '949740816040075404',  // pog
        '1207170359669817404', // multipass
        '1181930807464558603', // poor judgment (gacha)
        '1191477888592130210', // off-topic
        '1194287519114743879', // savage
        // ... add other roles to restore
    ],
    logChannelId: '984505541130870804',
    warningThresholds: [
        { severity: 25, reason: 'Accumulated severity points reach 25', duration: '10s' },
        { severity: 50, reason: 'Accumulated severity points reach 50', duration: '20s' },
        { severity: 75, reason: 'Accumulated severity points reach 75', duration: '30s' },
        { severity: 100, reason: 'Accumulated severity points reach 100', duration: '100y' },  // Simulated "permanent"
    ]
};
