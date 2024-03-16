const fs = require('fs');
const path = require('path');
const storageFilePath = path.join(__dirname, '..', 'storage.json');

function loadData() {
    if (!fs.existsSync(storageFilePath)) {
        fs.writeFileSync(storageFilePath, JSON.stringify({ jailedUsers: {}, jailHistory: {} }), 'utf8');
    }
    return JSON.parse(fs.readFileSync(storageFilePath, 'utf8'));
}

function saveData(data) {
    fs.writeFileSync(storageFilePath, JSON.stringify(data, null, 4), 'utf8');
}

exports.getJailedUsers = () => {
    const data = loadData();
    return data.jailedUsers || {};
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

exports.addJailHistory = (userId, history) => {
    const data = loadData();
    data.jailHistory[userId] = (data.jailHistory[userId] || []).concat(history);
    saveData(data);
};
