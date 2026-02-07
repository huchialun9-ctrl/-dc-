import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Layout, Server, Wand2, Play, CheckCircle2, AlertCircle, ChevronRight, Layers, Hash, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const App = () => {
  const [guilds, setGuilds] = useState([]);
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [user, setUser] = useState(null);
  const [description, setDescription] = useState('');
  const [structure, setStructure] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Check session/user first
      const { data: userData } = await axios.get('/api/user');
      setUser(userData.user);

      const { data: guildData } = await axios.get('/api/guilds');
      setGuilds(guildData);
      setError(null);
    } catch (err) {
      console.error('Auth check/Guild fetch failed', err);
      if (err.response?.status === 401) {
        setUser(null);
      } else {
        setError('Connection problem. Please try again.');
      }
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-discord-dark flex">
      {/* Sidebar */}
      <div className="w-72 bg-discord-lighter p-6 border-r border-discord-dark flex flex-col gap-6">
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
                  <div className="w-8 h-8 rounded-full bg-discord-lightest flex items-center justify-center font-bold text-xs">
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

      {/* Main Content */}
      <div className="flex-1 p-10 overflow-y-auto">
        {!selectedGuild ? (
          <div className="h-full flex flex-center flex-col items-center justify-center text-gray-500 gap-4">
            <Server className="w-16 h-16 opacity-20" />
            <p className="text-xl">Please select a server to begin</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto flex flex-col gap-8"
          >
            <header className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Build Server Structure</h1>
                <p className="text-gray-400">Describe your ideal server and let AI do the rest.</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-discord-green bg-discord-green/10 px-3 py-1 rounded-full border border-discord-green/20">
                <CheckCircle2 className="w-4 h-4" />
                {selectedGuild.name} Linked
              </div>
            </header>

            {/* AI Input */}
            <div className="bg-discord-lighter rounded-xl p-6 shadow-xl border border-white/5">
              <label className="block text-sm font-semibold text-gray-300 mb-4 uppercase flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-discord-blurple" />
                AI Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. I want an E-sports team server with training rooms, strategy discussion area, and separate voice channels for each game..."
                className="w-full h-32 bg-discord-dark border border-white/10 rounded-lg p-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-discord-blurple transition-all"
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleGenerate}
                  disabled={loading || !description}
                  className="bg-discord-blurple hover:bg-opacity-90 disabled:opacity-50 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-all shadow-lg"
                >
                  {loading ? 'Generating...' : (
                    <>
                      <Play className="w-4 h-4" /> Generate Structure
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Preview Section */}
            <AnimatePresence>
              {structure && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col gap-6"
                >
                  <div className="bg-discord-lighter rounded-xl p-6 shadow-xl border border-white/5">
                    <div className="flex justify-between items-center mb-6">
                      <label className="text-sm font-semibold text-gray-300 uppercase flex items-center gap-2">
                        <Layers className="w-4 h-4 text-discord-yellow" />
                        Visual Preview
                      </label>
                      <button
                        onClick={handleExecute}
                        disabled={loading}
                        className="bg-discord-green text-black font-bold py-2 px-6 rounded-lg flex items-center gap-2 hover:bg-opacity-90 transition-all shadow-lg"
                      >
                        {loading ? 'Executing...' : 'Apply Structure'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {structure.categories?.map((cat, idx) => (
                        <div key={idx} className="bg-discord-dark rounded-lg p-4 border border-white/5">
                          <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase mb-3">
                            <ChevronRight className="w-3 h-3" />
                            {cat.name}
                          </div>
                          <div className="flex flex-col gap-1">
                            {cat.channels?.map((chan, cIdx) => (
                              <div key={cIdx} className="flex items-center gap-2 p-1 text-sm text-gray-300">
                                {chan.type === 'voice' ? <Volume2 className="w-4 h-4 opacity-50" /> : <Hash className="w-4 h-4 opacity-50" />}
                                {chan.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Status Toasts */}
            {status && (
              <div className={`p-4 rounded-lg flex items-center gap-3 border shadow-lg ${status.type === 'success'
                ? 'bg-discord-green/10 border-discord-green text-discord-green'
                : 'bg-discord-red/10 border-discord-red text-discord-red'
                }`}>
                {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <span className="font-semibold">{status.message}</span>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default App;
