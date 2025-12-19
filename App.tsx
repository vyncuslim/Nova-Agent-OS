
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import InputArea from './components/InputArea';
import AuthGate from './components/AuthGate';
import { AgentConfig, Message, User, GlobalSettings, ModelSettings } from './types';
import { AGENTS } from './constants';
import { geminiService } from './services/geminiService';

const STORAGE_KEY = 'nova_chat_v2_5';
const SETTINGS_KEY = 'nova_settings_v2_5';
const AGENT_KEY = 'nova_agent_v2_5';
const AUTH_KEY = 'nova_auth_v2_5';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentAgent, setCurrentAgent] = useState<AgentConfig>(AGENTS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | undefined>();

  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    memories: [],
    externalKeys: {}
  });

  const [modelSettings, setModelSettings] = useState<ModelSettings>({
    temperature: 1.0,
    thinkingBudget: 0,
    maxOutputTokens: 2048
  });

  useEffect(() => {
    const savedUser = localStorage.getItem(AUTH_KEY);
    const savedMessages = localStorage.getItem(STORAGE_KEY);
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    const savedAgentId = localStorage.getItem(AGENT_KEY);
    
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      if (parsedUser.keys) {
        setGlobalSettings(prev => ({ ...prev, externalKeys: parsedUser.keys }));
      }
    }
    
    if (savedMessages) setMessages(JSON.parse(savedMessages));
    if (savedSettings) {
      const s = JSON.parse(savedSettings);
      if (s.global) setGlobalSettings(s.global);
      if (s.model) setModelSettings(s.model);
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

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      localStorage.setItem(AGENT_KEY, currentAgent.id);
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ global: globalSettings, model: modelSettings }));
    }
  }, [messages, currentAgent, user, globalSettings, modelSettings]);

  const handleSendMessage = async (content: string, image?: string) => {
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content, image, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const history = messages.slice(-12).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model' as 'user' | 'model',
        parts: [{ text: msg.content }]
      }));

      // In a real implementation, you'd switch services based on agent.model
      // For now, we use Gemini as the primary orchestrator.
      const response = await geminiService.chat(
        currentAgent, content, history, modelSettings, globalSettings.memories, image, userLocation
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(), role: 'assistant', content: response.text,
        image: (response as any).image, groundingLinks: response.groundingLinks, timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(), role: 'assistant', content: "Neural synchronization failed. Please check your API keys and connectivity.", timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return <AuthGate onAuthorized={(u) => {
    setUser(u);
    setGlobalSettings(prev => ({ ...prev, externalKeys: u.keys }));
  }} />;

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 overflow-hidden font-sans">
      <Sidebar 
        currentAgent={currentAgent} onSelectAgent={setCurrentAgent} 
        isMobileOpen={isSidebarOpen} onCloseMobile={() => setIsSidebarOpen(false)}
        user={user} onLogout={() => { setUser(null); localStorage.clear(); }}
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
                <h2 className="font-black text-sm uppercase tracking-wider">{currentAgent.name}</h2>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{currentAgent.model}</span>
              </div>
            </div>
          </div>
          <button onClick={() => { if(confirm("Purge history?")) setMessages([]); }} className="p-2 text-slate-600 hover:text-red-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </header>

        <ChatWindow 
          messages={messages} isLoading={isLoading} 
          onSpeak={async (text) => {
            if (isSpeaking) return;
            setIsSpeaking(true);
            try {
              const { audioBuffer, audioCtx } = await geminiService.generateSpeech(text);
              const source = audioCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(audioCtx.destination);
              source.onended = () => setIsSpeaking(false);
              source.start();
            } catch { setIsSpeaking(false); }
          }} 
          isSpeaking={isSpeaking}
        />
        
        <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />
      </main>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
    </div>
  );
};

export default App;
