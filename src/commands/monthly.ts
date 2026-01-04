import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getLeaderboard } from '../database.js';

export const data = new SlashCommandBuilder()
    .setName('monthly')
    .setDescription('Show top 10 hosts for this month');

export async function execute(interaction: ChatInputCommandInteraction) {
    const now = new Date();
    // Get the start of the current month in milliseconds
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    
    // Fetch top 10 from the database using the monthly timestamp
    const rows = await getLeaderboard(startOfMonth);
    
    const lbText = rows.map((row: any, i: number) => 
        `**${i + 1}.** <@${row.userId}> — \`${row.count}\` hosts`
    ).join('\n');

    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`📅 Top Hosts - ${now.toLocaleString('en-US', { month: 'long' })}`)
        .setDescription(lbText || "No missions hosted this month yet!")
        .setFooter({ text: 'Code vasebreakers' });

    await interaction.reply({ embeds: [embed] });
}