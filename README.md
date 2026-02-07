# 🤖 VX6 BOT

VX6 BOT 是一個功能強大且全面的多用途 Discord 機器人解決方案。它集成了管理工具、社群娛樂、高品質音樂播放以及最新的 AI 技術，並配備了簡單易用的網頁控制面板，旨在為您的 Discord 伺服器提供一站式的自動化與互動體驗。

---

## ✨ 核心功能 (Core Features)

### 🛠️ 核心管理與自動化
- **伺服器配置 (`/config`)**：全域設定，自定義機器人行為。
- **身分組管理 (`/admin`, `/reactionrole`)**：透過指令或訊息反應自動分配身分。
- **網頁控制面板**：直觀的 Web 介面，方便管理員隨時隨地進行設定。

### 🛡️ 工具與支援
- **工單系統 (`/ticket`)**：專業的客服支援系統，管理與追蹤成員問題。
- **即時地震快報 (`/earthquake`)**：自動推播最新的地震資訊與警報。
- **快速清理 (`/clear`)**：一鍵清理頻道內的冗餘訊息。
- **資訊查詢**：包括 `/serverinfo`, `/userinfo`, `/avatar`, `/ping` 等實用工具。

### 🎮 娛樂與社群互動
- **高品質音樂 (`/music`)**：支援 YouTube 播放、音量調控及播放列表管理。
- **自動抽獎 (`/giveaway`)**：輕鬆舉辦伺服器抽獎活動。
- **虛擬經濟 (`/economy`)**：內建經濟系統，增加成員間的互動趣味。
- **投票與遊戲 (`/poll`, `/dice`)**：快速發起投票或簡單的擲骰子遊戲。

### 🤖 智慧 AI 助手
- **Google Gemini 整合 (`/setup-ai`)**：內建最新的 Generative AI，支援自然語言對話、資訊檢索。

---

## 🚀 技術架構 (Technology Stack)

- **語言**: JavaScript (Node.js)
- **機器人框架**: Discord.js v14
- **網頁框架**: Express.js + EJS Templates
- **資料庫**: Better-SQLite3
- **AI 驅動**: Google Generative AI (Gemini)
- **音樂系統**: DisTube + yt-dlp + FFmpeg

---

## 🛠️ 安裝與部署 (Installation)

### 必要條件
- [Node.js](https://nodejs.org/) (建議 v18 以上)
- [FFmpeg](https://ffmpeg.org/) (音樂播放功能必備)

### 安裝步驟
1. **複製專案庫**：
   ```bash
   git clone <your-repository-url>
   cd bot
   ```

2. **安裝依賴**：
   ```bash
   npm install
   ```

3. **配置環境變數**：
   將 `.env.example` 重新命名為 `.env` 並填入相關資訊：
   ```bash
   # Discord 設定
   CLIENT_ID=您的_CLIENT_ID
   CLIENT_SECRET=您的_CLIENT_SECRET
   BOT_TOKEN=您的_BOT_TOKEN
   
   # Web Server 設定
   PORT=8000
   SESSION_SECRET=自定義隨機字串
   REDIRECT_URI=http://localhost:8000/auth/discord/callback
   ```

4. **部署 Slash 指令**：
   ```bash
   node src/bot/deploy-commands.js
   ```

5. **啟動機器人與 Web Server**：
   ```bash
   npm start
   ```

---

## 📁 專案結構 (Project Structure)

```text
src/
├── bot/           # Discord 機器人核心邏輯
│   ├── commands/  # 指令定義 (Slash Commands)
│   ├── events/    # 事件處理 (Ready, Message, DisTube)
│   └── services/  # 業務邏輯 (地震、AI、抽獎)
├── core/          # 全域核心工具 (Logger, App Express)
├── database/      # 資料庫模型與初始化
├── modules/       # 共享模組
└── web/           # 網頁控制面板 (Routes, Views, Middleware)
```

---

## 📝 授權條款 (License)
本專案採用 **ISC** 授權。
