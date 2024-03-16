const { EmbedBuilder } = require('discord.js');

exports.parseDuration = (durationString) => {
    const regex = /(\d+)([smhd])/;
    const match = durationString.match(regex);
    if (!match) return null;

    const [, amount, unit] = match;
    const multipliers = { 's': 1000, 'm': 60 * 1000, 'h': 3600 * 1000, 'd': 24 * 3600 * 1000 };
    return parseInt(amount, 10) * multipliers[unit];
};

exports.createEmbed = ({ title, description, fields, thumbnail }) => {
    return new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(title)
        .setDescription(description)
        .setThumbnail(thumbnail)
        .addFields(fields);
};
