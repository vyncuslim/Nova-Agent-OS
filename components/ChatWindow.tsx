
import React, { useRef, useEffect, useState } from 'react';
import { Message } from '../types';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onSpeak: (text: string) => void;
  isSpeaking: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, onSpeak, isSpeaking }) => {
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
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
      {messages.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-3xl">🤖</div>
          <div>
            <h3 className="text-xl font-medium">Hello there!</h3>
            <p className="text-sm max-w-xs mx-auto mt-2">I am Nova. Select an agent or send a message to begin our session.</p>
          </div>
        </div>
      )}

      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div className={`
            max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-sm relative group
            ${msg.role === 'user' 
              ? 'bg-indigo-600 text-white rounded-tr-none' 
              : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-none'}
          `}>
            {msg.role === 'assistant' && (
               <div className="absolute -top-3 -left-3 w-8 h-8 bg-slate-700 rounded-full border border-slate-600 flex items-center justify-center text-xs shadow-md">
                 AI
               </div>
            )}
            
            {msg.image && (
              <div className="mb-3 rounded-lg overflow-hidden border border-white/10">
                <img src={msg.image} alt="Generated content" className="w-full h-auto object-cover max-h-96" />
              </div>
            )}
            
            <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">
              {msg.content}
            </p>

            {msg.role === 'assistant' && (
              <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleCopy(msg.content, msg.id)}
                  className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[10px] uppercase font-bold"
                  title="Copy to clipboard"
                >
                  {copiedId === msg.id ? '✅ Copied' : '📋 Copy'}
                </button>
                <button 
                  onClick={() => onSpeak(msg.content)}
                  disabled={isSpeaking}
                  className={`p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[10px] uppercase font-bold ${isSpeaking ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title="Listen to response"
                >
                  🔊 Speak
                </button>
              </div>
            )}

            {msg.groundingLinks && msg.groundingLinks.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-700 space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Sources & References</p>
                <div className="flex flex-wrap gap-2">
                  {msg.groundingLinks.map((link, idx) => (
                    <a 
                      key={idx}
                      href={link.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[11px] bg-slate-700/50 hover:bg-slate-700 text-indigo-300 px-2 py-1 rounded border border-slate-600 flex items-center gap-1 transition-colors"
                    >
                      <span>🔗</span>
                      <span className="truncate max-w-[150px]">{link.title || 'Link'}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className={`text-[10px] mt-2 opacity-40 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-slate-800 text-slate-100 border border-slate-700 rounded-2xl rounded-tl-none p-4 shadow-sm animate-pulse flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
            </div>
            <span className="text-xs text-slate-400 font-medium">Neural synthesis in progress...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
