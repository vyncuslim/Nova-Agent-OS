
import React, { useState } from 'react';
import { AgentConfig, User, GlobalSettings, ModelSettings, ExternalKeys } from '../types';
import { AGENTS } from '../constants';

interface SidebarProps {
  currentAgent: AgentConfig;
  onSelectAgent: (agent: AgentConfig) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  user: User | null;
  onLogout: () => void;
  globalSettings: GlobalSettings;
  modelSettings: ModelSettings;
  onUpdateGlobal: (s: GlobalSettings) => void;
  onUpdateModel: (s: ModelSettings) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentAgent, onSelectAgent, isMobileOpen, onCloseMobile, user, onLogout,
  globalSettings, modelSettings, onUpdateGlobal, onUpdateModel
}) => {
  const [activeTab, setActiveTab] = useState<'agents' | 'memory' | 'settings'>('agents');
  const [newMemory, setNewMemory] = useState('');

  const addMemory = () => {
    if (newMemory.trim()) {
      onUpdateGlobal({ ...globalSettings, memories: [...globalSettings.memories, newMemory.trim()] });
      setNewMemory('');
    }
  };

  const removeMemory = (index: number) => {
    onUpdateGlobal({ 
      ...globalSettings, 
      memories: globalSettings.memories.filter((_, i) => i !== index) 
    });
  };

  const updateExternalKey = (provider: keyof ExternalKeys, value: string) => {
    const updatedKeys = { ...globalSettings.externalKeys, [provider]: value };
    onUpdateGlobal({ ...globalSettings, externalKeys: updatedKeys });
  };

  const clearSystemCache = () => {
    if (confirm("DANGER: This will purge all memories and local settings. Continue?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className={`
      fixed lg:static inset-y-0 left-0 z-40 w-80 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300
      ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20">
            🚀
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Nova Agent OS</h1>
            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Neural Gateway 2.5</p>
          </div>
        </div>
      </div>

      <div className="flex border-b border-slate-800">
        {[
          { id: 'agents', label: 'Agents', icon: '🤖' },
          { id: 'memory', label: 'Memory', icon: '🧠' },
          { id: 'settings', label: 'Settings', icon: '⚙️' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 flex flex-col items-center gap-1
              ${activeTab === tab.id ? 'border-indigo-500 text-white bg-indigo-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            <span className="text-xs">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeTab === 'agents' && (
          <div className="space-y-2">
            <p className="px-2 pb-2 text-[9px] font-black text-slate-600 uppercase tracking-widest">Available Personas</p>
            {AGENTS.map((agent) => (
              <button
                key={agent.id}
                onClick={() => { onSelectAgent(agent); onCloseMobile(); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group border
                  ${currentAgent.id === agent.id 
                    ? 'bg-slate-800/80 text-white border-slate-700 shadow-xl' 
                    : 'text-slate-400 border-transparent hover:bg-slate-800/40 hover:text-slate-200'}
                `}
              >
                <span className={`text-2xl transition-transform group-hover:scale-110 ${currentAgent.id === agent.id ? 'grayscale-0' : 'grayscale opacity-50'}`}>
                  {agent.icon}
                </span>
                <div className="text-left">
                  <p className="font-bold text-xs">{agent.name}</p>
                  <p className="text-[10px] opacity-60 truncate w-44">{agent.description}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'memory' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
            <div className="p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
              <p className="text-[10px] text-slate-400 leading-relaxed mb-4 italic">
                Facts saved here are injected into every agent's neural context to maintain cross-session identity.
              </p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newMemory}
                  onChange={(e) => setNewMemory(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addMemory()}
                  placeholder="e.g. User prefers Python for coding"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[11px] text-indigo-100 outline-none focus:border-indigo-500/50"
                />
                <button onClick={addMemory} className="bg-indigo-600 hover:bg-indigo-500 px-4 rounded-lg text-white font-bold transition-colors">+</button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="px-1 text-[9px] font-black text-slate-600 uppercase tracking-widest">Active Context Chunks</p>
              {globalSettings.memories.length === 0 ? (
                <p className="text-[10px] text-slate-600 italic text-center py-8">Neural memory is currently empty.</p>
              ) : (
                globalSettings.memories.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl group border border-transparent hover:border-slate-700 transition-all">
                    <span className="text-[11px] text-slate-300 line-clamp-2 pr-4">{m}</span>
                    <button onClick={() => removeMemory(i)} className="p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-200 pb-4">
            {/* Model Tuning */}
            <section className="space-y-5">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                Inference Parameters
              </p>
              <div className="space-y-4 px-1">
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Temperature</label>
                    <span className="text-indigo-400 font-mono text-[10px] bg-indigo-500/10 px-1.5 rounded">{modelSettings.temperature}</span>
                  </div>
                  <input 
                    type="range" min="0" max="2" step="0.1" 
                    value={modelSettings.temperature}
                    onChange={(e) => onUpdateModel({...modelSettings, temperature: parseFloat(e.target.value)})}
                    className="w-full accent-indigo-500 bg-slate-800 h-1 rounded-full appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Thinking Budget</label>
                    <span className="text-indigo-400 font-mono text-[10px] bg-indigo-500/10 px-1.5 rounded">{modelSettings.thinkingBudget} tokens</span>
                  </div>
                  <input 
                    type="range" min="0" max="32768" step="1024" 
                    value={modelSettings.thinkingBudget}
                    onChange={(e) => onUpdateModel({...modelSettings, thinkingBudget: parseInt(e.target.value)})}
                    className="w-full accent-indigo-500 bg-slate-800 h-1 rounded-full appearance-none cursor-pointer"
                  />
                  <p className="text-[8px] text-slate-600">Reserved for reasoning steps in Gemini 3 Pro/Flash models.</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Max Output Tokens</label>
                    <span className="text-indigo-400 font-mono text-[10px] bg-indigo-500/10 px-1.5 rounded">{modelSettings.maxOutputTokens}</span>
                  </div>
                  <input 
                    type="range" min="128" max="8192" step="128" 
                    value={modelSettings.maxOutputTokens}
                    onChange={(e) => onUpdateModel({...modelSettings, maxOutputTokens: parseInt(e.target.value)})}
                    className="w-full accent-indigo-500 bg-slate-800 h-1 rounded-full appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </section>

            {/* Neural Uplinks (API Keys) */}
            <section className="space-y-5">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                Neural Uplinks
              </p>
              <div className="space-y-3">
                {[
                  { id: 'openai', label: 'GPT (OpenAI)', icon: '🧠' },
                  { id: 'claude', label: 'Claude (Anthropic)', icon: '🎭' },
                  { id: 'deepseek', label: 'DeepSeek', icon: '🌊' },
                  { id: 'grok', label: 'Grok (xAI)', icon: '🌌' }
                ].map(provider => (
                  <div key={provider.id} className="space-y-1.5">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">{provider.label}</label>
                      <span className={`text-[8px] font-black uppercase px-1.5 rounded-sm ${globalSettings.externalKeys[provider.id as keyof ExternalKeys] ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-600 bg-slate-800'}`}>
                        {globalSettings.externalKeys[provider.id as keyof ExternalKeys] ? 'Uplink Ready' : 'Standby'}
                      </span>
                    </div>
                    <div className="relative group">
                      <input 
                        type="password"
                        placeholder="sk-..."
                        value={globalSettings.externalKeys[provider.id as keyof ExternalKeys] || ''}
                        onChange={(e) => updateExternalKey(provider.id as keyof ExternalKeys, e.target.value)}
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-indigo-200 outline-none focus:border-indigo-500/50 font-mono transition-all"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] cursor-help">🔑</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* System Tools */}
            <section className="pt-4 border-t border-slate-800 space-y-4">
              <button 
                onClick={clearSystemCache}
                className="w-full py-3 px-4 bg-red-500/5 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                Purge Neural Cache
              </button>
            </section>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur-md">
        {user && (
          <div className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-2xl border border-slate-700/50 group mb-4">
            <img src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nova'} className="w-9 h-9 rounded-xl border border-slate-600" alt="Avatar" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <p className="text-[9px] text-slate-500 font-medium tracking-wide uppercase">Neural Link Established</p>
            </div>
            <button onClick={onLogout} className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
          </div>
        )}
        <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20 flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
          <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Core Synchronized</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
