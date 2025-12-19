
import React, { useState, useEffect, useRef } from 'react';
import { VALID_INVITE_CODE } from '../constants';
import { User, ExternalKeys } from '../types';

declare const google: any;
declare const window: any;

interface AuthGateProps {
  onAuthorized: (user: User) => void;
}

const AuthGate: React.FC<AuthGateProps> = ({ onAuthorized }) => {
  // 1: Handshake (Invite), 2: Vault (API Keys), 3: Identity (Google), 4: Finalize
  const [stage, setStage] = useState<1 | 2 | 3 | 4>(1);
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [googleUser, setGoogleUser] = useState<Partial<User> | null>(null);
  const [gsiStatus, setGsiStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);
  
  // External Keys State
  const [keys, setKeys] = useState<ExternalKeys>({
    openai: '',
    grok: '',
    deepseek: '',
    claude: ''
  });

  const decodeJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) { return null; }
  };

  useEffect(() => {
    if (stage === 3) {
      let checkInterval = setInterval(() => {
        if (typeof google !== 'undefined') {
          clearInterval(checkInterval);
          google.accounts.id.initialize({
            client_id: "746128116830-t5o8umbehgm1mstap05fuc0p6gj05nm8.apps.googleusercontent.com",
            callback: (response: any) => {
              const payload = decodeJwt(response.credential);
              if (payload) {
                setGoogleUser({ name: payload.name, email: payload.email, avatar: payload.picture });
                setStage(4);
              }
            },
            // CRITICAL: Set to false to fix FedCM feature-policy error in document
            use_fedcm_for_prompt: false,
            context: 'signin'
          });
          if (googleBtnContainerRef.current) {
            google.accounts.id.renderButton(googleBtnContainerRef.current, {
              type: 'standard', theme: 'filled_black', size: 'large', text: 'signin_with', shape: 'pill', width: 320
            });
            setGsiStatus('ready');
          }
          // Only prompt if we explicitly need it, but renderButton is safer
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }
  }, [stage]);

  const handleStage1 = () => {
    if (inviteCode.trim().toUpperCase() === VALID_INVITE_CODE) {
      setStage(2);
      setError('');
    } else {
      setError('INVALID HANDSHAKE TOKEN');
    }
  };

  const handleGeminiSync = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
    }
  };

  const handleFinalize = () => {
    onAuthorized({
      name: googleUser?.name || 'Authorized Guest',
      email: googleUser?.email,
      avatar: googleUser?.avatar,
      isGoogleUser: !!googleUser,
      keys: keys
    });
  };

  const updateKey = (field: keyof ExternalKeys, value: string) => {
    setKeys(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617] overflow-hidden text-slate-200">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full"></div>
      </div>

      <div className="relative w-full max-w-lg mx-4">
        <div className="bg-slate-900/80 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 shadow-2xl transition-all duration-500">
          
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 relative">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-700 rounded-2xl flex items-center justify-center text-3xl shadow-2xl shadow-indigo-500/20">
                {stage === 1 ? '✨' : stage === 2 ? '🛡️' : stage === 3 ? '🧬' : '🚀'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
            </div>

            <h1 className="text-2xl font-black tracking-tighter text-white mb-1">NOVA AGENT OS</h1>
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em] mb-8">
              Protocol Stage {stage}: {
                stage === 1 ? 'Neural Handshake' : 
                stage === 2 ? 'Neural Vault Initialization' : 
                stage === 3 ? 'Identity Verification' : 'Establishing Link'
              }
            </p>

            <div className="w-full space-y-6 min-h-[300px] flex flex-col justify-center">
              {stage === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block text-left px-1">Access Token</label>
                    <input
                      type="text" value={inviteCode}
                      onChange={(e) => { setInviteCode(e.target.value.toUpperCase()); setError(''); }}
                      placeholder="NOVA-XXXX"
                      className={`w-full bg-slate-950/50 border ${error ? 'border-red-500/50' : 'border-slate-800 focus:border-indigo-500'} rounded-2xl py-4 px-6 text-center text-white font-mono tracking-[0.3em] outline-none transition-all text-sm`}
                    />
                    {error && <p className="text-red-500 text-[10px] font-black uppercase mt-2">{error}</p>}
                  </div>
                  <button onClick={handleStage1} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">Initiate Protocol</button>
                  <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Master Key: {VALID_INVITE_CODE}</p>
                </div>
              )}

              {stage === 2 && (
                <div className="space-y-4 animate-in fade-in zoom-in-95 max-h-[450px] overflow-y-auto px-1 custom-scrollbar">
                  <div className="grid grid-cols-1 gap-4 text-left">
                    <div className="space-y-3">
                      <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-indigo-300">Google Gemini API</p>
                          <p className="text-[9px] text-slate-500 uppercase tracking-tighter">Core Model Uplink</p>
                        </div>
                        <button 
                          onClick={handleGeminiSync}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors"
                        >
                          Sync Key
                        </button>
                      </div>

                      {[
                        { label: 'GPT (OpenAI)', field: 'openai' },
                        { label: 'Grok (xAI)', field: 'grok' },
                        { label: 'DeepSeek', field: 'deepseek' },
                        { label: 'Claude (Anthropic)', field: 'claude' },
                      ].map((item) => (
                        <div key={item.field} className="space-y-1">
                          <label className="text-[9px] text-slate-500 font-bold uppercase ml-1">{item.label}</label>
                          <input 
                            type="password"
                            placeholder="sk-..."
                            value={(keys as any)[item.field]}
                            onChange={(e) => updateKey(item.field as any, e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-indigo-200 outline-none focus:border-indigo-500/50 font-mono"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => setStage(3)} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-700 transition-all mt-4">Save & Continue</button>
                </div>
              )}

              {stage === 3 && (
                <div className="space-y-6 animate-in fade-in zoom-in-95">
                  <div className="p-6 bg-slate-800/40 rounded-[2rem] border border-slate-700/50 flex flex-col items-center gap-6">
                    <div ref={googleBtnContainerRef} className="flex justify-center"></div>
                    {gsiStatus === 'loading' && <div className="text-[10px] text-slate-600 animate-pulse font-black uppercase">Synchronizing Neural ID...</div>}
                    <div className="h-px w-1/2 bg-slate-800"></div>
                    <button onClick={() => setStage(4)} className="text-[10px] text-indigo-400/50 hover:text-indigo-400 font-black uppercase transition-colors tracking-widest">Bypass to Guest Session</button>
                  </div>
                </div>
              )}

              {stage === 4 && (
                <div className="space-y-6 animate-in fade-in zoom-in-95">
                   <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] flex flex-col items-center gap-4">
                      <div className="relative">
                        <img src={googleUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=NovaGuest'} className="w-20 h-20 rounded-3xl border-2 border-emerald-500/50" alt="Avatar" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-slate-900 flex items-center justify-center text-[10px]">✓</div>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-black text-white">{googleUser?.name || 'Guest Explorer'}</p>
                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{googleUser?.email || 'OFFLINE_MODE'}</p>
                      </div>
                   </div>
                   <button onClick={handleFinalize} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] hover:bg-emerald-500 shadow-2xl shadow-emerald-600/20 active:scale-95 transition-all">Establish Neural Link</button>
                </div>
              )}
            </div>

            <div className="mt-10 opacity-30 text-[8px] font-black uppercase tracking-[0.6em]">AES-256-V3 Encrypted Neural Gateway</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthGate;
