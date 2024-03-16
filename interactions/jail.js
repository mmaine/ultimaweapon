// File: interactions/jail.js

const { EmbedBuilder } = require('discord.js');
const { parseDuration, checkPermissions, modifyRoles, sendEmbedLog } = require('../utils');

async function handleJailInteraction(interaction) {
    // Extract necessary information from the interaction
    const { member, options } = interaction;
    const user = options.getUser('user');
    const reason = options.getString('reason');
    const durationString = options.getString('duration');

    // Check permissions
    if (!checkPermissions(member)) {
        return interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
    }

    // Parse duration
    const duration = parseDuration(durationString);
    if (!duration) {
        return interaction.reply({ content: 'Invalid duration format. Use format like 10s, 5m, 10h, 20d.', ephemeral: true });
    }

    // Jail the user
    try {
        const { muteRole, removedRoles } = await modifyRoles(interaction.guild, user.id, 'jail');

        // Confirm jailing to the admin
        await interaction.reply({ content: `${user} has been jailed for ${durationString}. Reason: ${reason}`, ephemeral: true });

        // Log the jailing
        const jailEmbed = new EmbedBuilder()
            // Populate the embed with relevant information
            .setTitle('User Jailed')
            .setDescription(`${user.tag} has been jailed for ${durationString}.`)
            .addFields({ name: 'Reason', value: reason });
        await sendEmbedLog(interaction.guild, jailEmbed);

        // Schedule the unjailing
        setTimeout(async () => {
            await modifyRoles(interaction.guild, user.id, 'unjail', { muteRole, removedRoles });
            const unjailEmbed = new EmbedBuilder()
                .setTitle('User Unjailed')
                .setDescription(`${user.tag} has been released from jail.`);
            await sendEmbedLog(interaction.guild, unjailEmbed);
        }, duration);
    } catch (error) {
        console.error('Error jailing user:', error);
        await interaction.followUp({ content: 'An error occurred while trying to jail the user.', ephemeral: true });
    }
}

module.exports = { handleJailInteraction };
