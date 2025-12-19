
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

  return (
    <div className="p-4 bg-[#070b14] border-t border-slate-800">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        {image && (
          <div className="mb-3 relative inline-block">
            <img src={image} alt="Preview" className="h-20 w-20 object-cover rounded-xl border-2 border-indigo-500 shadow-xl" />
            <button 
              type="button"
              onClick={() => setImage(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold hover:bg-red-600 shadow-lg"
            >
              ✕
            </button>
          </div>
        )}
        
        <div className="flex items-end gap-2 bg-slate-900/50 backdrop-blur-xl rounded-2xl p-2 border border-slate-800 focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all">
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
            className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            title="Attach Neural Asset"
          >
            🖼️
          </button>
          
          <button 
            type="button"
            onClick={toggleRecording}
            className={`p-3 rounded-xl transition-all ${isRecording ? 'text-red-500 bg-red-500/10 ring-2 ring-red-500/50' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            title={isRecording ? "Stop Recording" : "Neural Voice Input"}
          >
            {isRecording ? <span className="flex items-center gap-1">🔴</span> : '🎙️'}
          </button>
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={t.relay_command}
            className="flex-1 bg-transparent border-none focus:ring-0 text-slate-200 resize-none py-2.5 px-2 max-h-48 text-sm placeholder:text-slate-600 font-medium"
            rows={1}
          />

          <button
            type="submit"
            disabled={(!input.trim() && !image) || isLoading}
            className={`
              w-10 h-10 rounded-xl flex items-center justify-center transition-all
              ${(!input.trim() && !image) || isLoading 
                ? 'bg-slate-800 text-slate-600 opacity-50' 
                : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 active:scale-90'}
            `}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            )}
          </button>
        </div>
        <p className="mt-2 text-[9px] text-center text-slate-600 font-black uppercase tracking-widest">
          {t.neural_gateway} • {isRecording ? t.capturing_audio : t.secure_link}
        </p>
      </form>
    </div>
  );
};

export default InputArea;
