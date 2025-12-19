
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import InputArea from './components/InputArea';
import AuthGate from './components/AuthGate';
import { AgentConfig, Message, User, GlobalSettings, ModelSettings } from './types';
import { AGENTS } from './constants';
import { geminiService } from './services/geminiService';
import { translations } from './translations';

const STORAGE_KEY = 'nova_chat_v2_6_strict';
const SETTINGS_KEY = 'nova_settings_v2_6_strict';
const AGENT_KEY = 'nova_agent_v2_6_strict';
const AUTH_KEY = 'nova_auth_v2_6_strict';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentAgent, setCurrentAgent] = useState<AgentConfig>(AGENTS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | undefined>();

  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try { return JSON.parse(saved).global; } catch (e) { /* fallback */ }
    }
    return { memories: [], externalKeys: {} };
  });

  const [modelSettings, setModelSettings] = useState<ModelSettings>(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try { return JSON.parse(saved).model; } catch (e) { /* fallback */ }
    }
    return { 
      temperature: 1.0, 
      thinkingBudget: 0, 
      maxOutputTokens: 2048, 
      inferenceMode: 'STANDARD',
      voiceName: 'Kore',
      autoRead: false,
      historyDepth: 12,
      uiDensity: 'SPACIOUS',
      language: 'EN',
      coreProvider: 'GEMINI'
    };
  });

  const t = translations[modelSettings.language];

  // INITIAL LOAD
  useEffect(() => {
    const savedUser = localStorage.getItem(AUTH_KEY);
    const savedMessages = localStorage.getItem(STORAGE_KEY);
    const savedAgentId = localStorage.getItem(AGENT_KEY);
    
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch (e) {}
    }
    
    if (savedMessages) {
      try { setMessages(JSON.parse(savedMessages)); } catch (e) {}
    }

    if (savedAgentId) {
      const agent = AGENTS.find(a => a.id === savedAgentId);
      if (agent) setCurrentAgent(agent);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setUserLocation({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
        () => console.debug("Location denied")
      );
    }
  }, []);

  // SYNC TO LOCAL STORAGE
  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      localStorage.setItem(AGENT_KEY, currentAgent.id);
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ global: globalSettings, model: modelSettings }));
    }
  }, [messages, currentAgent, user, globalSettings, modelSettings]);

  const getCurrentApiKey = () => {
    const provider = modelSettings.coreProvider;
    if (provider === 'GEMINI') return globalSettings.externalKeys.gemini;
    if (provider === 'CLAUDE') return globalSettings.externalKeys.claude;
    if (provider === 'GPT') return globalSettings.externalKeys.openai;
    if (provider === 'DEEPSEEK') return globalSettings.externalKeys.deepseek;
    if (provider === 'GROK') return globalSettings.externalKeys.grok;
    return undefined;
  };

  const speakText = async (text: string) => {
    if (isSpeaking) return;
    const apiKey = getCurrentApiKey();
    if (!apiKey) return;

    setIsSpeaking(true);
    try {
      const { audioBuffer, audioCtx } = await geminiService.generateSpeech(text, apiKey, modelSettings.voiceName);
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.onended = () => setIsSpeaking(false);
      source.start();
    } catch { 
      setIsSpeaking(false); 
    }
  };

  const handleSendMessage = async (content: string, image?: string) => {
    const apiKey = getCurrentApiKey();
    
    if (!apiKey || apiKey.trim() === "") {
      const errorMsg = modelSettings.language === 'ZH' 
        ? "错误：未检测到上行链路密钥。请前往设置配置 API 密钥。" 
        : "ERROR: No uplink key detected. Please configure API key in settings.";
      
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content, image, timestamp: Date.now() }]);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: errorMsg, timestamp: Date.now() }]);
      return;
    }

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content, image, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const history = messages.slice(-modelSettings.historyDepth).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model' as 'user' | 'model',
        parts: [{ text: msg.content }]
      }));

      const activeAgent = { ...currentAgent };
      if (modelSettings.inferenceMode === 'TURBO' && !activeAgent.model.includes('image')) {
        activeAgent.model = 'gemini-3-flash-preview';
      } else if (modelSettings.inferenceMode === 'PRECISION' && !activeAgent.model.includes('image')) {
        activeAgent.model = 'gemini-3-pro-preview';
      }

      const response = await geminiService.chat(
        activeAgent, content, history, modelSettings, globalSettings.memories, apiKey, image, userLocation
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: response.text,
        image: (response as any).image, 
        groundingLinks: response.groundingLinks, 
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMessage]);

      if (modelSettings.autoRead && response.text) {
        speakText(response.text);
      }
    } catch (error: any) {
      console.error("Neural Link Error:", error);
      let errorDetail = modelSettings.language === 'ZH' 
        ? "神经同步失败。密钥可能无效或已过期。" 
        : "Neural synchronization failed. Key might be invalid or expired.";
      
      if (error.message?.includes("API_KEY_INVALID") || error.status === 401 || error.status === 403) {
        errorDetail = modelSettings.language === 'ZH' 
          ? "验证拒绝：API 密钥无效。请检查设置中的输入。" 
          : "AUTHENTICATION REFUSED: Invalid API key. Check your settings.";
      }

      setMessages(prev => [...prev, {
        id: Date.now().toString(), role: 'assistant', content: errorDetail, timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return <AuthGate onAuthorized={(u) => setUser(u)} />;

  return (
    <div className={`flex h-screen bg-[#020617] text-slate-100 overflow-hidden font-sans ${modelSettings.uiDensity === 'COMPACT' ? 'text-sm' : 'text-base'}`}>
      <Sidebar 
        currentAgent={currentAgent} onSelectAgent={setCurrentAgent} 
        isMobileOpen={isSidebarOpen} onCloseMobile={() => setIsSidebarOpen(false)}
        user={user} onLogout={() => { setUser(null); localStorage.clear(); window.location.reload(); }}
        globalSettings={globalSettings} modelSettings={modelSettings}
        onUpdateGlobal={setGlobalSettings} onUpdateModel={setModelSettings}
      />
      
      <main className="flex-1 flex flex-col min-w-0 bg-[#070b14]">
        <header className="h-16 border-b border-slate-800 bg-slate-900/40 backdrop-blur-xl flex items-center justify-between px-6 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{currentAgent.icon}</span>
              <div className="flex flex-col -space-y-1">
                <h2 className="font-black text-xs uppercase tracking-wider">{currentAgent.name}</h2>
                <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest">
                  {modelSettings.coreProvider} • {modelSettings.inferenceMode}
                </span>
              </div>
            </div>
          </div>
          <button onClick={() => { if(confirm(t.purge_history)) setMessages([]); }} className="p-2 text-slate-600 hover:text-red-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
          </button>
        </header>

        <ChatWindow 
          messages={messages} isLoading={isLoading} 
          onSpeak={speakText} 
          isSpeaking={isSpeaking}
          language={modelSettings.language}
        />
        
        <InputArea 
          onSendMessage={handleSendMessage} 
          isLoading={isLoading} 
          language={modelSettings.language}
        />
      </main>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
    </div>
  );
};

export default App;
