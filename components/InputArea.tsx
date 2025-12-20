
import React, { useState, useRef, useEffect } from 'react';
import { Language } from '../types';
import { translations } from '../translations';

interface InputAreaProps {
  onSendMessage: (content: string, image?: string) => void;
  isLoading: boolean;
  language: Language;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, isLoading, language }) => {
  const t = translations[language];
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = language === 'ZH' ? 'zh-CN' : 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };

      recognitionRef.current.onerror = () => setIsRecording(false);
      recognitionRef.current.onend = () => setIsRecording(false);
    }
  }, [language]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setIsRecording(true);
      recognitionRef.current?.start();
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((input.trim() || image) && !isLoading) {
      onSendMessage(input, image || undefined);
      setInput('');
      setImage(null);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  return (
    <div className="p-6 md:p-8 bg-[#050811] relative border-t border-white/5">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
      
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative z-10">
        {image && (
          <div className="mb-4 animate-in fade-in zoom-in-95 duration-500 inline-block">
            <div className="relative group p-1.5 bg-indigo-600/20 rounded-[1.5rem] border border-indigo-500/30">
              <img src={image} alt="Preview" className="h-28 w-28 object-cover rounded-[1.2rem] shadow-2xl" />
              <button 
                type="button"
                onClick={() => setImage(null)}
                className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold hover:bg-red-500 shadow-2xl border-4 border-slate-900 transition-all hover:scale-110"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        
        <div className="relative glass-panel rounded-[2rem] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all focus-within:ring-2 focus-within:ring-indigo-500/30 group">
          <div className="flex items-end gap-1.5">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-4 text-slate-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all relative overflow-hidden group/btn"
              title="Attach Neural Asset"
            >
              <span className="relative z-10 text-xl">🖼️</span>
              <div className="absolute inset-0 bg-indigo-600/0 group-hover/btn:bg-indigo-600/10 transition-all"></div>
            </button>
            
            <button 
              type="button"
              onClick={toggleRecording}
              className={`p-4 rounded-2xl transition-all relative overflow-hidden group/btn ${isRecording ? 'text-red-500 bg-red-500/10 ring-2 ring-red-500/50 neural-pulse' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
              title={isRecording ? "Stop Recording" : "Neural Voice Input"}
            >
              <span className="relative z-10 text-xl">{isRecording ? '🔴' : '🎙️'}</span>
              {!isRecording && <div className="absolute inset-0 bg-red-600/0 group-hover/btn:bg-red-600/10 transition-all"></div>}
            </button>
            
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={t.relay_command}
              className="flex-1 bg-transparent border-none focus:ring-0 text-slate-100 resize-none py-4 px-3 max-h-48 text-[15px] placeholder:text-slate-600 font-medium tracking-tight"
              rows={1}
            />

            <button
              type="submit"
              disabled={(!input.trim() && !image) || isLoading}
              className={`
                w-14 h-14 rounded-2xl flex items-center justify-center transition-all relative overflow-hidden
                ${(!input.trim() && !image) || isLoading 
                  ? 'bg-slate-800 text-slate-600 opacity-30' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-2xl shadow-indigo-600/30 active:scale-90 hover:rotate-3'}
              `}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="relative z-10"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              )}
            </button>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between px-6">
           <div className="flex items-center gap-3">
             <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500'}`}></div>
             <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] font-mono">
               {isLoading ? 'UPLINK ACTIVE' : t.secure_link}
             </p>
           </div>
           <p className="text-[10px] text-indigo-500/50 font-black uppercase tracking-[0.3em] font-mono">
             PLATINUM OS v3.5
           </p>
        </div>
      </form>
    </div>
  );
};

export default InputArea;
