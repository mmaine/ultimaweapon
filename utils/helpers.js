const { EmbedBuilder } = require('discord.js');

// Converts duration strings like "10m" or "2h" into milliseconds
exports.parseDuration = (durationString) => {
    const regex = /(\d+)([smhdwy]|mo)/;
    const match = durationString.match(regex);
    if (!match) return null;

    const [, amount, unit] = match;
    const multipliers = {
        's': 1000,
        'm': 60 * 1000,
        'h': 60 * 60 * 1000,
        'd': 24 * 60 * 60 * 1000,
        'w': 7 * 24 * 60 * 60 * 1000,
        'mo': 30 * 24 * 60 * 60 * 1000, // Approximate month as 30 days
        'y': 365 * 24 * 60 * 60 * 1000, // Approximate year as 365 days
    };

    return parseInt(amount, 10) * multipliers[unit];
};


// Creates a standard embed message for the bot
exports.createEmbed = ({ title, description, fields, thumbnail }) => {
    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setThumbnail(thumbnail)
        .addFields(fields)
        .setColor('#0099ff');  // Set your preferred default color
};
