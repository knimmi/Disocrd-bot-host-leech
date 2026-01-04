import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { pool } from '../../database.js';

export const data = new SlashCommandBuilder()
    .setName('manage stats')
    .setDescription('Admin: Manually add or remove user mission counts')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    // Subcommand: Add
    .addSubcommand(sub => sub
        .setName('add')
        .setDescription('Add mission records to a user')
        .addUserOption(opt => opt.setName('target').setDescription('The user').setRequired(true))
        .addStringOption(opt => opt.setName('type').setDescription('Host or Leech').setRequired(true)
            .addChoices({ name: 'Host', value: 'host' }, { name: 'Leech', value: 'leech' }))
        .addIntegerOption(opt => opt.setName('amount').setDescription('Number of records to add').setMinValue(1).setRequired(true)))
    // Subcommand: Remove
    .addSubcommand(sub => sub
        .setName('remove')
        .setDescription('Remove mission records from a user')
        .addUserOption(opt => opt.setName('target').setDescription('The user').setRequired(true))
        .addStringOption(opt => opt.setName('type').setDescription('Host or Leech').setRequired(true)
            .addChoices({ name: 'Host', value: 'host' }, { name: 'Leech', value: 'leech' }))
        .addIntegerOption(opt => opt.setName('amount').setDescription('Number of records to remove').setMinValue(1).setRequired(true)));

export async function execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const target = interaction.options.getUser('target')!;
    const type = interaction.options.getString('type')! as 'host' | 'leech';
    const amount = interaction.options.getInteger('amount')!;

    if (subcommand === 'add') {
        // Bulk insert multiple records
        const records = Array.from({ length: amount }, () => [target.id, type, Date.now()]);
        
        await pool.query(
            'INSERT INTO mission_history (userId, type, timestamp) VALUES ?',
            [records]
        );

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('Stats Updated')
            .setDescription(`Successfully **added** \`${amount}\` **${type}** to ${target.username}.`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (subcommand === 'remove') {
        // Delete the most recent X records of that type
        const [result] = await pool.execute(
            'DELETE FROM mission_history WHERE userId = ? AND type = ? ORDER BY timestamp DESC LIMIT ?',
            [target.id, type, amount]
        ) as any;

        const deletedCount = result.affectedRows;

        if (deletedCount === 0) {
            return interaction.reply({ content: `❌ No **${type}** records found for ${target.username}.`, ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('Stats Updated')
            .setDescription(`Successfully **removed** \`${deletedCount}\` **${type}** from ${target.username}.`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
}