const fs = require('fs');
const path = require('path');

const storageFilePath = path.join(__dirname, '..', 'storage.json');

// Load data from storage
function loadData() {
    if (!fs.existsSync(storageFilePath)) {
        fs.writeFileSync(storageFilePath, JSON.stringify({}), 'utf8');
    }
    const fileContent = fs.readFileSync(storageFilePath, 'utf8');
    return JSON.parse(fileContent);
}

// Save data to storage
function saveData(data) {
    fs.writeFileSync(storageFilePath, JSON.stringify(data, null, 2), 'utf8');
}

exports.getJailedUsers = () => {
    const data = loadData();
    return data.jailedUsers || {};
};

exports.setJailedUser = (userId, userInfo) => {
    const data = loadData();
    data.jailedUsers = data.jailedUsers || {};
    data.jailedUsers[userId] = userInfo;
    saveData(data);
};

exports.removeJailedUser = (userId) => {
    const data = loadData();
    if (data.jailedUsers) {
        delete data.jailedUsers[userId];
        saveData(data);
    }
};

exports.getJailHistory = () => {
    const data = loadData();
    return data.jailHistory || {};
};

exports.addJailHistory = (userId, history) => {
    const data = loadData();
    data.jailHistory = data.jailHistory || {};
    data.jailHistory[userId] = data.jailHistory[userId] || [];
    data.jailHistory[userId].push(history);
    saveData(data);
};
