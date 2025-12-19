
import React, { useRef, useEffect, useState } from 'react';
import { Message, Language } from '../types';
import { translations } from '../translations';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onSpeak: (text: string) => void;
  isSpeaking: boolean;
  language: Language;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, onSpeak, isSpeaking, language }) => {
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
              ? 'bg-indigo-600 text-white rounded-tr-none border-indigo-500 shadow-indigo-600/10' 
              : 'bg-slate-900 text-slate-100 border-slate-800 rounded-tl-none shadow-black/40'}
          `}>
            {msg.role === 'assistant' && (
               <div className="absolute -top-3 -left-3 w-8 h-8 bg-indigo-600 rounded-xl border-2 border-slate-900 flex items-center justify-center text-[10px] font-black shadow-lg">
                 AI
               </div>
            )}
            
            {msg.image && (
              <div className="mb-4 rounded-2xl overflow-hidden border border-white/5 shadow-inner">
                <img src={msg.image} alt="Neural Asset" className="w-full h-auto object-cover max-h-[500px]" />
              </div>
            )}
            
            <p className="whitespace-pre-wrap leading-relaxed text-sm tracking-wide">
              {msg.content}
            </p>

            {msg.role === 'assistant' && (
              <div className="mt-4 flex gap-2 border-t border-slate-800 pt-3">
                <button 
                  onClick={() => handleCopy(msg.content, msg.id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-all flex items-center gap-1.5 text-[9px] uppercase font-black tracking-widest border border-transparent hover:border-slate-700"
                >
                  {copiedId === msg.id ? `✨ ${t.copied}` : `📋 ${t.copy}`}
                </button>
                <button 
                  onClick={() => onSpeak(msg.content)}
                  disabled={isSpeaking}
                  className={`px-3 py-1.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-all flex items-center gap-1.5 text-[9px] uppercase font-black tracking-widest border border-transparent hover:border-slate-700 ${isSpeaking ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSpeaking ? `🔊 ${t.speaking}` : `🎙️ ${t.listening}`}
                </button>
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
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start animate-in fade-in slide-in-from-left-2">
          <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-3xl rounded-tl-none p-5 shadow-2xl flex items-center gap-4">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce shadow-[0_0_8px_rgba(99,102,241,0.5)]" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce shadow-[0_0_8px_rgba(99,102,241,0.5)]" style={{ animationDelay: '200ms' }}></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce shadow-[0_0_8px_rgba(99,102,241,0.5)]" style={{ animationDelay: '400ms' }}></div>
            </div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Neural Synthesis</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
