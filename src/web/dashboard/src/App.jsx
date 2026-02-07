import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Layout, Server, Wand2, Play, CheckCircle2, AlertCircle,
  ChevronRight, Layers, Hash, Volume2, MessageSquare,
  Settings, Send, Globe, FileText, ShieldCheck, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const App = () => {
  const [guilds, setGuilds] = useState([]);
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [language, setLanguage] = useState('Traditional Chinese');
  const [template, setTemplate] = useState('');
  const [structure, setStructure] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [status, setStatus] = useState(null);
  const [botStatus, setBotStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'settings'
  const [input, setInput] = useState('');
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    fetchData();
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (selectedGuild) {
      fetchGuildDetails(selectedGuild.id);
    }
  }, [selectedGuild]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: userData } = await axios.get('/api/user');
      setUser(userData.user);

      const { data: guildData } = await axios.get('/api/guilds');
      setGuilds(guildData);
    } catch (err) {
      console.error('Initial fetch failed', err);
      if (err.response?.status === 401) setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchGuildDetails = async (guildId) => {
    try {
      const [statusRes, settingsRes] = await Promise.all([
        axios.get(`/api/guild-status/${guildId}`),
        axios.get(`/api/settings/${guildId}`)
      ]);
      setBotStatus(statusRes.data);
      setLanguage(settingsRes.data.language || 'Traditional Chinese');
      setTemplate(settingsRes.data.template || '');

      // Reset structure/chat when switching guilds
      setStructure(null);
      setMessages([{
        role: 'ai',
        content: `Hello! I'm your AI architect for **${statusRes.data.name}**. How can I help you structure your server today?`
      }]);
    } catch (err) {
      console.error('Failed to fetch guild details', err);
    }
  };

  const handleSaveSettings = async () => {
    if (!selectedGuild) return;
    setLoading(true);
    try {
      await axios.post(`/api/settings/${selectedGuild.id}`, { language, template });
      setStatus({ type: 'success', message: 'Settings saved successfully!' });
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to save settings.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!input || !selectedGuild) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await axios.get(`/api/generate-structure?description=${encodeURIComponent(input)}&guildId=${selectedGuild.id}`);
      if (data.error) {
        setMessages(prev => [...prev, {
          role: 'ai',
          content: `Sorry, I encountered an error: ${data.error}`
        }]);
      } else {
        setStructure(data);
        setMessages(prev => [...prev, {
          role: 'ai',
          content: `I've generated a potential structure based on your request. You can preview it on the right. Would you like to apply it?`
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error while generating the structure.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!selectedGuild || !structure) return;
    setIsBuilding(true);
    setStatus(null);
    try {
      await axios.post('/api/execute-build', {
        guildId: selectedGuild.id,
        structure: structure
      });
      setStatus({ type: 'success', message: 'Construction started! Watch your Discord server come to life.' });
      // Simulate real-time progress for 5 seconds
      setTimeout(() => setIsBuilding(false), 5000);
    } catch (err) {
      console.error('Execution failed', err);
      setStatus({ type: 'error', message: 'Construction failed to start.' });
      setIsBuilding(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-discord-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-discord-blurple"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-discord-dark flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-discord-lighter p-10 rounded-2xl shadow-2xl border border-white/5 text-center max-w-md w-full"
        >
          <div className="bg-discord-blurple/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Layout className="w-10 h-10 text-discord-blurple" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Welcome Back</h1>
          <p className="text-gray-400 mb-8">Login with Discord to manage your servers and build AI structures.</p>
          <a
            href="/auth/discord"
            className="bg-discord-blurple hover:bg-opacity-90 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] shadow-xl"
          >
            <Server className="w-5 h-5" />
            Login with Discord
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-discord-dark flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 bg-discord-lighter p-6 border-r border-discord-dark flex flex-col gap-6 flex-shrink-0">
        <div className="flex items-center gap-3 text-white font-bold text-xl mb-4">
          <Layout className="w-8 h-8 text-discord-blurple" />
          <span>Bot Dashboard</span>
        </div>

        <div className="flex flex-col gap-2 flex-1 overflow-hidden">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Select Server</label>
          <div className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
            {guilds.map(guild => (
              <button
                key={guild.id}
                onClick={() => setSelectedGuild(guild)}
                className={`flex items-center gap-3 p-3 rounded-md transition-all ${selectedGuild?.id === guild.id
                  ? 'bg-discord-blurple text-white shadow-lg'
                  : 'hover:bg-discord-lightest text-gray-300'
                  }`}
              >
                {guild.iconUrl ? (
                  <img src={guild.iconUrl} alt={guild.name} className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-discord-lightest flex items-center justify-center font-bold text-xs text-white">
                    {guild.name[0]}
                  </div>
                )}
                <span className="truncate flex-1 text-left text-sm font-medium">{guild.name}</span>
                {guild.botPresent && <div className="w-2 h-2 rounded-full bg-discord-green shadow-[0_0_8px_rgba(35,165,89,0.5)]" />}
              </button>
            ))}
          </div>
        </div>

        {/* User Profile */}
        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <img
              src={user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png'}
              className="w-10 h-10 rounded-full border border-white/10"
              alt="Avatar"
            />
            <div className="flex flex-col overflow-hidden">
              <span className="text-white text-sm font-bold truncate">{user.username}</span>
              <a href="/auth/logout" className="text-[10px] text-gray-500 hover:text-white transition-colors uppercase font-bold tracking-tighter">Sign Out</a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {!selectedGuild ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4">
            <Server className="w-16 h-16 opacity-20" />
            <p className="text-xl">Please select a server to begin</p>
          </div>
        ) : (
          <>
            {/* Top Bar / Tabs */}
            <div className="h-16 bg-discord-lighter border-b border-discord-dark flex justify-between items-center px-8 flex-shrink-0">
              <div className="flex items-center gap-8">
                <h2 className="text-white font-bold flex items-center gap-2">
                  <Server className="w-5 h-5 text-gray-400" />
                  {selectedGuild.name}
                </h2>
                <nav className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all ${activeTab === 'chat' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'}`}
                  >
                    <MessageSquare className="w-4 h-4" /> AI Architect
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all ${activeTab === 'settings' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'}`}
                  >
                    <Settings className="w-4 h-4" /> Settings
                  </button>
                </nav>
              </div>

              <div className="flex items-center gap-4">
                {botStatus && (
                  <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border ${botStatus.hasAdmin ? 'text-discord-green bg-discord-green/10 border-discord-green/20' : 'text-discord-red bg-discord-red/10 border-discord-red/20'}`}>
                    {botStatus.hasAdmin ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                    {botStatus.hasAdmin ? 'ADMIN PERMISSIONS GRANTED' : 'ADMIN PERMISSIONS MISSING'}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Left Column: Chat or Settings */}
              <div className="flex-1 flex flex-col min-w-0 bg-discord-dark">
                {activeTab === 'chat' ? (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 custom-scrollbar">
                      {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-4 ${msg.role === 'ai' ? '' : 'flex-row-reverse'}`}>
                          <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'ai' ? 'bg-discord-blurple text-white' : 'bg-gray-700 text-gray-300 font-bold'}`}>
                            {msg.role === 'ai' ? <Wand2 className="w-6 h-6" /> : user.username[0]}
                          </div>
                          <div className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-md ${msg.role === 'ai' ? 'bg-discord-lighter text-gray-200 rounded-tl-none' : 'bg-discord-blurple text-white rounded-tr-none'}`}>
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                      {loading && (
                        <div className="flex gap-4">
                          <div className="w-10 h-10 rounded-full bg-discord-blurple flex items-center justify-center animate-pulse">
                            <Wand2 className="w-6 h-6 text-white" />
                          </div>
                          <div className="bg-discord-lighter rounded-2xl rounded-tl-none px-5 py-3 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Chat Input */}
                    <div className="p-6 bg-discord-lighter border-t border-discord-dark flex-shrink-0">
                      <form onSubmit={handleGenerate} className="flex gap-3 bg-discord-dark rounded-xl p-2 border border-white/5 focus-within:border-discord-blurple/50 transition-all">
                        <input
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder={`Describe your server structure for ${selectedGuild.name}...`}
                          className="flex-1 bg-transparent border-none focus:ring-0 text-gray-200 px-4 py-2"
                        />
                        <button
                          type="submit"
                          disabled={loading || !input}
                          className="bg-discord-blurple hover:opacity-90 disabled:opacity-50 text-white rounded-lg px-4 flex items-center justify-center transition-all"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </form>
                    </div>
                  </div>
                ) : (
                  /* Settings Tab */
                  <div className="flex-1 p-12 overflow-y-auto">
                    <div className="max-w-2xl flex flex-col gap-10">
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                          <Layout className="w-7 h-7 text-discord-blurple" /> 快速模板
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">選擇預設模板快速建立伺服器</p>
                        <div className="grid grid-cols-3 gap-4">
                          {templates.map(tmpl => (
                            <button
                              key={tmpl.id}
                              onClick={() => applyTemplate(tmpl.id)}
                              className="bg-discord-lighter border border-white/10 hover:border-discord-blurple rounded-xl p-4 text-left transition-all group"
                            >
                              <div className="text-3xl mb-2">{tmpl.icon}</div>
                              <div className="font-bold text-white text-sm mb-1 group-hover:text-discord-blurple">{tmpl.name}</div>
                              <div className="text-xs text-gray-500">{tmpl.description}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                          <Globe className="w-7 h-7 text-discord-blurple" /> Localization
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          {['Traditional Chinese', 'English', 'Japanese', 'Korean'].map(lang => (
                            <button
                              key={lang}
                              onClick={() => setLanguage(lang)}
                              className={`p-4 rounded-xl border-2 text-left transition-all ${language === lang ? 'bg-discord-blurple/10 border-discord-blurple text-white' : 'bg-discord-lighter border-white/5 text-gray-400 hover:border-white/10'}`}
                            >
                              <div className="font-bold mb-1">{lang}</div>
                              <div className="text-xs opacity-60">System default language</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                          <FileText className="w-7 h-7 text-discord-yellow" /> Text Template
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">Set a custom tone or prefix that the AI should follow when naming categories and channels.</p>
                        <textarea
                          value={template}
                          onChange={(e) => setTemplate(e.target.value)}
                          placeholder="e.g. Use formal names, avoid emojis, or always include a specific prefix..."
                          className="w-full h-40 bg-discord-dark border border-white/10 rounded-xl p-5 text-gray-200 focus:ring-2 focus:ring-discord-blurple outline-none transition-all"
                        />
                      </div>

                      <div className="flex justify-end pt-6 border-t border-white/5">
                        <button
                          onClick={handleSaveSettings}
                          disabled={loading}
                          className="bg-discord-blurple hover:bg-discord-blurple/90 text-white font-bold py-3 px-10 rounded-xl shadow-xl transition-all flex items-center gap-2"
                        >
                          {loading ? 'Saving...' : <CheckCircle2 className="w-5 h-5" />} Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Visual Preview (Hidden if no structure) */}
              <AnimatePresence>
                {structure && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 400, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="bg-discord-lighter border-l border-discord-dark flex-shrink-0 flex flex-col overflow-hidden"
                  >
                    <div className="p-6 border-b border-discord-dark flex justify-between items-center">
                      <h3 className="text-white font-bold flex items-center gap-2">
                        <Layers className="w-5 h-5 text-discord-yellow" /> Preview
                      </h3>
                      <button
                        onClick={handleExecute}
                        disabled={isBuilding}
                        className="bg-discord-green text-black font-bold py-1.5 px-4 rounded-md text-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1"
                      >
                        {isBuilding ? 'Building...' : <Play className="w-4 h-4 fill-current" />} Apply
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 custom-scrollbar">
                      {/* Roles Selection */}
                      {structure.roles && structure.roles.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 text-discord-blurple text-[10px] font-black uppercase mb-3 tracking-widest px-1">
                            <ShieldCheck className="w-3 h-3" /> Roles to Create
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {structure.roles.map((role, rIdx) => (
                              <div key={rIdx} className="flex items-center gap-1.5 px-3 py-1.5 bg-discord-dark rounded-full border border-white/10 text-xs font-bold" style={{ color: role.color }}>
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: role.color }} />
                                {role.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Rules Selection */}
                      {structure.rules && structure.rules.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 text-discord-yellow text-[10px] font-black uppercase mb-3 tracking-widest px-1">
                            <FileText className="w-3 h-3" /> Server Rules
                          </div>
                          <div className="bg-discord-dark rounded-xl p-4 border border-white/5 flex flex-col gap-2">
                            {structure.rules.map((rule, ruIdx) => (
                              <div key={ruIdx} className="text-xs text-gray-400 flex gap-2">
                                <span className="text-discord-yellow/50 font-bold">{ruIdx + 1}.</span>
                                {rule}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Structure Selection */}
                      <div>
                        <div className="flex items-center gap-2 text-gray-500 text-[10px] font-black uppercase mb-3 tracking-widest px-1">
                          <Layers className="w-3 h-3" /> Channel Structure
                        </div>
                        <div className="flex flex-col gap-4">
                          {structure.categories?.map((cat, idx) => (
                            <div key={idx} className="bg-discord-dark rounded-xl p-4 border border-white/5">
                              <div className="flex items-center gap-2 text-gray-400 text-[10px] font-black uppercase mb-2 tracking-widest px-1">
                                <ChevronRight className="w-2 h-2" /> {cat.name}
                              </div>
                              <div className="flex flex-col gap-1">
                                {cat.channels?.map((chan, cIdx) => (
                                  <div key={cIdx} className="flex flex-col px-2 py-1.5 rounded transition-colors group">
                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                      {chan.type === 'voice' ? <Volume2 className="w-4 h-4 opacity-50" /> : <Hash className="w-4 h-4 opacity-50" />}
                                      {chan.name}
                                    </div>
                                    {chan.topic && (
                                      <div className="text-[10px] text-gray-500 ml-6 italic truncate">{chan.topic}</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Construction Progress Overlay */}
            <AnimatePresence>
              {isBuilding && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-discord-dark/95 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center"
                >
                  <div className="w-24 h-24 mb-8 relative">
                    <div className="absolute inset-0 rounded-full border-4 border-discord-blurple/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-discord-blurple border-t-transparent animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Layout className="w-10 h-10 text-discord-blurple animate-pulse" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2 italic">Constructing your World...</h2>
                  <p className="text-gray-400 max-w-md mx-auto leading-relaxed">The AI is currently orchestrating categories, text channels, and voice rooms in **{selectedGuild.name}**.</p>

                  <div className="mt-12 w-full max-w-sm h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 5 }}
                      className="h-full bg-discord-blurple shadow-[0_0_15px_rgba(88,101,242,0.5)]"
                    />
                  </div>
                  <div className="mt-4 text-[10px] font-black tracking-widest text-discord-blurple uppercase">Optimization in progress</div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Global Toasts */}
            <AnimatePresence>
              {status && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute bottom-8 right-8 z-[100]"
                >
                  <div className={`p-4 rounded-xl flex items-center gap-4 border shadow-2xl ${status.type === 'success' ? 'bg-discord-green/20 border-discord-green/40 text-discord-green' : 'bg-discord-red/20 border-discord-red/40 text-discord-red'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${status.type === 'success' ? 'bg-discord-green/20' : 'bg-discord-red/20'}`}>
                      {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-bold text-white leading-tight">{status.type === 'success' ? 'Success' : 'Attention Needed'}</div>
                      <div className="text-sm opacity-80">{status.message}</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
