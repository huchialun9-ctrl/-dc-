// Pre-built Discord server templates
const TEMPLATES = {
    gaming: {
        id: 'gaming',
        name: '遊戲社群',
        icon: '🎮',
        description: '適合遊戲玩家、電競隊伍',
        categories: [
            {
                name: '📋 資訊',
                channels: [
                    { name: 'announcements', type: 'text', topic: '重要公告與更新' },
                    { name: 'rules', type: 'text', topic: '社群規則' },
                    { name: 'welcome', type: 'text', topic: '新成員報到' }
                ]
            },
            {
                name: '💬 聊天',
                channels: [
                    { name: 'general', type: 'text', topic: '一般閒聊' },
                    { name: 'memes', type: 'text', topic: '迷因分享' },
                    { name: 'media', type: 'text', topic: '圖片影片' }
                ]
            },
            {
                name: '🎮 遊戲',
                channels: [
                    { name: 'lfg', type: 'text', topic: '尋找隊友' },
                    { name: 'strategy', type: 'text', topic: '策略討論' },
                    { name: 'clips', type: 'text', topic: '精彩片段' }
                ]
            },
            {
                name: '🔊 語音',
                channels: [
                    { name: 'General', type: 'voice' },
                    { name: 'Gaming 1', type: 'voice' },
                    { name: 'Gaming 2', type: 'voice' },
                    { name: 'AFK', type: 'voice' }
                ]
            }
        ],
        roles: [
            { name: 'MVP', color: '#FFD700', hoist: true },
            { name: 'Pro Player', color: '#E74C3C', hoist: true },
            { name: 'Casual', color: '#3498DB', hoist: false },
            { name: 'New Player', color: '#95A5A6', hoist: false }
        ],
        rules: [
            '尊重所有成員',
            '禁止騷擾或仇恨言論',
            '請勿洗版或發送垃圾訊息',
            '禁止分享非法或不當內容',
            '遊戲時請保持良好運動精神'
        ],
        welcomeMessage: '歡迎來到我們的遊戲社群！請先閱讀規則，然後盡情享受遊戲吧！'
    },

    study: {
        id: 'study',
        name: '讀書會',
        icon: '📚',
        description: '適合學習小組、讀書會',
        categories: [
            {
                name: '📢 公告',
                channels: [
                    { name: 'announcements', type: 'text', topic: '重要通知' },
                    { name: 'schedule', type: 'text', topic: '讀書會時程' }
                ]
            },
            {
                name: '📖 學習',
                channels: [
                    { name: 'general-discussion', type: 'text', topic: '綜合討論' },
                    { name: 'questions', type: 'text', topic: '問題解答' },
                    { name: 'resources', type: 'text', topic: '學習資源分享' },
                    { name: 'progress', type: 'text', topic: '學習進度' }
                ]
            },
            {
                name: '📝 科目',
                channels: [
                    { name: 'math', type: 'text', topic: '數學討論' },
                    { name: 'science', type: 'text', topic: '科學討論' },
                    { name: 'languages', type: 'text', topic: '語言學習' }
                ]
            },
            {
                name: '🔊 語音',
                channels: [
                    { name: 'Study Room 1', type: 'voice' },
                    { name: 'Study Room 2', type: 'voice' },
                    { name: 'Break Room', type: 'voice' }
                ]
            }
        ],
        roles: [
            { name: '導師', color: '#9B59B6', hoist: true },
            { name: '組長', color: '#3498DB', hoist: true },
            { name: '成員', color: '#95A5A6', hoist: false }
        ],
        rules: [
            '保持學習環境安靜專注',
            '積極參與討論與分享',
            '尊重他人的學習進度',
            '禁止抄襲或學術不誠信',
            '準時參加讀書會'
        ],
        welcomeMessage: '歡迎加入讀書會！讓我們一起努力學習，互相幫助！'
    },

    work: {
        id: 'work',
        name: '工作團隊',
        icon: '💼',
        description: '適合專案團隊、工作小組',
        categories: [
            {
                name: '📋 管理',
                channels: [
                    { name: 'announcements', type: 'text', topic: '重要公告' },
                    { name: 'tasks', type: 'text', topic: '任務分配' },
                    { name: 'deadlines', type: 'text', topic: '截止日期' }
                ]
            },
            {
                name: '💬 溝通',
                channels: [
                    { name: 'general', type: 'text', topic: '一般討論' },
                    { name: 'ideas', type: 'text', topic: '創意發想' },
                    { name: 'feedback', type: 'text', topic: '意見回饋' }
                ]
            },
            {
                name: '🔧 部門',
                channels: [
                    { name: 'development', type: 'text', topic: '開發團隊' },
                    { name: 'design', type: 'text', topic: '設計團隊' },
                    { name: 'marketing', type: 'text', topic: '行銷團隊' }
                ]
            },
            {
                name: '🔊 會議室',
                channels: [
                    { name: 'Meeting Room 1', type: 'voice' },
                    { name: 'Meeting Room 2', type: 'voice' },
                    { name: 'Breakout Room', type: 'voice' }
                ]
            }
        ],
        roles: [
            { name: '管理者', color: '#E74C3C', hoist: true },
            { name: '專案經理', color: '#3498DB', hoist: true },
            { name: '團隊成員', color: '#2ECC71', hoist: false }
        ],
        rules: [
            '保持專業態度',
            '準時參加會議',
            '及時回報工作進度',
            '尊重團隊成員意見',
            '保護公司機密資訊'
        ],
        welcomeMessage: '歡迎加入團隊！讓我們一起完成出色的專案！'
    },

    creative: {
        id: 'creative',
        name: '創作工作室',
        icon: '🎨',
        description: '適合創作者、藝術家',
        categories: [
            {
                name: '📢 資訊',
                channels: [
                    { name: 'announcements', type: 'text', topic: '工作室公告' },
                    { name: 'opportunities', type: 'text', topic: '合作機會' }
                ]
            },
            {
                name: '🎨 創作',
                channels: [
                    { name: 'showcase', type: 'text', topic: '作品展示' },
                    { name: 'wip', type: 'text', topic: '製作中作品' },
                    { name: 'feedback', type: 'text', topic: '作品評論' },
                    { name: 'resources', type: 'text', topic: '創作資源' }
                ]
            },
            {
                name: '💬 交流',
                channels: [
                    { name: 'general', type: 'text', topic: '閒聊' },
                    { name: 'inspiration', type: 'text', topic: '靈感分享' },
                    { name: 'collaboration', type: 'text', topic: '合作討論' }
                ]
            },
            {
                name: '🔊 語音',
                channels: [
                    { name: 'Creative Lounge', type: 'voice' },
                    { name: 'Collaboration', type: 'voice' }
                ]
            }
        ],
        roles: [
            { name: '藝術家', color: '#E91E63', hoist: true },
            { name: '設計師', color: '#9C27B0', hoist: true },
            { name: '創作者', color: '#FF9800', hoist: false }
        ],
        rules: [
            '尊重原創作品',
            '給予建設性回饋',
            '禁止抄襲或盜用',
            '標註引用來源',
            '鼓勵互相學習'
        ],
        welcomeMessage: '歡迎來到創作工作室！分享你的作品，激發彼此的創意！'
    },

    music: {
        id: 'music',
        name: '音樂社群',
        icon: '🎵',
        description: '適合音樂愛好者、樂團',
        categories: [
            {
                name: '📢 公告',
                channels: [
                    { name: 'announcements', type: 'text', topic: '社群公告' },
                    { name: 'events', type: 'text', topic: '活動資訊' }
                ]
            },
            {
                name: '🎵 音樂',
                channels: [
                    { name: 'share-music', type: 'text', topic: '音樂分享' },
                    { name: 'original-works', type: 'text', topic: '原創作品' },
                    { name: 'covers', type: 'text', topic: '翻唱作品' },
                    { name: 'production', type: 'text', topic: '製作討論' }
                ]
            },
            {
                name: '💬 討論',
                channels: [
                    { name: 'general', type: 'text', topic: '綜合討論' },
                    { name: 'gear', type: 'text', topic: '器材討論' },
                    { name: 'theory', type: 'text', topic: '樂理交流' }
                ]
            },
            {
                name: '🔊 語音',
                channels: [
                    { name: 'Listening Party', type: 'voice' },
                    { name: 'Jam Session', type: 'voice' },
                    { name: 'Practice Room', type: 'voice' }
                ]
            }
        ],
        roles: [
            { name: '音樂人', color: '#9B59B6', hoist: true },
            { name: '製作人', color: '#E74C3C', hoist: true },
            { name: '樂迷', color: '#3498DB', hoist: false }
        ],
        rules: [
            '尊重所有音樂類型',
            '標註音樂來源',
            '禁止分享盜版',
            '給予建設性意見',
            '鼓勵原創作品'
        ],
        welcomeMessage: '歡迎來到音樂社群！分享你喜愛的音樂，一起創作吧！'
    },

    class: {
        id: 'class',
        name: '課程班級',
        icon: '🏫',
        description: '適合學校課程、線上課程',
        categories: [
            {
                name: '📢 公告',
                channels: [
                    { name: 'announcements', type: 'text', topic: '課程公告' },
                    { name: 'syllabus', type: 'text', topic: '課程大綱' },
                    { name: 'calendar', type: 'text', topic: '課程行事曆' }
                ]
            },
            {
                name: '📚 課程',
                channels: [
                    { name: 'lessons', type: 'text', topic: '課程內容' },
                    { name: 'homework', type: 'text', topic: '作業繳交' },
                    { name: 'questions', type: 'text', topic: '問題解答' },
                    { name: 'resources', type: 'text', topic: '學習資源' }
                ]
            },
            {
                name: '💬 交流',
                channels: [
                    { name: 'general', type: 'text', topic: '一般討論' },
                    { name: 'study-groups', type: 'text', topic: '讀書小組' }
                ]
            },
            {
                name: '🔊 教室',
                channels: [
                    { name: 'Main Classroom', type: 'voice' },
                    { name: 'Group Study 1', type: 'voice' },
                    { name: 'Group Study 2', type: 'voice' }
                ]
            }
        ],
        roles: [
            { name: '老師', color: '#E74C3C', hoist: true },
            { name: '助教', color: '#3498DB', hoist: true },
            { name: '學生', color: '#95A5A6', hoist: false }
        ],
        rules: [
            '準時上課',
            '按時繳交作業',
            '尊重師長與同學',
            '禁止作弊或抄襲',
            '積極參與討論'
        ],
        welcomeMessage: '歡迎來到課程！請查看課程大綱，準時參與課程活動。'
    }
};

module.exports = { TEMPLATES };
