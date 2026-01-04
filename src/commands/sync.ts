import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, PermissionFlagsBits, REST, Routes } from 'discord.js';
import { pool } from '../database.js';
import { commands } from '../command_list.js';

export const data = new SlashCommandBuilder()
    .setName('sync')
    .setDescription('Refreshes Slash Commands and checks database health')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator); // Restricted to Admins

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN!);
    let dbStatus = "Healthy";
    let cmdStatus = "Success";

    try {
        // 1. Re-register Slash Commands
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID!),
            { body: commands }
        );

        // 2. Database Health Check
        await pool.query('SELECT 1');
    } catch (error) {
        console.error(error);
        if (error instanceof Error) {
            cmdStatus = "Failed";
            dbStatus = "Error";
        }
    }

    const embed = new EmbedBuilder()
        .setColor(cmdStatus === "Success" ? 0x00FF00 : 0xFF0000)
        .setTitle('System Sync')
        .addFields(
            { name: 'Slash Commands', value: cmdStatus === "Success" ? '✅ Refreshed' : '❌ Failed', inline: true },
            { name: 'Database Pool', value: dbStatus === "Healthy" ? '✅ Connected' : '❌ Connection Lost', inline: true },
            { name: 'Bot Latency', value: `📡 ${interaction.client.ws.ping}ms`, inline: true }
        )
        .setTimestamp()

    await interaction.editReply({ embeds: [embed] });
}