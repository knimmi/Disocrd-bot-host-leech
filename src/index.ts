import { 
    Client, 
    GatewayIntentBits, 
    Message, 
    REST, 
    Routes, 
    SlashCommandBuilder, 
    EmbedBuilder 
} from 'discord.js';
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

const TOKEN = process.env.BOT_TOKEN as string; 
const CLIENT_ID = process.env.CLIENT_ID as string;

// Database Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});

const TRACKED_ROLE_IDS = [
    '1457117829340856546', // @ping-missions
    '1457117863398605044', // @ping-ventures
    '1457117897578254518'  // @ping-homebase
];

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, 
    ],
});

// Register Commands
const commands = [
    new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Show STW mission stats for a user')
        .addUserOption(opt => opt.setName('target').setDescription('The user to check')),
    new SlashCommandBuilder()
        .setName('monthly')
        .setDescription('Show top 10 hosts for THIS month'),
    new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Show global mission stats and top 10 hosts')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN!);

(async () => {
    try {
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('✅ Commands Registered');
    } catch (e) { console.error(e); }
})();

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    // --- Stats Command ---
    if (interaction.commandName === 'stats') {
        const target = interaction.options.getUser('target') || interaction.user;
        
        // Fetch counts from MySQL
        const [rows] = await pool.execute(
            'SELECT type, COUNT(*) as count FROM mission_history WHERE userId = ? GROUP BY type',
            [target.id]
        ) as any;

        let hosts = 0;
        let leeches = 0;
        rows.forEach((row: any) => {
            if (row.type === 'host') hosts = row.count;
            if (row.type === 'leech') leeches = row.count;
        });

        const total = hosts + leeches;
        const hRatio = total > 0 ? Math.round((hosts / total) * 100) : 0;
        const lRatio = total > 0 ? Math.round((leeches / total) * 100) : 0;

        const embed = new EmbedBuilder()
            .setColor(0x2B2D31)
            .setTitle(`Stats for: ${target.username}`)
            .addFields(
                { name: 'Hosted:', value: `${hosts} Missions` },
                { name: 'Leeched:', value: `${leeches} Missions` },
                { name: 'Ratio', value: `\`${hRatio}%\` — \`${lRatio}%\` !` }
            )
            .setFooter({ text: 'Code vasebreakers' });

        await interaction.reply({ embeds: [embed] });
    }

    // --- Monthly Leaderboard ---
    if (interaction.commandName === 'monthly') {
        const [rows] = await pool.execute(
            'SELECT userId, COUNT(*) as count FROM mission_history WHERE timestamp >= ? AND type = "host" GROUP BY userId ORDER BY count DESC LIMIT 10',
            [startOfMonth]
        ) as any;

        const lbText = rows.map((row: any, i: number) => `**${i + 1}.** <@${row.userId}> — \`${row.count}\` hosts`).join('\n');

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`📅 Top Hosts - ${now.toLocaleString('en-US', { month: 'long' })}`)
            .setDescription(lbText || "No missions hosted this month yet!")
            .setFooter({ text: 'Code vasebreakers' });
        await interaction.reply({ embeds: [embed] });
    }

    // --- Global Leaderboard ---
    if (interaction.commandName === 'leaderboard') {
        const [[{ total }]] = await pool.execute('SELECT COUNT(*) as total FROM mission_history WHERE type = "host"') as any;
        const [rows] = await pool.execute(
            'SELECT userId, COUNT(*) as count FROM mission_history WHERE type = "host" GROUP BY userId ORDER BY count DESC LIMIT 10'
        ) as any;

        const lbText = rows.map((row: any, i: number) => `**${i + 1}.** <@${row.userId}> — \`${row.count}\` hosts`).join('\n');

        const embed = new EmbedBuilder()
            .setColor(0xFFA500)
            .setTitle('🏆 Global Mission Leaderboard')
            .setDescription(`A total of **${total}** missions have been hosted!`)
            .addFields({ name: 'Top 10 Mission Hosts', value: lbText || 'No data yet.' })
            .setFooter({ text: 'Code vasebreakers' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
});

client.on('messageCreate', async (message: Message) => {
    if (message.author.bot || !message.guild) return;

    const userId = message.author.id;

    // Track Hosting
    if (message.mentions.roles.some(r => TRACKED_ROLE_IDS.includes(r.id))) {
        await pool.execute('INSERT INTO mission_history (userId, type, timestamp) VALUES (?, "host", ?)', [userId, Date.now()]);

        const [[{ count }]] = await pool.execute('SELECT COUNT(*) as count FROM mission_history WHERE userId = ? AND type = "host"', [userId]) as any;

        await message.reply({
            content: `-# ✅ Mission tracked! You have now hosted **${count}** missions.`,
            allowedMentions: { repliedUser: false }
        });
    }

    // Track Leeching
    if (message.content.toLowerCase() === 'omw' && message.reference) {
        await pool.execute('INSERT INTO mission_history (userId, type, timestamp) VALUES (?, "leech", ?)', [userId, Date.now()]);

        const [[{ count }]] = await pool.execute('SELECT COUNT(*) as count FROM mission_history WHERE userId = ? AND type = "leech"', [userId]) as any;

        await message.reply({
            content: `-# ✅ Leech recorded! You have now leeched **${count}** missions.`,
            allowedMentions: { repliedUser: false }
        });
    }
});

client.once('ready', () => {
    console.log(`✅ Bot Online as ${client.user?.tag} (MySQL Connected)`);
});

client.login(TOKEN);