import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Layout, Server, Wand2, Play, CheckCircle2, AlertCircle, ChevronRight, Layers, Hash, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const App = () => {
  const [guilds, setGuilds] = useState([]);
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [description, setDescription] = useState('');
  const [structure, setStructure] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetchGuilds();
  }, []);

  const fetchGuilds = async () => {
    try {
      const { data } = await axios.get('/api/guilds');
      setGuilds(data);
    } catch (err) {
      console.error('Failed to fetch guilds', err);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/generate-structure?description=${encodeURIComponent(description)}`);
      setStructure(data);
      setStatus(null);
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to generate structure' });
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post('/api/execute-build', {
        guildId: selectedGuild.id,
        structure,
        description
      });
      setStatus({ type: 'success', message: 'Building process started!' });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to execute build' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-discord-dark flex">
      {/* Sidebar */}
      <div className="w-72 bg-discord-lighter p-6 border-r border-discord-dark flex flex-col gap-6">
        <div className="flex items-center gap-3 text-white font-bold text-xl mb-4">
          <Layout className="w-8 h-8 text-discord-blurple" />
          <span>Bot Dashboard</span>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Select Server</label>
          <div className="flex flex-col gap-2">
            {guilds.map(guild => (
              <button
                key={guild.id}
                onClick={() => setSelectedGuild(guild)}
                className={`flex items-center gap-3 p-3 rounded-md transition-all ${selectedGuild?.id === guild.id
                    ? 'bg-discord-blurple text-white'
                    : 'hover:bg-discord-lightest text-gray-300'
                  }`}
              >
                {guild.iconUrl ? (
                  <img src={guild.iconUrl} alt={guild.name} className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-discord-lightest flex items-center justify-center font-bold">
                    {guild.name[0]}
                  </div>
                )}
                <span className="truncate flex-1 text-left">{guild.name}</span>
                {guild.botPresent && <div className="w-2 h-2 rounded-full bg-discord-green" />}
              </button>
            ))}
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
