
export enum AgentRole {
  GENERAL = 'GENERAL',
  RESEARCHER = 'RESEARCHER',
  CREATIVE = 'CREATIVE',
  GUIDE = 'GUIDE',
  CODER = 'CODER'
}

export interface User {
  name: string;
  email?: string;
  avatar?: string;
  isGoogleUser: boolean;
}

export interface GroundingLink {
  uri: string;
  title: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  image?: string;
  groundingLinks?: GroundingLink[];
  isThinking?: boolean;
}

export interface ModelSettings {
  temperature: number;
  thinkingBudget: number;
  maxOutputTokens: number;
}

export interface GlobalSettings {
  memories: string[];
  externalKeys: {
    openai?: string;
    deepseek?: string;
    grok?: string;
  };
}

export interface AgentConfig {
  id: AgentRole;
  name: string;
  description: string;
  icon: string;
  systemInstruction: string;
  model: string;
  tools?: ('googleSearch' | 'googleMaps')[];
}
