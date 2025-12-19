
export enum AgentRole {
  GENERAL = 'GENERAL',
  RESEARCHER = 'RESEARCHER',
  CREATIVE = 'CREATIVE',
  GUIDE = 'GUIDE',
  CODER = 'CODER',
  VIDEO = 'VIDEO'
}

export type InferenceMode = 'STANDARD' | 'PRECISION' | 'TURBO';
export type UIDensity = 'COMPACT' | 'SPACIOUS';
export type Language = 'EN' | 'ZH';
export type CoreProvider = 'GEMINI' | 'CLAUDE' | 'GPT' | 'DEEPSEEK' | 'GROK';

export interface ExternalKeys {
  openai?: string;
  grok?: string;
  deepseek?: string;
  claude?: string;
  gemini?: string;
  codex?: string;
}

export interface User {
  name: string;
  email?: string;
  avatar?: string;
  isGoogleUser: boolean;
  keys: ExternalKeys;
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
  video?: string;
  groundingLinks?: GroundingLink[];
  isThinking?: boolean;
}

export interface ModelSettings {
  temperature: number;
  thinkingBudget: number;
  maxOutputTokens: number;
  inferenceMode: InferenceMode;
  voiceName: string;
  autoRead: boolean;
  historyDepth: number;
  uiDensity: UIDensity;
  language: Language;
  coreProvider: CoreProvider;
  customModelOverride?: string;
}

export interface GlobalSettings {
  memories: string[];
  externalKeys: ExternalKeys;
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
