
import React from 'react';
import { AgentConfig, User } from '../types';
import { AGENTS } from '../constants';

interface SidebarProps {
  currentAgent: AgentConfig;
  onSelectAgent: (agent: AgentConfig) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  user: User | null;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentAgent, onSelectAgent, isMobileOpen, onCloseMobile, user, onLogout }) => {
  return (
    <div className={`
      fixed lg:static inset-y-0 left-0 z-40 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300
      ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20">
            🚀
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Nova Agent OS</h1>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Neural Interface v2.5</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <h2 className="px-3 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-widest">Active Agents</h2>
        {AGENTS.map((agent) => (
          <button
            key={agent.id}
            onClick={() => {
              onSelectAgent(agent);
              onCloseMobile();
            }}
            className={`
              w-full flex items-center gap-3 p-3 rounded-xl transition-all group
              ${currentAgent.id === agent.id 
                ? 'bg-slate-800 text-white shadow-inner ring-1 ring-slate-700' 
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}
            `}
          >
            <span className={`
              text-2xl transition-transform group-hover:scale-110 duration-200
              ${currentAgent.id === agent.id ? 'grayscale-0' : 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100'}
            `}>
              {agent.icon}
            </span>
            <div className="text-left">
              <p className="font-medium text-sm">{agent.name}</p>
              <p className="text-[10px] opacity-60 truncate w-40">{agent.description}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-slate-800 space-y-4">
        {user && (
          <div className="flex items-center gap-3 p-2 bg-slate-800/40 rounded-xl border border-slate-700/50 group">
            {user.avatar ? (
              <img src={user.avatar} className="w-8 h-8 rounded-lg border border-slate-600" alt="Avatar" />
            ) : (
              <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center text-xs text-indigo-400 font-bold">
                {user.name.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <p className="text-[9px] text-slate-500 font-medium tracking-wide uppercase">
                {user.isGoogleUser ? 'Google Verified' : 'Guest Access'}
              </p>
            </div>
            <button 
              onClick={onLogout}
              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-all text-slate-500"
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
          </div>
        )}
        
        <div className="p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
          <p className="text-[10px] text-indigo-400 font-bold uppercase mb-1">System Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-slate-300">Link Secure</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
