
import React, { useState, useEffect, useRef } from 'react';
import { VALID_INVITE_CODE } from '../constants';
import { User } from '../types';

// Declare google as a global variable
declare const google: any;

interface AuthGateProps {
  onAuthorized: (user: User) => void;
}

const AuthGate: React.FC<AuthGateProps> = ({ onAuthorized }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [googleUser, setGoogleUser] = useState<Partial<User> | null>(null);
  const [isGoogleScriptLoaded, setIsGoogleScriptLoaded] = useState(false);
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
    } catch (e) {
      console.error("JWT Decode failed", e);
      return null;
    }
  };

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 50; // 5 seconds max

    const initializeGoogleSignIn = () => {
      if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
        setIsGoogleScriptLoaded(true);
        google.accounts.id.initialize({
          client_id: "1061324330236-96b797l60h3e7e23m9n0a2b4e5f6g7h8.apps.googleusercontent.com", 
          callback: (response: any) => {
            const payload = decodeJwt(response.credential);
            if (payload) {
              setGoogleUser({
                name: payload.name,
                email: payload.email,
                avatar: payload.picture
              });
            }
          },
          auto_select: false,
          itp_support: true
        });

        if (googleBtnContainerRef.current) {
          google.accounts.id.renderButton(googleBtnContainerRef.current, {
            type: 'standard',
            theme: 'filled_blue',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            width: 320
          });
        }
      } else if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(initializeGoogleSignIn, 100);
      }
    };

    initializeGoogleSignIn();
  }, []);

  const handleEnter = () => {
    if (inviteCode.trim().toUpperCase() !== VALID_INVITE_CODE) {
      setError(`Invalid code. Try using ${VALID_INVITE_CODE}`);
      return;
    }

    const user: User = {
      name: googleUser?.name || 'Guest Explorer',
      email: googleUser?.email,
      avatar: googleUser?.avatar,
      isGoogleUser: !!googleUser
    };

    onAuthorized(user);
  };

  const isCodeValid = inviteCode.trim().toUpperCase() === VALID_INVITE_CODE;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[150px] rounded-full"></div>
      </div>

      <div className="relative w-full max-w-md p-10 bg-slate-900/40 backdrop-blur-2xl border border-slate-800 rounded-[2.5rem] shadow-2xl flex flex-col items-center text-center">
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-5xl shadow-2xl shadow-indigo-500/20 rotate-3 transform hover:rotate-0 transition-transform duration-500">
            ✨
          </div>
          <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-slate-900 animate-pulse"></div>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-3">Nova Agent OS</h1>
        <p className="text-slate-400 text-sm mb-10 leading-relaxed px-4">
          请输入授权码以访问神经接口。Google 登录为可选步骤。
        </p>

        <div className="w-full space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="flex-grow h-px bg-slate-800"></div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Step 1: Identity</span>
              <div className="flex-grow h-px bg-slate-800"></div>
            </div>

            {googleUser ? (
              <div className="flex items-center gap-4 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
                <img src={googleUser.avatar} className="w-12 h-12 rounded-xl shadow-lg border border-white/10" alt="Profile" />
                <div className="text-left flex-1 overflow-hidden">
                  <p className="text-sm font-bold text-white truncate">{googleUser.name}</p>
                  <p className="text-[11px] text-indigo-400 font-medium truncate">{googleUser.email}</p>
                </div>
                <button 
                  onClick={() => setGoogleUser(null)}
                  className="p-2 text-slate-500 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[50px] w-full">
                {!isGoogleScriptLoaded ? (
                  <div className="w-full h-11 bg-slate-800/50 rounded-full animate-pulse flex items-center justify-center">
                    <span className="text-xs text-slate-600 font-medium italic">Loading Auth SDK...</span>
                  </div>
                ) : (
                  <div ref={googleBtnContainerRef} className="transform scale-110"></div>
                )}
                <p className="mt-3 text-[10px] text-slate-500 font-medium">Use your real Google Account (Optional)</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="flex-grow h-px bg-slate-800"></div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Step 2: Access Key</span>
              <div className="flex-grow h-px bg-slate-800"></div>
            </div>
            
            <div className="space-y-3">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => {
                  setInviteCode(e.target.value.toUpperCase());
                  setError('');
                }}
                placeholder="NOVA-XXXX-XXXX"
                className={`w-full bg-slate-800/50 border ${error ? 'border-red-500/50 ring-4 ring-red-500/10' : 'border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'} rounded-2xl py-4 px-5 text-center text-white font-mono tracking-widest placeholder:text-slate-700 transition-all outline-none`}
              />
              <div className="flex flex-col gap-1 items-center">
                {error && <p className="text-red-400 text-[11px] font-bold animate-shake">{error}</p>}
                <p className="text-[10px] text-slate-600 font-bold uppercase">
                  邀请码: <span className="text-indigo-400 select-all cursor-pointer hover:text-indigo-300 transition-colors">{VALID_INVITE_CODE}</span>
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleEnter}
            disabled={!inviteCode.trim()}
            className={`
              w-full py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all transform active:scale-[0.98] shadow-2xl
              ${isCodeValid 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
            `}
          >
            Authorize Connection
          </button>
        </div>

        <div className="mt-12 flex items-center gap-2 opacity-30">
          <div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div>
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">v2.5.0 Encrypted Auth Link</span>
          <div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default AuthGate;
