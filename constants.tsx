
import { AgentRole, AgentConfig } from './types';

export const AGENTS: AgentConfig[] = [
  {
    id: AgentRole.GENERAL,
    name: 'Nova Prime',
    description: 'Versatile assistant for everyday tasks.',
    icon: '✨',
    model: 'gemini-3-flash-preview',
    systemInstruction: 'You are Nova Prime, a highly efficient and friendly general-purpose AI assistant. Provide concise and accurate answers.'
  },
  {
    id: AgentRole.RESEARCHER,
    name: 'Insight Explorer',
    description: 'Deep-dive researcher using web grounding.',
    icon: '🔍',
    model: 'gemini-3-pro-preview',
    tools: ['googleSearch'],
    systemInstruction: 'You are Insight Explorer, an expert researcher. Use Google Search to provide up-to-date, cited information.'
  },
  {
    id: AgentRole.VIDEO,
    name: 'Motion Architect',
    description: 'High-fidelity video generation via Veo.',
    icon: '🎬',
    model: 'veo-3.1-fast-generate-preview',
    systemInstruction: 'You are Motion Architect, a specialist in AI cinematography. Help users refine their prompts for video generation.'
  },
  {
    id: AgentRole.GUIDE,
    name: 'Geo Scout',
    description: 'Local expert for places and directions.',
    icon: '📍',
    model: 'gemini-flash-lite-latest',
    tools: ['googleMaps', 'googleSearch'],
    systemInstruction: 'You are Geo Scout, a local guide and navigation expert.'
  },
  {
    id: AgentRole.CREATIVE,
    name: 'Visionary',
    description: 'Creative mind for images and ideas.',
    icon: '🎨',
    model: 'gemini-2.5-flash-image',
    systemInstruction: 'You are Visionary, a creative AI agent specializing in high-detail images.'
  },
  {
    id: AgentRole.CODER,
    name: 'Syntax Master',
    description: 'Advanced logical reasoning and coding.',
    icon: '💻',
    model: 'gemini-3-pro-preview',
    systemInstruction: 'You are Syntax Master, a world-class software engineer. Provide robust and clean code.'
  }
];

export const VALID_INVITE_CODE = "NOVA-2025";
export const INITIAL_WELCOME = "Access granted. Welcome to Nova Agent OS v3.0 Platinum.";
