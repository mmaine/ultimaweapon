const fs = require('fs');
const path = require('path');
const storageFilePath = path.join(__dirname, '..', 'storage.json');
const {
    getJailedUser,
    setJailedUser,
    removeJailedUser,
    getWarnings,
    setWarnings,
    // include other functions you need
} = require('../utils/storage'); // adjust the path based on actual file location


function loadData() {
    console.log("Loading data...");
    if (!fs.existsSync(storageFilePath)) {
        fs.writeFileSync(storageFilePath, JSON.stringify({ jailedUsers: {}, jailHistory: {}, warnings: {}, highestSeverityReached: {} }), 'utf8');
    }
    return JSON.parse(fs.readFileSync(storageFilePath, 'utf8'));
}

function saveData(data) {
    console.log("Saving data...");
    fs.writeFileSync(storageFilePath, JSON.stringify(data, null, 4), 'utf8');
}

exports.getJailedUsers = () => {
    const data = loadData();
    return data.jailedUsers || {};
};

exports.getJailedUser = (userId) => {
    const data = loadData();
    return data.jailedUsers[userId];
};

exports.setJailedUser = (userId, userInfo) => {
    const data = loadData();
    data.jailedUsers[userId] = userInfo;
    saveData(data);
};

exports.removeJailedUser = (userId) => {
    const data = loadData();
    delete data.jailedUsers[userId];
    saveData(data);
};

exports.getJailHistory = () => {
    const data = loadData();
    return data.jailHistory || {};
};

exports.addJailHistory = (userId, historyItem) => {
    const data = loadData();
    if (!data.jailHistory[userId]) {
        data.jailHistory[userId] = [];
    }
    data.jailHistory[userId].push(historyItem);
    saveData(data);
};

exports.getWarnings = () => {
    const data = loadData();
    return data.warnings || {};
};

exports.setWarnings = (userId, warnings) => {
    const data = loadData();
    data.warnings[userId] = warnings;
    saveData(data);
};

exports.addWarning = (userId, warning) => {
    const data = loadData();
    if (!data.warnings[userId]) {
        data.warnings[userId] = [];
    }
    data.warnings[userId].push(warning);
    saveData(data);
};

exports.removeWarning = (userId, index) => {
    const data = loadData();
    if (data.warnings[userId] && index >= 0 && index < data.warnings[userId].length) {
        data.warnings[userId].splice(index, 1);
        saveData(data);
    }
};

exports.getTotalSeverity = (userId) => {
    const data = loadData();
    return data.warnings[userId] ? data.warnings[userId].reduce((total, warning) => total + warning.severity, 0) : 0;
};

exports.getHighestSeverityReached = (userId) => {
    const data = loadData();
    return data.highestSeverityReached[userId] || 0;
};

exports.setHighestSeverityReached = (userId, severity) => {
    const data = loadData();
    data.highestSeverityReached[userId] = severity;
    saveData(data);
};