A Discord bot built with **TypeScript** and **MySQL**. provides real-time statistics, and foster engagement through leaderboards.

---

## ✨ Features

- **📊 Statistics:** Calculates host-to-leech ratios for individual members to track community contribution.
- **📅 Leaderboards:** Monthly and Global rankings to highlight top community contributors.

---

## 🛠️ Technical Stack

- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Library:** [Discord.js v14+](https://discord.js.org/)
- **Database:** [MySQL 8.0](https://www.mysql.com/)
- **Environment:** Node.js with `dotenv` secret management

---

## 📥 Getting Started

### 1. Prerequisites
- **Node.js** v16.11.0 or higher
- **MySQL** instance running locally or on a VPS

### 2. Installation
```bash
# Clone the repository
git clone [https://github.com/yourusername/VaseBot.git](https://github.com/yourusername/VaseBot.git)
cd VaseBot

# Install dependencies
npm install

## 🛠️ SQL Schema

Run the following script in your SQL client to create the required table and indexes:

CREATE TABLE IF NOT EXISTS mission_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId VARCHAR(20) NOT NULL,            -- The Discord User ID
    type ENUM('host', 'leech') NOT NULL,    -- Type of activity
    timestamp BIGINT NOT NULL,              -- Millisecond timestamp
    INDEX idx_user (userId),
    INDEX idx_time (timestamp),
    INDEX idx_type (type)
);
