CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- Discord ID
    username TEXT,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT DEFAULT 'open', -- open, closed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME,
    transcript_url TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS settings (
    guild_id TEXT PRIMARY KEY,
    log_channel_id TEXT,
    welcome_enabled INTEGER DEFAULT 0,
    welcome_channel_id TEXT,
    welcome_message TEXT,
    automod_badwords TEXT DEFAULT '',
    automod_links INTEGER DEFAULT 0,
    ticket_categories TEXT,
    leveling_enabled INTEGER DEFAULT 0,
    economy_enabled INTEGER DEFAULT 0,
    ai_chat_enabled INTEGER DEFAULT 1,
    ai_channel_id TEXT,
    announcement_enabled INTEGER DEFAULT 0,
    music_enabled INTEGER DEFAULT 0,
    custom_commands_enabled INTEGER DEFAULT 0,
    automod_enabled INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS economy (
    user_id TEXT,
    guild_id TEXT,
    balance INTEGER DEFAULT 0,
    last_daily DATETIME,
    PRIMARY KEY (user_id, guild_id)
);

CREATE TABLE IF NOT EXISTS levels (
    user_id TEXT,
    guild_id TEXT,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 0,
    last_xp_time DATETIME,
    PRIMARY KEY (user_id, guild_id)
);

CREATE TABLE IF NOT EXISTS custom_commands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    trigger TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS giveaways (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    prize TEXT NOT NULL,
    winners_count INTEGER DEFAULT 1,
    end_time INTEGER NOT NULL,
    hosted_by TEXT NOT NULL,
    ended INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS voice_master (
    guild_id TEXT PRIMARY KEY,
    category_id TEXT,
    channel_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS voice_channels (
    channel_id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    is_locked INTEGER DEFAULT 0,
    is_hidden INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS earthquake_subs (
    guild_id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
    min_intensity INTEGER DEFAULT 3, -- Minimum intensity to notify (0-7)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    action TEXT, -- LOGIN, CREATE_TICKET, CLOSE_TICKET, CONFIG_CHANGE
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
