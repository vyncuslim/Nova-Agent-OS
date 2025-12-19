
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
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentAgent, onSelectAgent, isMobileOpen, onCloseMobile, user, onLogout,
  globalSettings, modelSettings, onUpdateGlobal, onUpdateModel
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
      fixed lg:static inset-y-0 left-0 z-40 w-80 bg-slate-950 border-r border-slate-800 flex flex-col transition-transform duration-300
      ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="p-6 border-b border-slate-800 bg-slate-900/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">
            🚀
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg tracking-tight text-white">{t.app_name}</h1>
            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest truncate">{t.neural_gateway}</p>
          </div>
          <button 
            onClick={() => setShowManifest(true)}
            className="p-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all border border-slate-700/50"
            title={t.manifest}
          >
            📋
          </button>
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
                  <p className="text-[10px] opacity-60 truncate uppercase">
                    {modelSettings.customModelOverrides[agent.id] || agent.model}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'memory' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                <span className="text-lg">🧠</span> {t.memory_bank}
              </h3>
              <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                {t.memory_desc}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMemory}
                  onChange={(e) => setNewMemory(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addMemory()}
                  placeholder={t.neural_imprint}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                />
                <button onClick={addMemory} className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-500 transition-all active:scale-95">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="px-2 text-[9px] font-black text-slate-600 uppercase tracking-widest">{t.active_imprints}</p>
              {globalSettings.memories.map((m, i) => (
                <div key={i} className="group flex items-center gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/50 hover:border-slate-700 transition-all">
                  <span className="text-xs text-indigo-400">#</span>
                  <p className="flex-1 text-[11px] text-slate-300 font-medium leading-relaxed">{m}</p>
                  <button onClick={() => removeMemory(i)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 pb-4">
            <section className="space-y-4">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                {t.settings_language}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
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

            <section className="space-y-4">
              <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-violet-500 rounded-full"></span>
                {t.agent_model_override}
              </p>
              <div className="space-y-3">
                {AGENTS.map(a => (
                  <div key={a.id} className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-bold uppercase ml-1">{a.name}</label>
                    <select 
                      value={modelSettings.customModelOverrides[a.id] || a.model}
                      onChange={(e) => updateModelOverride(a.id, e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[10px] text-indigo-200 outline-none focus:border-indigo-500/50 transition-all"
                    >
                      {availableModels.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                {t.image_size}
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {imageSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => onUpdateModel({ ...modelSettings, imageSize: size })}
                    className={`py-2 text-[10px] font-black rounded-lg border transition-all ${
                      modelSettings.imageSize === size 
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' 
                        : 'bg-slate-900 border-slate-800 text-slate-600 hover:text-slate-400'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                {t.grounding_tools}
              </p>
              <div className="space-y-3 px-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">{t.use_search}</span>
                  <button 
                    onClick={() => onUpdateModel({ ...modelSettings, useSearch: !modelSettings.useSearch })}
                    className={`w-10 h-5 rounded-full transition-all relative ${modelSettings.useSearch ? 'bg-orange-600' : 'bg-slate-800'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${modelSettings.useSearch ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">{t.use_maps}</span>
                  <button 
                    onClick={() => onUpdateModel({ ...modelSettings, useMaps: !modelSettings.useMaps })}
                    className={`w-10 h-5 rounded-full transition-all relative ${modelSettings.useMaps ? 'bg-orange-600' : 'bg-slate-800'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${modelSettings.useMaps ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                {t.settings_audio}
              </p>
              <div className="space-y-4 px-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">{t.settings_auto_read}</span>
                  <button 
                    onClick={() => onUpdateModel({ ...modelSettings, autoRead: !modelSettings.autoRead })}
                    className={`w-10 h-5 rounded-full transition-all relative ${modelSettings.autoRead ? 'bg-indigo-600' : 'bg-slate-800'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${modelSettings.autoRead ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>
                <div className="space-y-2">
                  <span className="text-[9px] text-slate-500 font-bold uppercase">{t.settings_voice}</span>
                  <div className="grid grid-cols-2 gap-2">
                    {voices.map(v => (
                      <button
                        key={v}
                        onClick={() => onUpdateModel({ ...modelSettings, voiceName: v })}
                        className={`py-2 px-3 text-[10px] rounded-lg border transition-all font-bold ${
                          modelSettings.voiceName === v ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-600'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4 pt-4 border-t border-slate-800">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.settings_uplinks}</p>
              <div className="space-y-3">
                {coreProviders.map(p => (
                  <div key={p} className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-bold uppercase ml-1">{p}</label>
                    <input 
                      type="password"
                      placeholder="Neural Key Required"
                      value={globalSettings.externalKeys[p.toLowerCase() as keyof ExternalKeys] || ''}
                      onChange={(e) => updateExternalKey(p.toLowerCase(), e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[10px] text-indigo-200 outline-none focus:border-indigo-500/50"
                    />
                  </div>
                ))}
              </div>
            </section>

            <button 
              onClick={() => { if(confirm(t.purge_confirm)) { localStorage.clear(); window.location.reload(); } }}
              className="w-full py-4 text-[10px] font-black text-red-500/60 hover:text-red-500 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-2xl transition-all uppercase tracking-widest mt-8"
            >
              {t.settings_purge}
            </button>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-slate-800 bg-slate-900/20">
        <div className="flex items-center gap-3">
          <img src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nova'} alt="Profile" className="w-10 h-10 rounded-xl border border-white/10" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{user?.name || 'Authorized Guest'}</p>
            <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">{t.ready}</p>
          </div>
          <button onClick={onLogout} className="p-2 text-slate-500 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </div>

      {/* Feature Manifest Modal */}
      {showManifest && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-indigo-500/30 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500"></div>
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-black uppercase tracking-tighter text-white">{t.manifest}</h2>
              <button onClick={() => setShowManifest(false)} className="text-slate-500 hover:text-white text-xl">✕</button>
            </div>
            <ul className="space-y-4 text-xs font-medium text-slate-300">
              {[
                { icon: '🤖', title: 'Specialized Agents', desc: '6 unique personas for coding, research, creativity, and more.' },
                { icon: '🧬', title: 'Model Overrides', desc: 'Custom model mapping per agent via settings.' },
                { icon: '🎨', title: 'Visual Gatekeeper', desc: 'Confirmation protocol for all image generation tasks.' },
                { icon: '🎙️', title: 'Audio Nexus', desc: 'Full TTS control with Play/Pause/Stop and Volume gain.' },
                { icon: '📍', title: 'Grounding', desc: 'Integrated real-world search and map verification.' },
                { icon: '🧠', title: 'Neural Memory', desc: 'Persistent context injected into every neural link.' }
              ].map((f, i) => (
                <li key={i} className="flex gap-4 p-3 bg-slate-950/50 border border-white/5 rounded-2xl">
                  <span className="text-xl">{f.icon}</span>
                  <div>
                    <p className="font-bold text-indigo-400 uppercase tracking-widest text-[10px] mb-1">{f.title}</p>
                    <p className="opacity-70 leading-relaxed">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            <button 
              onClick={() => setShowManifest(false)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all"
            >
              Acknowledge Protocol
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
