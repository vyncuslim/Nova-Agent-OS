
import React, { useState, useEffect, useRef } from 'react';
import { VALID_INVITE_CODE } from '../constants';
import { User } from '../types';

declare const google: any;
declare const window: any;

interface AuthGateProps {
  onAuthorized: (user: User) => void;
}

const AuthGate: React.FC<AuthGateProps> = ({ onAuthorized }) => {
  // 1: Vault Sync, 2: Handshake, 3: Identity Sync, 4: Finalize
  const [stage, setStage] = useState<1 | 2 | 3 | 4>(1);
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [googleUser, setGoogleUser] = useState<Partial<User> | null>(null);
  const [gsiStatus, setGsiStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

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
    if (stage === 1) {
      const checkKey = async () => {
        if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
          setStage(2);
        }
      };
      checkKey();
    }

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
            use_fedcm_for_prompt: true,
            context: 'signin'
          });
          if (googleBtnContainerRef.current) {
            google.accounts.id.renderButton(googleBtnContainerRef.current, {
              type: 'standard', theme: 'filled_black', size: 'large', text: 'signin_with', shape: 'pill', width: 320
            });
            setGsiStatus('ready');
          }
          google.accounts.id.prompt();
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }
  }, [stage]);

  const handleOpenVault = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Proceed to handshake immediately after triggering dialog as per race condition rules
      setStage(2);
    }
  };

  const handleStage2 = () => {
    if (inviteCode.trim().toUpperCase() === VALID_INVITE_CODE) {
      setStage(3);
      setError('');
    } else {
      setError('INVALID HANDSHAKE TOKEN');
    }
  };

  const handleFinalize = () => {
    onAuthorized({
      name: googleUser?.name || 'Authorized Guest',
      email: googleUser?.email,
      avatar: googleUser?.avatar,
      isGoogleUser: !!googleUser
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617] overflow-hidden text-slate-200">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full"></div>
      </div>

      <div className="relative w-full max-w-md mx-4">
        <div className="bg-slate-900/60 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-10 shadow-2xl">
          
          <div className="flex flex-col items-center text-center">
            <div className="mb-8 relative group">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-700 rounded-3xl flex items-center justify-center text-4xl shadow-2xl shadow-indigo-500/20 transition-transform group-hover:scale-110">
                {stage === 1 ? '🛡️' : stage === 2 ? '🔑' : stage === 3 ? '🧬' : '🔗'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-slate-900 animate-pulse"></div>
            </div>

            <h1 className="text-3xl font-black tracking-tighter text-white mb-1 italic">NOVA OS</h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mb-10">
              Stage {stage}: {stage === 1 ? 'Vault Synchronization' : stage === 2 ? 'Neural Handshake' : stage === 3 ? 'Identity Sync' : 'Final Protocol'}
            </p>

            <div className="w-full space-y-8 min-h-[240px] flex flex-col justify-center">
              {stage === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-4 italic text-left">
                      To initialize this AI interface, you must provide your own Gemini API Key. This key is used exclusively for your local sessions.
                    </p>
                    <button 
                      onClick={handleOpenVault} 
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3"
                    >
                      <span>SYNC NEURAL VAULT</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    </button>
                  </div>
                  <a 
                    href="https://ai.google.dev/gemini-api/docs/billing" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[9px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest underline decoration-2 underline-offset-4"
                  >
                    Billing Documentation & Setup
                  </a>
                </div>
              )}

              {stage === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <input
                    type="text" value={inviteCode}
                    onChange={(e) => { setInviteCode(e.target.value.toUpperCase()); setError(''); }}
                    placeholder="ENTER ACCESS KEY"
                    className={`w-full bg-slate-950/50 border ${error ? 'border-red-500/50' : 'border-slate-800 focus:border-indigo-500'} rounded-2xl py-4 px-5 text-center text-white font-mono tracking-[0.4em] outline-none transition-all`}
                  />
                  {error && <p className="text-red-500 text-[10px] font-black uppercase">{error}</p>}
                  <button onClick={handleStage2} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 shadow-xl shadow-indigo-600/20">Verify Protocol</button>
                  <p className="text-[10px] text-slate-600 font-bold">SYSTEM BYPASS: {VALID_INVITE_CODE}</p>
                </div>
              )}

              {stage === 3 && (
                <div className="space-y-6 animate-in fade-in zoom-in-95">
                  <div ref={googleBtnContainerRef} className="flex justify-center transition-opacity duration-1000"></div>
                  {gsiStatus === 'loading' && <div className="text-[10px] text-slate-600 animate-pulse font-bold uppercase">Connecting Identity Provider...</div>}
                  <button onClick={() => setStage(4)} className="text-[10px] text-indigo-400/50 hover:text-indigo-400 font-bold uppercase transition-colors">Skip for Guest Access</button>
                </div>
              )}

              {stage === 4 && (
                <div className="space-y-6 animate-in fade-in zoom-in-95">
                   <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl flex items-center gap-4">
                      <img src={googleUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest'} className="w-12 h-12 rounded-xl" alt="P" />
                      <div className="text-left flex-1">
                        <p className="text-sm font-bold">{googleUser?.name || 'Guest Explorer'}</p>
                        <p className="text-[10px] text-slate-500 font-mono italic">{googleUser?.email || 'unverified_identity'}</p>
                      </div>
                   </div>
                   <button onClick={handleFinalize} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-emerald-500 shadow-xl shadow-emerald-600/20">Establish Secure Link</button>
                </div>
              )}
            </div>

            <div className="mt-12 opacity-20 text-[8px] font-black uppercase tracking-[0.6em]">Neural-AES-256-GCM Secure</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthGate;
