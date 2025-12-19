
import React, { useState } from 'react';
import { AgentConfig, User, GlobalSettings, ModelSettings } from '../types';
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
  const [activeTab, setActiveTab] = useState<'agents' | 'memory' | 'tuning'>('agents');
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

  return (
    <div className={`
      fixed lg:static inset-y-0 left-0 z-40 w-80 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300
      ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20">
            🚀
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Nova Agent OS</h1>
            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Neural Gateway 2.5</p>
          </div>
        </div>
      </div>

      <div className="flex border-b border-slate-800">
        {['agents', 'memory', 'tuning'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 
              ${activeTab === tab ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeTab === 'agents' && (
          <div className="space-y-2">
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
                <span className={`text-2xl ${currentAgent.id === agent.id ? 'grayscale-0' : 'grayscale opacity-50'}`}>
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
            <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
              <p className="text-[10px] text-slate-400 leading-relaxed mb-3 italic">
                Facts saved here are injected into every agent's neural context.
              </p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newMemory}
                  onChange={(e) => setNewMemory(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addMemory()}
                  placeholder="e.g. My cat is named Luna"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[11px] outline-none focus:border-indigo-500"
                />
                <button onClick={addMemory} className="bg-indigo-600 px-3 rounded-lg text-white font-bold">+</button>
              </div>
            </div>
            <div className="space-y-2">
              {globalSettings.memories.map((m, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-slate-800/40 rounded-lg group">
                  <span className="text-[11px] text-slate-300 truncate pr-4">{m}</span>
                  <button onClick={() => removeMemory(i)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tuning' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-200">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Temperature</label>
                  <span className="text-indigo-400 font-mono text-[10px]">{modelSettings.temperature}</span>
                </div>
                <input 
                  type="range" min="0" max="2" step="0.1" 
                  value={modelSettings.temperature}
                  onChange={(e) => onUpdateModel({...modelSettings, temperature: parseFloat(e.target.value)})}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Thinking Budget</label>
                  <span className="text-indigo-400 font-mono text-[10px]">{modelSettings.thinkingBudget}</span>
                </div>
                <input 
                  type="range" min="0" max="32768" step="1024" 
                  value={modelSettings.thinkingBudget}
                  onChange={(e) => onUpdateModel({...modelSettings, thinkingBudget: parseInt(e.target.value)})}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Max Output</label>
                  <span className="text-indigo-400 font-mono text-[10px]">{modelSettings.maxOutputTokens}</span>
                </div>
                <input 
                  type="range" min="128" max="8192" step="128" 
                  value={modelSettings.maxOutputTokens}
                  onChange={(e) => onUpdateModel({...modelSettings, maxOutputTokens: parseInt(e.target.value)})}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-4">
              <p className="text-[9px] font-black text-slate-600 uppercase">External Uplinks (Reserved)</p>
              {['OpenAI', 'DeepSeek', 'Grok'].map(provider => (
                <div key={provider} className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-800 rounded-xl opacity-50">
                  <span className="text-[11px] font-bold">{provider}</span>
                  <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">Offline</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-800">
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
