
import React, { useState, useEffect, useRef } from 'react';
import { LiveServerMessage } from "@google/genai";
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import InputArea from './components/InputArea';
import AuthGate from './components/AuthGate';
import { AgentConfig, Message, User, GlobalSettings, ModelSettings, AgentRole } from './types';
import { AGENTS } from './constants';
import { geminiService } from './services/geminiService';
import { translations } from './translations';

const STORAGE_KEY = 'nova_chat_v3_5';
const SETTINGS_KEY = 'nova_settings_v3_5';
const AGENT_KEY = 'nova_agent_v3_5';
const AUTH_KEY = 'nova_auth_v3_5';

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentAgent, setCurrentAgent] = useState<AgentConfig>(AGENTS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | undefined>();

  // Live API State
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState('');
  const [liveOutputTranscription, setLiveOutputTranscription] = useState('');
  const liveSessionRef = useRef<any>(null);

  // Audio Player State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const currentBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  
  // Audio Playback Queue for Live API
  const liveOutputAudioContextRef = useRef<AudioContext | null>(null);
  const liveNextStartTimeRef = useRef<number>(0);
  const liveSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) try { return JSON.parse(saved).global; } catch (e) {}
    return { memories: [], externalKeys: {} };
  });

  const [modelSettings, setModelSettings] = useState<ModelSettings>(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) try { 
      const parsed = JSON.parse(saved).model;
      return { 
        saveHistory: true, 
        ...parsed 
      }; 
    } catch (e) {}
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
      coreProvider: 'GEMINI',
      customModelOverrides: {},
      imageSize: '1K',
      useSearch: false,
      useMaps: false,
      saveHistory: true
    };
  });

  const t = translations[modelSettings.language];

  useEffect(() => {
    const savedUser = localStorage.getItem(AUTH_KEY);
    const savedAgentId = localStorage.getItem(AGENT_KEY);
    if (savedUser) try { setUser(JSON.parse(savedUser)); } catch (e) {}
    
    // Load messages ONLY if saveHistory is enabled
    if (modelSettings.saveHistory) {
      const savedMessages = localStorage.getItem(STORAGE_KEY);
      if (savedMessages) try { setMessages(JSON.parse(savedMessages)); } catch (e) {}
    }

    if (savedAgentId) {
      const agent = AGENTS.find(a => a.id === savedAgentId);
      if (agent) setCurrentAgent(agent);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => console.warn("Location access denied")
      );
    }

    console.log("%c NOVA AGENT OS v3.5 PLATINUM ACTIVE ", "background: #4f46e5; color: #fff; font-weight: bold; padding: 4px; border-radius: 4px;");
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      localStorage.setItem(AGENT_KEY, currentAgent.id);
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ global: globalSettings, model: modelSettings }));
      
      if (modelSettings.saveHistory) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [messages, currentAgent, user, globalSettings, modelSettings]);

  const getCurrentApiKey = () => {
    if (modelSettings.coreProvider === 'GEMINI' && process.env.API_KEY) {
      return process.env.API_KEY;
    }
    const provider = modelSettings.coreProvider;
    const key = globalSettings.externalKeys[provider.toLowerCase() as keyof typeof globalSettings.externalKeys];
    return key;
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.onended = null;
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
    setIsSpeaking(false);
    setIsPaused(false);
    pauseTimeRef.current = 0;
  };

  const togglePause = () => {
    if (!audioCtxRef.current || !currentBufferRef.current) return;
    if (isPaused) {
      const offset = pauseTimeRef.current;
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = currentBufferRef.current;
      source.connect(gainNodeRef.current!);
      source.onended = () => { if (!isPaused) setIsSpeaking(false); };
      source.start(0, offset);
      sourceNodeRef.current = source;
      startTimeRef.current = audioCtxRef.current.currentTime - offset;
      setIsPaused(false);
    } else {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.onended = null;
        sourceNodeRef.current.stop();
        pauseTimeRef.current = audioCtxRef.current.currentTime - startTimeRef.current;
        setIsPaused(true);
      }
    }
  };

  const speakText = async (text: string) => {
    stopAudio();
    const apiKey = getCurrentApiKey();
    if (!apiKey) return;
    try {
      const { audioBuffer, audioCtx } = await geminiService.generateSpeech(text, apiKey, modelSettings.voiceName);
      audioCtxRef.current = audioCtx;
      currentBufferRef.current = audioBuffer;
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = volume;
      gainNode.connect(audioCtx.destination);
      gainNodeRef.current = gainNode;
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(gainNode);
      source.onended = () => { if (!isPaused) setIsSpeaking(false); };
      startTimeRef.current = audioCtx.currentTime;
      source.start(0);
      sourceNodeRef.current = source;
      setIsSpeaking(true);
    } catch (e) {
      setIsSpeaking(false);
    }
  };

  const handleSendMessage = async (content: string, image?: string, forceConfirm = false) => {
    const apiKey = getCurrentApiKey();
    if (!apiKey) {
      alert(t.settings_uplinks);
      return;
    }

    const overriddenModel = modelSettings.customModelOverrides[currentAgent.id] || currentAgent.model;
    
    if (overriddenModel === 'gemini-3-pro-image-preview' && !forceConfirm && currentAgent.id === AgentRole.CREATIVE) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content, isConfirmingImage: true, timestamp: Date.now() }]);
      return;
    }

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content, image, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const history = messages.filter(m => !m.isConfirmingImage && m.role !== 'system').slice(-modelSettings.historyDepth).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model' as 'user' | 'model',
        parts: [{ text: msg.content }]
      }));

      const activeAgent = { ...currentAgent, model: overriddenModel };
      const response = await geminiService.chat(activeAgent, content, history, modelSettings, globalSettings.memories, apiKey, image, userLocation);

      setMessages(prev => [...prev, {
        id: Date.now().toString(), role: 'assistant', content: response.text, image: (response as any).image, video: (response as any).video, groundingLinks: response.groundingLinks, timestamp: Date.now()
      }]);

      if (modelSettings.autoRead && response.text) speakText(response.text);
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "Neural link interrupted. Please check your API key or connection.", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startLiveMode = async () => {
    const apiKey = getCurrentApiKey();
    if (!apiKey) {
      alert(t.settings_uplinks);
      return;
    }
    
    setIsLiveMode(true);
    setLiveTranscription('');
    setLiveOutputTranscription('');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      liveOutputAudioContextRef.current = outputCtx;

      const memoryContext = globalSettings.memories.length > 0 ? `\n[MEMORIES]:\n${globalSettings.memories.join('\n')}` : "";
      const systemInstruction = `${currentAgent.systemInstruction}${memoryContext}`;

      const sessionPromise = geminiService.connectLive(apiKey, systemInstruction, {
        onopen: () => {
          const source = inputCtx.createMediaStreamSource(stream);
          const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
          scriptProcessor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmBlob = geminiService.createAudioBlob(inputData);
            sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
          };
          source.connect(scriptProcessor);
          scriptProcessor.connect(inputCtx.destination);
        },
        onmessage: async (message: LiveServerMessage) => {
          if (message.serverContent?.inputTranscription) {
            setLiveTranscription(prev => prev + message.serverContent!.inputTranscription!.text);
          }
          if (message.serverContent?.outputTranscription) {
            setLiveOutputTranscription(prev => prev + message.serverContent!.outputTranscription!.text);
          }
          if (message.serverContent?.turnComplete) {
            setMessages(prev => [
              ...prev, 
              { id: Date.now().toString(), role: 'user', content: "Voice Interaction Complete", timestamp: Date.now() },
              { id: (Date.now()+1).toString(), role: 'assistant', content: "Live Dialogue Finalized", timestamp: Date.now() }
            ]);
          }

          const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (base64Audio) {
            liveNextStartTimeRef.current = Math.max(liveNextStartTimeRef.current, outputCtx.currentTime);
            const bytes = decodeBase64(base64Audio);
            const dataInt16 = new Int16Array(bytes.buffer);
            const frameCount = dataInt16.length;
            const buffer = outputCtx.createBuffer(1, frameCount, 24000);
            const channelData = buffer.getChannelData(0);
            for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i] / 32768.0;

            const source = outputCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(outputCtx.destination);
            source.onended = () => liveSourcesRef.current.delete(source);
            source.start(liveNextStartTimeRef.current);
            liveNextStartTimeRef.current += buffer.duration;
            liveSourcesRef.current.add(source);
          }

          if (message.serverContent?.interrupted) {
            liveSourcesRef.current.forEach(s => s.stop());
            liveSourcesRef.current.clear();
            liveNextStartTimeRef.current = 0;
          }
        },
        onerror: (e) => { 
          console.error("Live Error", e); 
          stopLiveMode(); 
        },
        onclose: () => stopLiveMode()
      }, modelSettings.voiceName);

      liveSessionRef.current = await sessionPromise;
    } catch (e: any) {
      console.error(e);
      stopLiveMode();
    }
  };

  const stopLiveMode = () => {
    if (liveSessionRef.current) {
      liveSessionRef.current.close();
      liveSessionRef.current = null;
    }
    liveSourcesRef.current.forEach(s => s.stop());
    liveSourcesRef.current.clear();
    setIsLiveMode(false);
  };

  const handleClearHistory = () => {
    if (confirm(t.purge_history)) {
      setMessages([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleAuthorized = (u: User) => {
    setUser(u);
    setGlobalSettings(prev => ({
      ...prev,
      externalKeys: u.keys
    }));
  };

  if (!user) {
    return <AuthGate onAuthorized={handleAuthorized} />;
  }

  return (
    <div className={`flex h-screen bg-[#020617] text-slate-100 overflow-hidden font-sans ${modelSettings.uiDensity === 'COMPACT' ? 'text-sm' : 'text-base'}`}>
      <Sidebar 
        currentAgent={currentAgent} onSelectAgent={setCurrentAgent} 
        isMobileOpen={isSidebarOpen} onCloseMobile={() => setIsSidebarOpen(false)}
        user={user} onLogout={() => { setUser(null); localStorage.clear(); window.location.reload(); }}
        globalSettings={globalSettings} modelSettings={modelSettings}
        onUpdateGlobal={setGlobalSettings} onUpdateModel={setModelSettings}
        onClearHistory={handleClearHistory}
      />
      
      <main className="flex-1 flex flex-col min-w-0 bg-[#070b14] relative">
        <header className="h-16 glass-panel border-b border-white/5 flex items-center justify-between px-6 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{currentAgent.icon}</span>
              <div className="flex flex-col -space-y-1">
                <h2 className="font-black text-xs uppercase tracking-wider">{currentAgent.name}</h2>
                <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest font-mono">
                  {modelSettings.customModelOverrides[currentAgent.id] || currentAgent.model}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
               onClick={isLiveMode ? stopLiveMode : startLiveMode}
               className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                 isLiveMode ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400 hover:bg-indigo-600 hover:text-white'
               }`}
             >
               <span className={isLiveMode ? 'animate-pulse' : ''}>📡</span>
               {isLiveMode ? t.stop_live : t.start_live}
             </button>
          </div>
        </header>

        {isLiveMode && (
          <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-3xl flex flex-col items-center justify-center p-8 space-y-8 animate-in fade-in duration-500">
            <div className="w-32 h-32 relative">
               <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"></div>
               <div className="absolute inset-4 bg-indigo-500/40 rounded-full animate-pulse"></div>
               <div className="absolute inset-8 bg-indigo-500 rounded-full flex items-center justify-center text-3xl shadow-2xl shadow-indigo-500/40">🎙️</div>
            </div>
            <div className="text-center space-y-2 max-w-md">
              <h3 className="text-2xl font-black uppercase tracking-tighter">{t.live_mode}</h3>
              <p className="text-slate-400 text-sm">{t.live_desc}</p>
            </div>
            <div className="w-full max-w-2xl bg-white/5 border border-white/5 rounded-[2.5rem] p-8 min-h-[250px] space-y-6 overflow-y-auto custom-scrollbar shadow-2xl">
               {liveTranscription && (
                 <div className="space-y-1">
                   <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">User</p>
                   <p className="text-slate-300 italic">"{liveTranscription}"</p>
                 </div>
               )}
               {liveOutputTranscription && (
                 <div className="space-y-1 border-t border-white/5 pt-4">
                   <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Assistant</p>
                   <p className="text-slate-200">{liveOutputTranscription}</p>
                 </div>
               )}
            </div>
            <button 
               onClick={stopLiveMode}
               className="px-12 py-4 bg-red-600 hover:bg-red-500 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-2xl shadow-red-600/20 transition-all active:scale-95"
            >
              {t.stop_live}
            </button>
          </div>
        )}

        <ChatWindow 
          messages={messages} isLoading={isLoading} 
          onSpeak={speakText} onStopAudio={stopAudio} onUpdateVolume={(v) => { setVolume(v); if(gainNodeRef.current) gainNodeRef.current.gain.value = v; }}
          isSpeaking={isSpeaking} isPaused={isPaused} onTogglePause={togglePause} volume={volume}
          language={modelSettings.language}
          onConfirmImage={(id) => {
            const msg = messages.find(m => m.id === id);
            if (msg) {
              setMessages(prev => prev.filter(m => m.id !== id));
              handleSendMessage(msg.content, undefined, true);
            }
          }} 
          onCancelImage={(id) => setMessages(prev => prev.filter(m => m.id !== id))}
        />
        
        <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} language={modelSettings.language} />
      </main>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
    </div>
  );
};

export default App;
