
import React, { useState } from 'react';
import { AgentConfig, User, GlobalSettings, ModelSettings, ExternalKeys, InferenceMode, UIDensity, Language, CoreProvider } from '../types';
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
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentAgent, onSelectAgent, isMobileOpen, onCloseMobile, user, onLogout,
  globalSettings, modelSettings, onUpdateGlobal, onUpdateModel
}) => {
  const t = translations[modelSettings.language];
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
    if (confirm(t.purge_confirm)) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleGeminiSync = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
    }
  };

  const voices = ['Kore', 'Puck', 'Charon', 'Zephyr', 'Fenrir'];
  const providers: { id: keyof ExternalKeys; label: string; placeholder: string; color: string }[] = [
    { id: 'openai', label: 'GPT (OpenAI)', placeholder: 'sk-proj-...', color: 'text-emerald-400' },
    { id: 'claude', label: 'Claude (Anthropic)', placeholder: 'sk-ant-api03-...', color: 'text-orange-400' },
    { id: 'codex', label: 'CodeX / Specialized', placeholder: 'cx-neural-...', color: 'text-blue-400' },
    { id: 'deepseek', label: 'DeepSeek', placeholder: 'sk-...', color: 'text-cyan-400' },
    { id: 'grok', label: 'Grok (xAI)', placeholder: 'xai-...', color: 'text-indigo-400' },
  ];

  const coreProviders: CoreProvider[] = ['GEMINI', 'CLAUDE', 'GPT', 'DEEPSEEK', 'GROK'];

  return (
    <div className={`
      fixed lg:static inset-y-0 left-0 z-40 w-80 bg-slate-950 border-r border-slate-800 flex flex-col transition-transform duration-300
      ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="p-6 border-b border-slate-800 bg-slate-900/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">
            🚀
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-white">{t.app_name}</h1>
            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">{t.neural_gateway}</p>
          </div>
        </div>
      </div>

      <div className="flex bg-slate-900/40">
        {[
          { id: 'agents', label: t.tab_agents, icon: '🤖' },
          { id: 'memory', label: t.tab_memory, icon: '🧠' },
          { id: 'settings', label: t.tab_settings, icon: '⚙️' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest transition-all border-b-2 flex flex-col items-center gap-1.5
              ${activeTab === tab.id ? 'border-indigo-500 text-white bg-indigo-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            <span className="text-sm">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#050811]">
        {activeTab === 'agents' && (
          <div className="space-y-2 animate-in fade-in slide-in-from-left-4 duration-300">
            <p className="px-2 pb-2 text-[9px] font-black text-slate-600 uppercase tracking-widest">{t.available_personas}</p>
            {AGENTS.map((agent) => (
              <button
                key={agent.id}
                onClick={() => { onSelectAgent(agent); onCloseMobile(); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group border text-left
                  ${currentAgent.id === agent.id 
                    ? 'bg-slate-800/80 text-white border-slate-600 shadow-xl ring-1 ring-indigo-500/30' 
                    : 'text-slate-400 border-transparent hover:bg-slate-800/40 hover:text-slate-200'}
                `}
              >
                <span className={`text-2xl transition-transform group-hover:scale-110 ${currentAgent.id === agent.id ? 'grayscale-0' : 'grayscale opacity-50'}`}>
                  {agent.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs">{agent.name}</p>
                  <p className="text-[10px] opacity-60 truncate">{agent.description}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'memory' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
            <div className="p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
              <p className="text-[10px] text-slate-400 leading-relaxed mb-4 italic">
                {t.memory_desc}
              </p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newMemory}
                  onChange={(e) => setNewMemory(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addMemory()}
                  placeholder={t.neural_imprint}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[11px] text-indigo-100 outline-none focus:border-indigo-500/50"
                />
                <button onClick={addMemory} className="bg-indigo-600 hover:bg-indigo-500 px-4 rounded-lg text-white font-bold transition-colors">+</button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="px-1 text-[9px] font-black text-slate-600 uppercase tracking-widest">{t.active_imprints}</p>
              {globalSettings.memories.length === 0 ? (
                <p className="text-[10px] text-slate-700 italic text-center py-8">Memory bank empty.</p>
              ) : (
                globalSettings.memories.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-800/20 rounded-xl group border border-slate-800/50 hover:border-slate-700 transition-all">
                    <span className="text-[11px] text-slate-300 line-clamp-2 pr-4">{m}</span>
                    <button onClick={() => removeMemory(i)} className="p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 pb-4">
            
            {/* Language Switcher */}
            <section className="space-y-4">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                {t.settings_language}
              </p>
              <div className="grid grid-cols-2 gap-1.5 px-0.5">
                {(['EN', 'ZH'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => onUpdateModel({ ...modelSettings, language: lang })}
                    className={`py-2 text-[10px] font-black rounded-lg border transition-all ${
                      modelSettings.language === lang 
                        ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' 
                        : 'bg-slate-900 border-slate-800 text-slate-600 hover:text-slate-400'
                    }`}
                  >
                    {lang === 'EN' ? 'English' : '华文 / 中文'}
                  </button>
                ))}
              </div>
            </section>

            {/* Core Provider Switcher */}
            <section className="space-y-4">
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full shadow-[0_0_5px_rgba(244,63,94,1)]"></span>
                {t.settings_core}
              </p>
              <div className="grid grid-cols-3 gap-1.5 px-0.5">
                {coreProviders.map((prov) => (
                  <button
                    key={prov}
                    onClick={() => onUpdateModel({ ...modelSettings, coreProvider: prov })}
                    className={`py-2 text-[9px] font-black rounded-lg border transition-all truncate px-1 ${
                      modelSettings.coreProvider === prov 
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' 
                        : 'bg-slate-900 border-slate-800 text-slate-600 hover:text-slate-400'
                    }`}
                  >
                    {prov}
                  </button>
                ))}
              </div>
              <p className="text-[8px] text-slate-600 italic px-1">Note: Non-Gemini providers require an external Neural Uplink key to function.</p>
            </section>

            {/* Inference Mode */}
            <section className="space-y-4">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_5px_rgba(99,102,241,1)]"></span>
                {t.settings_inference}
              </p>
              <div className="grid grid-cols-3 gap-1.5 px-0.5">
                {(['STANDARD', 'PRECISION', 'TURBO'] as InferenceMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => onUpdateModel({ ...modelSettings, inferenceMode: mode })}
                    className={`py-2 text-[9px] font-black rounded-lg border transition-all ${
                      modelSettings.inferenceMode === mode 
                        ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' 
                        : 'bg-slate-900 border-slate-800 text-slate-600 hover:text-slate-400'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </section>

            {/* Voice & Synthesis */}
            <section className="space-y-4">
              <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-violet-500 rounded-full shadow-[0_0_5px_rgba(139,92,246,1)]"></span>
                {t.settings_audio}
              </p>
              <div className="space-y-3 px-1">
                <div className="flex items-center justify-between bg-slate-900/50 p-2 rounded-xl border border-slate-800">
                  <label className="text-[10px] font-black text-slate-500 uppercase">{t.settings_auto_read}</label>
                  <button 
                    onClick={() => onUpdateModel({...modelSettings, autoRead: !modelSettings.autoRead})}
                    className={`w-10 h-5 rounded-full relative transition-all ${modelSettings.autoRead ? 'bg-indigo-600' : 'bg-slate-800'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${modelSettings.autoRead ? 'left-6' : 'left-1'}`}></div>
                  </button>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-600 uppercase tracking-tighter ml-1">{t.settings_voice}</label>
                  <div className="flex flex-wrap gap-1.5">
                    {voices.map(v => (
                      <button
                        key={v}
                        onClick={() => onUpdateModel({...modelSettings, voiceName: v})}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-bold border transition-all ${
                          modelSettings.voiceName === v 
                          ? 'bg-violet-500/20 border-violet-500 text-violet-300' 
                          : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Interface Configuration */}
            <section className="space-y-4">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_5px_rgba(16,185,129,1)]"></span>
                {t.settings_ui}
              </p>
              <div className="space-y-4 px-1">
                <div className="flex items-center gap-1.5">
                  {(['COMPACT', 'SPACIOUS'] as UIDensity[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => onUpdateModel({ ...modelSettings, uiDensity: d })}
                      className={`flex-1 py-2 text-[9px] font-black rounded-lg border transition-all ${
                        modelSettings.uiDensity === d 
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                          : 'bg-slate-900 border-slate-800 text-slate-600 hover:text-slate-400'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-black text-slate-500 uppercase">{t.settings_context}</label>
                    <span className="text-emerald-400 font-mono text-[10px] bg-emerald-500/10 px-1.5 rounded">{modelSettings.historyDepth} msgs</span>
                  </div>
                  <input 
                    type="range" min="1" max="50" step="1" 
                    value={modelSettings.historyDepth}
                    onChange={(e) => onUpdateModel({...modelSettings, historyDepth: parseInt(e.target.value)})}
                    className="w-full accent-emerald-500 bg-slate-900 h-1 rounded-full appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </section>

            {/* Neural Uplinks (API Keys) */}
            <section className="space-y-4">
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full shadow-[0_0_5px_rgba(249,115,22,1)]"></span>
                {t.settings_uplinks}
              </p>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                      Gemini (Google)
                    </label>
                    <button onClick={handleGeminiSync} className="text-[8px] font-black uppercase px-2 py-0.5 rounded-sm bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30 transition-all">{t.sync_dialog}</button>
                  </div>
                  <input 
                    type="password"
                    placeholder="AIza..."
                    value={globalSettings.externalKeys.gemini || ''}
                    onChange={(e) => updateExternalKey('gemini', e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-indigo-200 outline-none focus:border-indigo-500/50 font-mono transition-all"
                  />
                </div>

                {providers.map((p) => (
                  <div key={p.id} className="space-y-1.5">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${p.color.replace('text', 'bg')}`}></span>
                        {p.label}
                      </label>
                      <span className={`text-[8px] font-black uppercase px-1.5 rounded-sm ${globalSettings.externalKeys[p.id] ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
                        {globalSettings.externalKeys[p.id] ? t.ready : t.offline}
                      </span>
                    </div>
                    <input 
                      type="password"
                      placeholder={p.placeholder}
                      value={globalSettings.externalKeys[p.id] || ''}
                      onChange={(e) => updateExternalKey(p.id, e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 outline-none focus:border-indigo-500/50 font-mono transition-all"
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="pt-4 border-t border-slate-800">
              <button 
                onClick={clearSystemCache}
                className="w-full py-3 px-4 bg-red-500/5 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
              >
                {t.settings_purge}
              </button>
            </section>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-950/80 backdrop-blur-md">
        {user && (
          <div className="flex items-center gap-3 p-3 bg-slate-900/40 rounded-2xl border border-slate-800/50 group">
            <img src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nova'} className="w-9 h-9 rounded-xl border border-slate-700" alt="Avatar" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <p className="text-[9px] text-slate-500 font-medium uppercase tracking-widest">{t.identity_active}</p>
            </div>
            <button onClick={onLogout} className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
