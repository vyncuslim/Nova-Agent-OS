
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
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages, isLoading, onSpeak, onStopAudio, onUpdateVolume, 
  isSpeaking, isPaused, onTogglePause, volume, language,
  onConfirmImage, onCancelImage
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
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth custom-scrollbar">
      {messages.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4 animate-in fade-in zoom-in-95 duration-700">
          <div className="w-20 h-20 bg-slate-800/50 rounded-[2rem] flex items-center justify-center text-4xl shadow-2xl ring-1 ring-white/5">🤖</div>
          <div className="space-y-1">
            <h3 className="text-xl font-black uppercase tracking-tighter">{t.link_established}</h3>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] max-w-xs mx-auto">{t.link_desc}</p>
          </div>
        </div>
      )}

      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
        >
          <div className={`
            max-w-[90%] md:max-w-[75%] rounded-3xl p-5 shadow-2xl relative group border
            ${msg.role === 'user' 
              ? 'bg-indigo-600 text-white rounded-tr-none border-indigo-500' 
              : 'bg-slate-900 text-slate-100 border-slate-800 rounded-tl-none'}
          `}>
            
            {msg.role === 'assistant' && (
               <div className="absolute -top-3 -left-3 w-8 h-8 bg-indigo-600 rounded-xl border-2 border-slate-900 flex items-center justify-center text-[10px] font-black shadow-lg">
                 AI
               </div>
            )}

            {msg.isConfirmingImage && (
              <div className="mb-4 bg-slate-950/80 p-5 rounded-2xl border border-indigo-500/40 shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400">🎨</div>
                  <div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{t.image_request_title}</p>
                    <p className="text-[11px] text-slate-400 font-medium">{t.image_request_desc}</p>
                  </div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 text-[11px] italic text-slate-300 leading-relaxed">
                  "{msg.content}"
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => onConfirmImage(msg.id)}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                  >
                    {t.confirm_gen}
                  </button>
                  <button 
                    onClick={() => onCancelImage(msg.id)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-black uppercase rounded-xl transition-all active:scale-95"
                  >
                    {t.cancel}
                  </button>
                </div>
              </div>
            )}

            {msg.image && !msg.isConfirmingImage && (
              <div className="mb-4 rounded-2xl overflow-hidden border border-white/5 shadow-inner">
                <img src={msg.image} alt="Neural Asset" className="w-full h-auto object-cover max-h-[500px]" />
              </div>
            )}

            {msg.video && (
              <div className="mb-4 rounded-2xl overflow-hidden border border-white/5 shadow-inner bg-black">
                <video src={msg.video} controls className="w-full h-auto max-h-[500px]" autoPlay loop muted />
              </div>
            )}
            
            <p className="whitespace-pre-wrap leading-relaxed text-sm tracking-wide">
              {msg.content}
            </p>

            {msg.role === 'assistant' && !msg.isConfirmingImage && (
              <div className="mt-4 space-y-3 border-t border-slate-800 pt-3">
                <div className="flex flex-wrap gap-2 items-center">
                  <button 
                    onClick={() => handleCopy(msg.content, msg.id)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-all text-[9px] uppercase font-black tracking-widest border border-transparent hover:border-slate-700"
                  >
                    {copiedId === msg.id ? `✨ ${t.copied}` : `📋 ${t.copy}`}
                  </button>
                  
                  {!isSpeaking ? (
                    <button 
                      onClick={() => onSpeak(msg.content)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-all text-[9px] uppercase font-black tracking-widest border border-transparent hover:border-slate-700"
                    >
                      🎙️ {t.listening}
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 bg-indigo-500/5 p-1.5 rounded-xl border border-indigo-500/20 animate-in fade-in zoom-in-95">
                      <button 
                        onClick={onTogglePause} 
                        className="w-6 h-6 flex items-center justify-center bg-indigo-600 rounded-lg text-[10px] hover:bg-indigo-500 transition-colors"
                        title={isPaused ? "Resume" : "Pause"}
                      >
                        {isPaused ? '▶️' : '⏸️'}
                      </button>
                      <button 
                        onClick={onStopAudio} 
                        className="text-red-500 hover:text-red-400 transition-colors text-[9px] font-black uppercase tracking-widest"
                      >
                        {t.stop}
                      </button>
                      <div className="h-4 w-[1px] bg-slate-800 mx-0.5"></div>
                      <div className="flex items-center gap-2 pr-2">
                        <span className="text-[8px] text-slate-500 font-black uppercase">{t.volume}</span>
                        <input 
                          type="range" min="0" max="1" step="0.1" 
                          value={volume} 
                          onChange={(e) => onUpdateVolume(parseFloat(e.target.value))}
                          className="w-16 h-1 accent-indigo-500 bg-slate-800 rounded-full appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {msg.groundingLinks && msg.groundingLinks.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1 h-1 bg-indigo-500 rounded-full"></span>
                  {t.grounding}
                </p>
                <div className="flex flex-wrap gap-2">
                  {msg.groundingLinks.map((link, idx) => (
                    <a 
                      key={idx}
                      href={link.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] bg-slate-950 hover:bg-slate-800 text-indigo-400 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2 transition-all hover:scale-105"
                    >
                      <span>🔗</span>
                      <span className="truncate max-w-[140px] font-bold">{link.title || 'Source Asset'}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className={`text-[9px] mt-3 font-black uppercase tracking-tighter opacity-30 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start animate-in fade-in slide-in-from-left-2">
          <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-3xl rounded-tl-none p-5 shadow-2xl flex flex-col gap-3 min-w-[200px]">
             <div className="flex items-center gap-4">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
                </div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Neural Synthesis</span>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
