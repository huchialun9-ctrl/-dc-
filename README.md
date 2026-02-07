# 🤖 VX6 BOT

VX6 BOT 是一個基於 AI 驅動的 Discord 伺服器建構機器人。透過整合 Google Gemini AI 和直觀的網頁控制面板，讓您輕鬆設計和部署完整的 Discord 伺服器結構。

---

## ✨ 核心功能 (Core Features)

### 🎨 AI 驅動的伺服器建構
- **智能伺服器設計**：使用自然語言描述您理想的伺服器結構，AI 將自動生成完整的頻道和身分組配置
- **預設模板系統**：提供多種預設伺服器模板（遊戲社群、學習社群、企業團隊等）
- **即時預覽與調整**：在實際部署前預覽 AI 生成的結構，並可進行細節調整

### 🖥️ 網頁控制面板
- **直觀的 Web 介面**：方便管理員隨時隨地進行伺服器設計和設定
- **Discord OAuth 登入**：安全的身份驗證，自動識別您有權限管理的伺服器
- **即時狀態檢視**：查看機器人狀態、權限和建構進度

### 🤖 智慧 AI 助手
- **Google Gemini 整合**：內建最新的 Generative AI，支援自然語言對話和伺服器結構生成
- **多語言支援**：支援繁體中文、簡體中文、英文等多種語言
- **智能對話**：在 Discord 頻道中提及機器人即可進行 AI 對話

---

## 🚀 技術架構 (Technology Stack)

- **語言**: JavaScript (Node.js)
- **機器人框架**: Discord.js v14
- **前端框架**: React + Vite + TailwindCSS
- **後端框架**: Express.js
- **資料庫**: MongoDB (Mongoose) + Better-SQLite3
- **AI 驅動**: Google Generative AI (Gemini)

---

## 🛠️ 安裝與部署 (Installation)

### 必要條件
- [Node.js](https://nodejs.org/) (建議 v18 以上)
- MongoDB 資料庫（本地或 MongoDB Atlas）

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
   
   # MongoDB 設定
   MONGODB_URI=您的_MONGODB_連線字串
   
   # AI 設定
   GEMINI_API_KEY=您的_GEMINI_API_KEY
   ```

4. **啟動機器人與 Web Server**：
   ```bash
   npm start
   ```

5. **訪問控制面板**：
   開啟瀏覽器並前往 `http://localhost:8000`

---

## 📁 專案結構 (Project Structure)

```text
src/
├── bot/           # Discord 機器人核心邏輯
│   ├── events/    # 事件處理 (Ready, MessageCreate)
│   ├── services/  # 業務邏輯 (AI, 伺服器建構)
│   └── utils/     # 工具函數
├── core/          # 全域核心工具 (Logger, App Express)
├── database/      # 資料庫模型與初始化
├── models/        # 資料模型 (Guild Settings, Config)
└── web/           # 網頁控制面板
    ├── dashboard/ # React 前端應用
    ├── routes/    # API 路由
    └── middleware/# 身份驗證中介軟體
```

---

## 📝 授權條款 (License)
本專案採用 **ISC** 授權。
