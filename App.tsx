
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import InputArea from './components/InputArea';
import AuthGate from './components/AuthGate';
import { AgentConfig, Message, User } from './types';
import { AGENTS } from './constants';
import { geminiService } from './services/geminiService';

const STORAGE_KEY = 'nova_chat_history_v2';
const AGENT_KEY = 'nova_selected_agent';
const AUTH_KEY = 'nova_auth_session';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentAgent, setCurrentAgent] = useState<AgentConfig>(AGENTS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | undefined>();

  // Initialize Session
  useEffect(() => {
    const savedUser = localStorage.getItem(AUTH_KEY);
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const savedMessages = localStorage.getItem(STORAGE_KEY);
    const savedAgentId = localStorage.getItem(AGENT_KEY);
    
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

    if (savedAgentId) {
      const agent = AGENTS.find(a => a.id === savedAgentId);
      if (agent) setCurrentAgent(agent);
    }
  }, []);

  // Sync state with storage
  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      localStorage.setItem(AGENT_KEY, currentAgent.id);
    }
  }, [messages, currentAgent, user]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        }
      );
    }
  }, []);

  const handleAuthorized = (authorizedUser: User) => {
    setUser(authorizedUser);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(STORAGE_KEY);
    setMessages([]);
  };

  const handleSendMessage = async (content: string, image?: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      image,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const history = messages.slice(-10).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model' as 'user' | 'model',
        parts: [{ text: msg.content }]
      }));

      const response = await geminiService.chat(
        currentAgent, 
        content, 
        history, 
        image, 
        userLocation
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
    } catch (error) {
      console.error('Gemini API Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I encountered a neural synchronization error. Please check your connection.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = async (text: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const { audioBuffer, audioCtx } = await geminiService.generateSpeech(text);
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.onended = () => setIsSpeaking(false);
      source.start();
    } catch (error) {
      console.error("Speech error", error);
      setIsSpeaking(false);
    }
  };

  const clearSession = () => {
    if (window.confirm("Are you sure you want to delete your current session history?")) {
      setMessages([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  if (!user) {
    return <AuthGate onAuthorized={handleAuthorized} />;
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar 
        currentAgent={currentAgent} 
        onSelectAgent={setCurrentAgent} 
        isMobileOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
        user={user}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 flex flex-col min-w-0 bg-[#0c1221]">
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-4 md:px-8 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xl">{currentAgent.icon}</span>
              <h2 className="font-semibold">{currentAgent.name}</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={clearSession}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-all"
              title="Reset Session"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </header>

        <ChatWindow 
          messages={messages} 
          isLoading={isLoading} 
          onSpeak={handleSpeak} 
          isSpeaking={isSpeaking}
        />
        
        <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />
      </main>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
    </div>
  );
};

export default App;
