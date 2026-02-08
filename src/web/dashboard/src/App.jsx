import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Layout, Server, Wand2, Play, CheckCircle2, AlertCircle,
  ChevronRight, Layers, Hash, Volume2, MessageSquare,
  Settings, Send, Globe, FileText, ShieldCheck, ShieldAlert, Menu, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNotifications } from './contexts/NotificationContext';
import ThemeToggle from './components/ThemeToggle';
import LanguageSelector from './components/LanguageSelector';
import NotificationCenter from './components/NotificationCenter';
import CommandPalette from './components/CommandPalette';
import DraggableChannelList from './components/DraggableChannelList';
import KeyboardShortcutsPanel from './components/KeyboardShortcutsPanel';
import OnboardingTour from './components/OnboardingTour';
import ProgressBar from './components/ProgressBar';
import useKeyboard from './hooks/useKeyboard';

const App = () => {
  const { t, i18n } = useTranslation();
  const { addNotification } = useNotifications();
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [buildProgress, setBuildProgress] = useState({ progress: 0, status: 'idle', message: '' });

  // Keyboard shortcuts
  useKeyboard({
    'ctrl+k': (e) => {
      e.preventDefault();
      setCommandPaletteOpen(true);
    },
    'ctrl+b': (e) => {
      e.preventDefault();
      setSidebarOpen(prev => !prev);
    },
    'ctrl+/': (e) => {
      e.preventDefault();
      setShortcutsOpen(true);
    },
  });

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

  const fetchTemplates = async () => {
    try {
      const { data } = await axios.get('/api/templates');
      setTemplates(data);
    } catch (err) {
      console.error('Failed to fetch templates', err);
    }
  };

  const applyTemplate = async (templateId) => {
    try {
      const { data } = await axios.get(`/api/templates/${templateId}`);
      setStructure(data);
      setMessages(prev => [...prev, {
        role: 'ai',
        content: `已套用「${data.name}」模板！您可以在右側預覽，準備好後點擊 Apply 建立伺服器。`
      }]);
      setActiveTab('chat');
    } catch (err) {
      console.error('Failed to apply template', err);
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

    // Initialize progress
    setBuildProgress({ progress: 0, status: 'preparing', message: t('status.constructing') });

    try {
      // Simulate progress animation
      const progressSteps = [
        { progress: 20, message: 'Creating categories...' },
        { progress: 40, message: 'Setting up text channels...' },
        { progress: 60, message: 'Configuring voice channels...' },
        { progress: 80, message: 'Assigning roles...' },
        { progress: 100, message: 'Finalizing structure...' },
      ];

      let currentStep = 0;
      const progressInterval = setInterval(() => {
        if (currentStep < progressSteps.length) {
          setBuildProgress({
            progress: progressSteps[currentStep].progress,
            status: 'building',
            message: progressSteps[currentStep].message,
          });
          currentStep++;
        } else {
          clearInterval(progressInterval);
        }
      }, 800);

      await axios.post('/api/execute-build', {
        guildId: selectedGuild.id,
        structure: structure
      });

      // Success
      setTimeout(() => {
        setBuildProgress({ progress: 100, status: 'success', message: t('status.buildStarted') });
        setStatus({ type: 'success', message: t('status.buildStarted') });
        setTimeout(() => {
          setBuildProgress({ progress: 0, status: 'idle', message: '' });
          setIsBuilding(false);
        }, 2000);
      }, 4000);
    } catch (err) {
      console.error('Execution failed', err);
      setBuildProgress({ progress: 0, status: 'error', message: t('status.buildFailed') });
      setStatus({ type: 'error', message: t('status.buildFailed') });
      setTimeout(() => {
        setBuildProgress({ progress: 0, status: 'idle', message: '' });
        setIsBuilding(false);
      }, 3000);
    }
  };

  const handleCategoryReorder = (newCategories) => {
    setStructure(prev => ({
      ...prev,
      categories: newCategories,
    }));
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-discord-blurple"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 text-center max-w-md w-full"
        >
          <div className="bg-discord-blurple/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Layout className="w-10 h-10 text-discord-blurple" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">{t('dashboard.welcomeBack')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">{t('dashboard.loginDescription')}</p>
          <a
            href="/auth/discord"
            className="bg-discord-blurple hover:bg-opacity-90 text-gray-900 font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] shadow-xl"
          >
            <Server className="w-5 h-5" />
            {t('common.login')} with Discord
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        guilds={guilds}
        selectedGuild={selectedGuild}
        onSelectGuild={setSelectedGuild}
        onNavigate={setActiveTab}
      />

      {/* Keyboard Shortcuts Panel */}
      <KeyboardShortcutsPanel
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

      {/* Onboarding Tour */}
      <OnboardingTour />

      {/* Progress Bar */}
      <ProgressBar
        progress={buildProgress.progress}
        status={buildProgress.status}
        message={buildProgress.message}
      />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
        {/* Sidebar */}
        <div className={`w-72 bg-white dark:bg-gray-800 p-6 border-r border-gray-200 dark:border-gray-700 flex flex-col gap-6 flex-shrink-0 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 absolute md:relative z-30 h-full`}>
          <div className="flex items-center gap-3 text-gray-900 dark:text-gray-100 font-bold text-xl mb-4">
            <Layout className="w-8 h-8 text-discord-blurple" />
            <span>{t('dashboard.title')}</span>
          </div>

          <div className="flex flex-col gap-2 flex-1 overflow-hidden">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider px-1">{t('dashboard.selectServer')}</label>
            <div className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
              {guilds.map(guild => (
                <button
                  key={guild.id}
                  onClick={() => setSelectedGuild(guild)}
                  className={`flex items-center gap-3 p-3 rounded-md transition-all ${selectedGuild?.id === guild.id
                    ? 'bg-discord-blurple text-gray-900 shadow-lg'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                >
                  {guild.iconUrl ? (
                    <img src={guild.iconUrl} alt={guild.name} className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-xs text-gray-900">
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
          <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <img
                src={user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png'}
                className="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-600"
                alt="Avatar"
              />
              <div className="flex flex-col overflow-hidden">
                <span className="text-gray-900 dark:text-gray-100 text-sm font-bold truncate">{user.username}</span>
                <a href="/auth/logout" className="text-[10px] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors uppercase font-bold tracking-tighter">{t('common.logout')}</a>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {!selectedGuild ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 gap-4">
              <Server className="w-16 h-16 opacity-20" />
              <p className="text-xl">{t('dashboard.noServerSelected')}</p>
            </div>
          ) : (
            <>
              {/* Top Bar / Tabs */}
              <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center px-8 flex-shrink-0">
                <div className="flex items-center gap-8">
                  <h2 className="text-gray-900 dark:text-gray-100 font-bold flex items-center gap-2">
                    <Server className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    {selectedGuild.name}
                  </h2>
                  <nav className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveTab('chat')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all ${activeTab === 'chat' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                    >
                      <MessageSquare className="w-4 h-4" /> {t('dashboard.aiArchitect')}
                    </button>
                    <button
                      onClick={() => setActiveTab('settings')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all ${activeTab === 'settings' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                    >
                      <Settings className="w-4 h-4" /> {t('common.settings')}
                    </button>
                  </nav>
                </div>

                <div className="flex items-center gap-3">
                  {botStatus && (
                    <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border ${botStatus.hasAdmin ? 'text-discord-green bg-discord-green/10 border-discord-green/20' : 'text-discord-red bg-discord-red/10 border-discord-red/20'}`}>
                      {botStatus.hasAdmin ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                      {botStatus.hasAdmin ? t('status.adminGranted') : t('status.adminMissing')}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <LanguageSelector />
                    <NotificationCenter />
                  </div>
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Left Column: Chat or Settings */}
                <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
                  {activeTab === 'chat' ? (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      {/* Chat Messages */}
                      <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 custom-scrollbar">
                        {messages.map((msg, idx) => (
                          <div key={idx} className={`flex gap-4 ${msg.role === 'ai' ? '' : 'flex-row-reverse'}`}>
                            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'ai' ? 'bg-discord-blurple text-gray-900' : 'bg-gray-700 dark:bg-gray-600 text-gray-300 font-bold'}`}>
                              {msg.role === 'ai' ? <Wand2 className="w-6 h-6" /> : user.username[0]}
                            </div>
                            <div className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-md ${msg.role === 'ai' ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-gray-700' : 'bg-discord-blurple text-gray-900 rounded-tr-none'}`}>
                              <p className="text-sm leading-relaxed">{msg.content}</p>
                            </div>
                          </div>
                        ))}
                        {loading && (
                          <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-discord-blurple flex items-center justify-center animate-pulse">
                              <Wand2 className="w-6 h-6 text-gray-900" />
                            </div>
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-none px-5 py-3 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <div className="w-1.5 h-1.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <div className="w-1.5 h-1.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Chat Input */}
                      <div className="p-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                        <form onSubmit={handleGenerate} className="flex gap-3 bg-gray-50 dark:bg-gray-900 rounded-xl p-2 border border-gray-200 dark:border-gray-700 focus-within:border-discord-blurple/50 transition-all">
                          <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={t('ai.descriptionPlaceholder', { serverName: selectedGuild.name })}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 px-4 py-2"
                          />
                          <button
                            type="submit"
                            disabled={loading || !input}
                            className="bg-discord-blurple hover:opacity-90 disabled:opacity-50 text-gray-900 rounded-lg px-4 flex items-center justify-center transition-all"
                          >
                            <Send className="w-5 h-5" />
                          </button>
                        </form>
                      </div>
                    </div>
                  ) : (
                    /* Settings Tab */
                    <div className="flex-1 p-12 overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-gray-900">
                      <div className="max-w-2xl flex flex-col gap-10">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                            <Layout className="w-7 h-7 text-discord-blurple" /> {t('settings.quickTemplates')}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('settings.quickTemplatesDesc')}</p>
                          <div className="grid grid-cols-3 gap-4">
                            {templates.map(tmpl => (
                              <button
                                key={tmpl.id}
                                onClick={() => applyTemplate(tmpl.id)}
                                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:border-discord-blurple dark:hover:border-discord-blurple rounded-xl p-4 text-left transition-all group">
                                <div className="text-3xl mb-2">{tmpl.icon}</div>
                                <div className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-1 group-hover:text-discord-blurple">{tmpl.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{tmpl.description}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                            <Globe className="w-7 h-7 text-discord-blurple" /> Localization
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            {['Traditional Chinese', 'English', 'Japanese', 'Korean'].map(lang => (
                              <button
                                key={lang}
                                onClick={() => setLanguage(lang)}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${language === lang ? 'bg-discord-blurple/10 border-discord-blurple text-gray-900' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                              >
                                <div className="font-bold mb-1">{lang}</div>
                                <div className="text-xs opacity-60">System default language</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                            <FileText className="w-7 h-7 text-discord-yellow" /> {t('settings.textTemplate')}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('settings.textTemplateDesc')}</p>
                          <textarea
                            value={template}
                            onChange={(e) => setTemplate(e.target.value)}
                            placeholder={t('settings.textTemplatePlaceholder')}
                            className="w-full h-40 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-5 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-discord-blurple outline-none transition-all"
                          />
                        </div>

                        <div className="flex justify-end pt-6 border-t border-gray-200">
                          <button
                            onClick={handleSaveSettings}
                            disabled={loading}
                            className="bg-discord-blurple hover:bg-discord-blurple/90 text-gray-900 font-bold py-3 px-10 rounded-xl shadow-xl transition-all flex items-center gap-2"
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
                      className="bg-white border-l border-discord-dark flex-shrink-0 flex flex-col overflow-hidden"
                    >
                      <div className="p-6 border-b border-discord-dark flex justify-between items-center">
                        <h3 className="text-gray-900 font-bold flex items-center gap-2">
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
                                <div key={rIdx} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-300 text-xs font-bold" style={{ color: role.color }}>
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
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex flex-col gap-2">
                              {structure.rules.map((rule, ruIdx) => (
                                <div key={ruIdx} className="text-xs text-gray-600 flex gap-2">
                                  <span className="text-discord-yellow/50 font-bold">{ruIdx + 1}.</span>
                                  {rule}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Structure Selection */}
                        <div>
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase mb-3 tracking-widest px-1">
                            <Layers className="w-3 h-3" /> Channel Structure
                          </div>

                          {/* Draggable Channel List */}
                          <DraggableChannelList
                            categories={structure.categories || []}
                            onReorder={handleCategoryReorder}
                          />
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
                    className="absolute inset-0 z-50 bg-gray-50/95 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center"
                  >
                    <div className="w-24 h-24 mb-8 relative">
                      <div className="absolute inset-0 rounded-full border-4 border-discord-blurple/20" />
                      <div className="absolute inset-0 rounded-full border-4 border-discord-blurple border-t-transparent animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Layout className="w-10 h-10 text-discord-blurple animate-pulse" />
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2 italic">Constructing your World...</h2>
                    <p className="text-gray-600 max-w-md mx-auto leading-relaxed">The AI is currently orchestrating categories, text channels, and voice rooms in **{selectedGuild.name}**.</p>

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
                        <div className="font-bold text-gray-900 leading-tight">{status.type === 'success' ? 'Success' : 'Attention Needed'}</div>
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
    </>
  );
};

export default App;
