
import React, { useRef, useEffect, useState } from 'react';
import { Message, Language } from '../types';
import { translations } from '../translations';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onSpeak: (text: string) => void;
  onStopAudio: () => void;
  onUpdateVolume: (v: number) => void;
  isSpeaking: boolean;
  isPaused: boolean;
  onTogglePause: () => void;
  volume: number;
  language: Language;
  onConfirmImage: (msgId: string) => void;
  onCancelImage: (msgId: string) => void;
  onSaveToMemory: (content: string) => void;
  memoryCount: number;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages, isLoading, onSpeak, onStopAudio, onUpdateVolume, 
  isSpeaking, isPaused, onTogglePause, volume, language,
  onConfirmImage, onCancelImage, onSaveToMemory, memoryCount
}) => {
  const t = translations[language];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-12 space-y-10 scroll-smooth custom-scrollbar bg-[#050811] relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full animate-float"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-600/10 blur-[100px] rounded-full animate-float" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* Memory Status Indicator */}
      <div className="sticky top-0 z-20 flex justify-center pb-8 pointer-events-none">
        <div className="glass-panel px-6 py-2 rounded-full border border-indigo-500/20 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className={`w-2 h-2 rounded-full ${memoryCount > 0 ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-slate-600'} animate-pulse`}></div>
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
            {memoryCount > 0 ? `${t.memory_active} (${memoryCount} ${t.imprints})` : "Neural Memory Bank Offline"}
          </span>
        </div>
      </div>

      {messages.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in-95 duration-1000 relative z-10">
          <div className="w-32 h-32 bg-slate-900/60 rounded-[3rem] flex items-center justify-center text-6xl shadow-2xl ring-1 ring-white/10 glass-card relative group">
             <div className="absolute inset-0 bg-indigo-500/20 rounded-[3rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
             <span className="relative z-10 group-hover:scale-110 transition-transform duration-500">🌌</span>
          </div>
          <div className="space-y-3">
            <h3 className="text-3xl font-black uppercase tracking-tighter text-white italic">{t.link_established}</h3>
            <div className="flex items-center justify-center gap-4">
               <div className="h-[1px] w-8 bg-indigo-500/30"></div>
               <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.5em]">{t.link_desc}</p>
               <div className="h-[1px] w-8 bg-indigo-500/30"></div>
            </div>
          </div>
        </div>
      )}

      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-6 duration-700 relative z-10`}
        >
          <div className={`
            max-w-[85%] md:max-w-[70%] rounded-[2rem] p-7 shadow-2xl relative group border
            ${msg.role === 'user' 
              ? 'bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-tr-none border-indigo-400/30' 
              : 'bg-slate-900/80 backdrop-blur-xl text-slate-100 border-white/5 rounded-tl-none'}
          `}>
            
            {msg.role === 'assistant' && (
               <div className="absolute -top-3 -left-3 w-10 h-10 bg-indigo-600 rounded-2xl border-4 border-slate-950 flex items-center justify-center text-sm font-black shadow-2xl text-white italic">
                 N
               </div>
            )}

            {msg.isConfirmingImage && (
              <div className="mb-6 bg-black/40 p-6 rounded-[1.5rem] border border-indigo-500/30 shadow-2xl space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-2xl shadow-inner">🎨</div>
                  <div className="flex-1">
                    <p className="text-[12px] font-black text-indigo-400 uppercase tracking-widest mb-1">{t.image_request_title}</p>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">{t.image_request_desc}</p>
                  </div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-[12px] italic text-slate-300 leading-relaxed font-mono">
                  "{msg.content}"
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => onConfirmImage(msg.id)}
                    className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                  >
                    {t.confirm_gen}
                  </button>
                  <button 
                    onClick={() => onCancelImage(msg.id)}
                    className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-slate-400 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all border border-white/5 active:scale-95"
                  >
                    {t.cancel}
                  </button>
                </div>
              </div>
            )}

            {msg.image && !msg.isConfirmingImage && (
              <div className="mb-6 rounded-[1.5rem] overflow-hidden border border-white/10 shadow-2xl ring-1 ring-white/5">
                <img src={msg.image} alt="Neural Asset" className="w-full h-auto object-cover max-h-[600px] hover:scale-105 transition-transform duration-1000" />
              </div>
            )}

            {msg.video && (
              <div className="mb-6 rounded-[1.5rem] overflow-hidden border border-white/10 shadow-2xl bg-black aspect-video flex items-center justify-center">
                <video src={msg.video} controls className="w-full h-full object-contain" autoPlay loop muted />
              </div>
            )}
            
            <p className="whitespace-pre-wrap leading-relaxed text-[15px] font-medium tracking-tight">
              {msg.content}
            </p>

            {msg.role === 'assistant' && !msg.isConfirmingImage && (
              <div className="mt-6 space-y-4 border-t border-white/5 pt-5">
                <div className="flex flex-wrap gap-2.5 items-center">
                  <button 
                    onClick={() => handleCopy(msg.content, msg.id)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all text-[10px] uppercase font-black tracking-widest border border-white/5 shadow-sm"
                  >
                    {copiedId === msg.id ? `✨ ${t.copied}` : `📋 ${t.copy}`}
                  </button>
                  
                  <button 
                    onClick={() => onSaveToMemory(msg.content)}
                    className="px-4 py-2 rounded-xl bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white transition-all text-[10px] uppercase font-black tracking-widest border border-violet-500/20"
                  >
                    🧠 {t.save_to_memory}
                  </button>

                  {!isSpeaking ? (
                    <button 
                      onClick={() => onSpeak(msg.content)}
                      className="px-4 py-2 rounded-xl bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white transition-all text-[10px] uppercase font-black tracking-widest border border-indigo-500/20"
                    >
                      🎙️ {t.listening}
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 bg-indigo-600/10 p-2 rounded-xl border border-indigo-500/30 animate-in zoom-in-95">
                      <button 
                        onClick={onTogglePause} 
                        className="w-8 h-8 flex items-center justify-center bg-indigo-600 rounded-lg text-xs hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                      >
                        {isPaused ? '▶️' : '⏸️'}
                      </button>
                      <button 
                        onClick={onStopAudio} 
                        className="text-red-500 hover:text-red-400 transition-colors text-[10px] font-black uppercase tracking-widest px-1"
                      >
                        {t.stop}
                      </button>
                      <div className="h-5 w-[1px] bg-white/10 mx-1"></div>
                      <div className="flex items-center gap-3 pr-2">
                        <span className="text-[9px] text-slate-500 font-black uppercase">{t.volume}</span>
                        <input 
                          type="range" min="0" max="1" step="0.1" 
                          value={volume} 
                          onChange={(e) => onUpdateVolume(parseFloat(e.target.value))}
                          className="w-20 h-1 accent-indigo-500 bg-slate-800 rounded-full appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {msg.groundingLinks && msg.groundingLinks.length > 0 && (
              <div className="mt-6 pt-5 border-t border-white/5 space-y-3">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full neural-pulse"></span>
                  {t.grounding}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {msg.groundingLinks.map((link, idx) => (
                    <a 
                      key={idx}
                      href={link.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[11px] bg-black/40 hover:bg-indigo-600/10 text-slate-400 hover:text-indigo-400 px-4 py-3 rounded-xl border border-white/5 hover:border-indigo-500/30 flex items-center gap-3 transition-all hover:-translate-y-1 shadow-lg"
                    >
                      <span className="text-base opacity-70">🔗</span>
                      <span className="truncate font-bold tracking-tight">{link.title || 'EXTERNAL LINK'}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className={`text-[10px] mt-4 font-black uppercase tracking-widest opacity-30 font-mono ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start animate-in fade-in slide-in-from-left-6 duration-700 relative z-10">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-white/5 rounded-[2rem] rounded-tl-none p-7 shadow-2xl flex flex-col gap-5 min-w-[260px]">
             <div className="flex items-center gap-5">
                <div className="w-10 h-10 flex items-center justify-center relative">
                   <div className="dot-typing"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-indigo-400 font-black uppercase tracking-[0.3em]">Neural Synthesis</span>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Processing Layer 04...</span>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
