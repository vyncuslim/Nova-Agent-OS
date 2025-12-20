
import React, { useState } from 'react';
import { AgentConfig, User, GlobalSettings, ModelSettings, ExternalKeys, Language, CoreProvider, ImageSize } from '../types';
import { AGENTS } from '../constants';
import { translations } from '../translations';

declare const window: any;

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
  onClearHistory: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentAgent, onSelectAgent, isMobileOpen, onCloseMobile, user, onLogout,
  globalSettings, modelSettings, onUpdateGlobal, onUpdateModel, onClearHistory
}) => {
  const t = translations[modelSettings.language];
  const [activeTab, setActiveTab] = useState<'agents' | 'memory' | 'settings'>('agents');
  const [newMemory, setNewMemory] = useState('');
  const [showManifest, setShowManifest] = useState(false);

  const availableModels = [
    'gemini-3-flash-preview',
    'gemini-3-pro-preview',
    'gemini-flash-lite-latest',
    'gemini-2.5-flash-image',
    'gemini-3-pro-image-preview',
    'veo-3.1-fast-generate-preview'
  ];

  const imageSizes: ImageSize[] = ['1K', '2K', '4K'];

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

  const updateExternalKey = (provider: string, value: string) => {
    const updatedKeys = { ...globalSettings.externalKeys, [provider]: value };
    onUpdateGlobal({ ...globalSettings, externalKeys: updatedKeys });
  };

  const updateModelOverride = (agentId: string, model: string) => {
    const overrides = { ...modelSettings.customModelOverrides, [agentId]: model };
    onUpdateModel({ ...modelSettings, customModelOverrides: overrides });
  };

  const coreProviders: CoreProvider[] = ['GEMINI', 'CLAUDE', 'GPT', 'DEEPSEEK', 'GROK'];
  const voices = ['Kore', 'Puck', 'Charon', 'Zephyr', 'Fenrir'];

  return (
    <div className={`
      fixed lg:static inset-y-0 left-0 z-40 w-80 bg-slate-950/80 backdrop-blur-2xl border-r border-white/5 flex flex-col transition-all duration-500 ease-in-out
      ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="p-8 border-b border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-600/20 transition-all duration-700"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center text-2xl shadow-2xl shadow-indigo-500/30 ring-1 ring-white/20 animate-pulse">
            🛸
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-black text-xl tracking-tighter text-white uppercase italic">{t.app_name}</h1>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-[0.3em] font-mono">{t.neural_gateway}</p>
          </div>
          <button 
            onClick={() => setShowManifest(true)}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all border border-white/5"
          >
            📋
          </button>
        </div>
      </div>

      <div className="flex px-4 py-2 bg-slate-900/40 gap-1 border-b border-white/5">
        {[
          { id: 'agents', label: t.tab_agents, icon: '🤖' },
          { id: 'memory', label: t.tab_memory, icon: '🧠' },
          { id: 'settings', label: t.tab_settings, icon: '⚙️' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 px-1 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-1
              ${activeTab === tab.id ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
          >
            <span className="text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
        {activeTab === 'agents' && (
          <div className="space-y-3 animate-in fade-in slide-in-from-left-4 duration-500">
            <p className="px-2 pb-2 text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
              {t.available_personas}
            </p>
            {AGENTS.map((agent) => (
              <button
                key={agent.id}
                onClick={() => { onSelectAgent(agent); onCloseMobile(); }}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group border relative overflow-hidden
                  ${currentAgent.id === agent.id 
                    ? 'bg-indigo-600/10 text-white border-indigo-500/40 shadow-2xl shadow-indigo-900/20' 
                    : 'text-slate-400 border-white/5 hover:bg-white/5 hover:text-slate-200'}
                `}
              >
                {currentAgent.id === agent.id && (
                  <div className="absolute left-0 top-0 w-1 h-full bg-indigo-500"></div>
                )}
                <span className={`text-2xl transition-transform group-hover:scale-110 duration-500 ${currentAgent.id === agent.id ? 'grayscale-0' : 'grayscale opacity-40 group-hover:opacity-100 group-hover:grayscale-0'}`}>
                  {agent.icon}
                </span>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-black text-[13px] tracking-tight">{agent.name}</p>
                  <p className="text-[9px] opacity-60 font-mono tracking-tighter mt-0.5 truncate uppercase">
                    {modelSettings.customModelOverrides[agent.id] || agent.model}
                  </p>
                </div>
                {currentAgent.id === agent.id && (
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full neural-pulse"></div>
                )}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'memory' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-indigo-600/5 border border-white/5 rounded-[2rem] p-6 space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
                🧠 {t.memory_bank}
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                {t.memory_desc}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMemory}
                  onChange={(e) => setNewMemory(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addMemory()}
                  placeholder={t.neural_imprint}
                  className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-indigo-500/50 transition-all font-medium"
                />
                <button onClick={addMemory} className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-500 transition-all active:scale-95 shadow-xl shadow-indigo-600/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="px-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.active_imprints}</p>
              {globalSettings.memories.map((m, i) => (
                <div key={i} className="group flex items-center gap-4 bg-white/3 p-4 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all">
                  <span className="text-xs text-indigo-500 font-black">#{(i+1).toString().padStart(2, '0')}</span>
                  <p className="flex-1 text-[11px] text-slate-300 font-medium leading-relaxed">{m}</p>
                  <button onClick={() => removeMemory(i)} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 transition-all hover:bg-red-500/10 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500 pb-8">
            <section className="space-y-5">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
                {t.settings_language}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(['EN', 'ZH'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => onUpdateModel({ ...modelSettings, language: lang })}
                    className={`py-3 text-[10px] font-black rounded-xl border transition-all ${
                      modelSettings.language === lang 
                        ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400 shadow-inner' 
                        : 'bg-white/3 border-white/5 text-slate-600 hover:text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    {lang === 'EN' ? 'ENGLISH' : '简体中文'}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-5 bg-white/3 p-5 rounded-3xl border border-white/5">
              <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                {t.settings_save_history}
              </p>
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-slate-400">{t.settings_save_history}</span>
                <button 
                  onClick={() => onUpdateModel({ ...modelSettings, saveHistory: !modelSettings.saveHistory })}
                  className={`w-12 h-6 rounded-full transition-all relative ${modelSettings.saveHistory ? 'bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'bg-slate-800'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${modelSettings.saveHistory ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
              <button 
                onClick={onClearHistory}
                className="w-full py-3 text-[10px] font-black text-slate-400 hover:text-red-400 bg-white/5 hover:bg-red-500/5 border border-white/5 hover:border-red-500/20 rounded-xl transition-all uppercase tracking-[0.2em]"
              >
                🗑️ {t.clear_history}
              </button>
            </section>

            <section className="space-y-5">
              <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-violet-500 rounded-full"></span>
                {t.agent_model_override}
              </p>
              <div className="space-y-4">
                {AGENTS.map(a => (
                  <div key={a.id} className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 font-black uppercase ml-1 flex justify-between">
                      {a.name}
                      <span className="opacity-50 font-mono">CORE</span>
                    </label>
                    <select 
                      value={modelSettings.customModelOverrides[a.id] || a.model}
                      onChange={(e) => updateModelOverride(a.id, e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-[11px] text-indigo-300 outline-none focus:border-indigo-500/50 transition-all font-mono appearance-none"
                    >
                      {availableModels.map(m => (
                        <option key={m} value={m} className="bg-slate-900">{m}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-5">
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                {t.grounding_tools}
              </p>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { key: 'useSearch', label: t.use_search, color: 'bg-orange-600' },
                  { key: 'useMaps', label: t.use_maps, color: 'bg-blue-600' }
                ].map((tool) => (
                  <button 
                    key={tool.key}
                    onClick={() => onUpdateModel({ ...modelSettings, [tool.key]: !(modelSettings as any)[tool.key] })}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      (modelSettings as any)[tool.key] 
                        ? `bg-white/5 border-orange-500/30 text-white` 
                        : 'bg-transparent border-white/5 text-slate-500'
                    }`}
                  >
                    <span className="text-[11px] font-black uppercase tracking-widest">{tool.label}</span>
                    <div className={`w-10 h-5 rounded-full relative transition-all ${(modelSettings as any)[tool.key] ? tool.color : 'bg-slate-800'}`}>
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${(modelSettings as any)[tool.key] ? 'right-1' : 'left-1'}`}></div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-5">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                {t.settings_audio}
              </p>
              <div className="space-y-5">
                <div className="flex items-center justify-between p-4 bg-white/3 rounded-2xl border border-white/5">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t.settings_auto_read}</span>
                  <button 
                    onClick={() => onUpdateModel({ ...modelSettings, autoRead: !modelSettings.autoRead })}
                    className={`w-10 h-5 rounded-full transition-all relative ${modelSettings.autoRead ? 'bg-indigo-600' : 'bg-slate-800'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${modelSettings.autoRead ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {voices.map(v => (
                    <button
                      key={v}
                      onClick={() => onUpdateModel({ ...modelSettings, voiceName: v })}
                      className={`py-3 px-3 text-[10px] rounded-xl border transition-all font-black uppercase tracking-tighter ${
                        modelSettings.voiceName === v ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-white/3 border-white/5 text-slate-600'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-5 pt-8 border-t border-white/5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.settings_uplinks}</p>
              <div className="space-y-4">
                {coreProviders.map(p => (
                  <div key={p} className="space-y-1.5">
                    <label className="text-[10px] text-slate-600 font-black uppercase ml-1">{p}</label>
                    <div className="relative">
                      <input 
                        type="password"
                        placeholder="••••••••••••••••"
                        value={globalSettings.externalKeys[p.toLowerCase() as keyof ExternalKeys] || ''}
                        onChange={(e) => updateExternalKey(p.toLowerCase(), e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-[11px] text-indigo-200 outline-none focus:border-indigo-500/50 font-mono tracking-widest"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-indigo-500/50 font-black">LINK</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <button 
              onClick={() => { if(confirm(t.purge_confirm)) { localStorage.clear(); window.location.reload(); } }}
              className="w-full py-5 text-[11px] font-black text-red-500 hover:text-white bg-red-500/5 hover:bg-red-600 border border-red-500/20 rounded-[1.5rem] transition-all uppercase tracking-[0.3em] mt-8 shadow-2xl shadow-red-900/10"
            >
              ☢️ {t.settings_purge}
            </button>
          </div>
        )}
      </div>

      <div className="p-8 border-t border-white/5 bg-slate-900/40 relative group overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="relative">
            <img src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nova'} alt="Profile" className="w-12 h-12 rounded-2xl border border-white/10 bg-slate-800 shadow-xl group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-950 rounded-full animate-pulse"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-black text-white truncate uppercase tracking-tight italic">{user?.name || 'GUEST-01'}</p>
            <p className="text-[9px] text-emerald-400 font-black uppercase tracking-[0.3em] font-mono">{t.ready}</p>
          </div>
          <button onClick={onLogout} className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
