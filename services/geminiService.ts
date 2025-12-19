
import { GoogleGenAI, GenerateContentResponse, Type, Modality, LiveServerMessage } from "@google/genai";
import { AgentConfig, GroundingLink, ModelSettings, ImageSize } from "../types";

// Manual base64 decode implementation following SDK guidelines
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Manual base64 encode implementation following SDK guidelines
function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Audio decoding for raw PCM bytes returned by Gemini Live/TTS APIs
async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export class GeminiService {
  async chat(
    agent: AgentConfig,
    message: string,
    history: { role: 'user' | 'model'; parts: { text: string }[] }[],
    settings: ModelSettings,
    memories: string[],
    _userApiKey: string,
    image?: string,
    location?: { latitude: number; longitude: number }
  ) {
    const apiKey = process.env.API_KEY || _userApiKey;
    if (!apiKey) throw new Error("API_KEY_MISSING");
    const ai = new GoogleGenAI({ apiKey });

    const overriddenModel = settings.customModelOverrides[agent.id] || agent.model;

    if (overriddenModel.includes('veo')) {
      return await this.generateVideo(message, apiKey);
    }

    if (overriddenModel.includes('image')) {
      return await this.generateImage(overriddenModel, message, apiKey, settings.imageSize, image);
    }

    const memoryContext = memories.length > 0 ? `\n[MEMORIES]:\n${memories.join('\n')}` : "";
    const fullSystemInstruction = `${agent.systemInstruction}${memoryContext}`;
    
    const contents: any[] = [...history];
    const currentParts: any[] = [{ text: message }];
    if (image) currentParts.push({ inlineData: { mimeType: "image/png", data: image.split(",")[1] } });
    contents.push({ role: 'user', parts: currentParts });

    const tools: any[] = [];
    if (settings.useSearch || agent.tools?.includes('googleSearch')) {
      tools.push({ googleSearch: {} });
    }
    if (settings.useMaps || agent.tools?.includes('googleMaps')) {
      tools.push({ googleMaps: {} });
    }

    const config: any = {
      systemInstruction: fullSystemInstruction,
      temperature: settings.temperature,
      maxOutputTokens: settings.maxOutputTokens,
      tools: tools.length > 0 ? tools : undefined
    };

    if (location && (settings.useMaps || agent.tools?.includes('googleMaps'))) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: location.latitude,
            longitude: location.longitude
          }
        }
      };
    }

    if (settings.thinkingBudget > 0 && (overriddenModel.includes('gemini-3') || overriddenModel.includes('gemini-2.5'))) {
      config.thinkingConfig = { thinkingBudget: settings.thinkingBudget };
      config.maxOutputTokens = settings.maxOutputTokens + settings.thinkingBudget;
    }

    const response: GenerateContentResponse = await ai.models.generateContent({ model: overriddenModel, contents, config });
    
    const groundingLinks: GroundingLink[] = [];
    response.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((chunk: any) => {
      if (chunk.web) groundingLinks.push({ uri: chunk.web.uri, title: chunk.web.title });
      else if (chunk.maps) groundingLinks.push({ uri: chunk.maps.uri, title: chunk.maps.title });
    });

    return { text: response.text || "...", groundingLinks };
  }

  async generateVideo(prompt: string, apiKey: string) {
    const ai = new GoogleGenAI({ apiKey });
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const finalUri = `${downloadLink}&key=${apiKey}`;
    return { text: "Synthesis Complete. Video asset generated.", video: finalUri, groundingLinks: [] };
  }

  async generateSpeech(text: string, _apiKey: string, voice: string = 'Kore') {
    const apiKey = process.env.API_KEY || _apiKey;
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioBuffer = await decodeAudioData(decodeBase64(base64Audio!), audioCtx, 24000, 1);
    return { audioBuffer, audioCtx };
  }

  private async generateImage(model: string, prompt: string, _apiKey: string, size: ImageSize, baseImage?: string) {
    const apiKey = process.env.API_KEY || _apiKey;
    const ai = new GoogleGenAI({ apiKey });
    const parts: any[] = [{ text: prompt }];
    
    if (baseImage) {
      const editModel = 'gemini-2.5-flash-image';
      parts.push({ inlineData: { data: baseImage.split(",")[1], mimeType: "image/png" } });
      const response = await ai.models.generateContent({ model: editModel, contents: { parts } });
      let image = "";
      response.candidates?.[0]?.content?.parts?.forEach(p => { if (p.inlineData) image = `data:image/png;base64,${p.inlineData.data}`; });
      return { text: "Visual Edit Complete.", image, groundingLinks: [] };
    } else {
      const imageConfig: any = { aspectRatio: "1:1" };
      if (model === 'gemini-3-pro-image-preview') {
        imageConfig.imageSize = size;
      }
      
      const response = await ai.models.generateContent({ 
        model, 
        contents: { parts }, 
        config: { imageConfig } 
      });
      let image = "";
      response.candidates?.[0]?.content?.parts?.forEach(p => { if (p.inlineData) image = `data:image/png;base64,${p.inlineData.data}`; });
      return { text: "Visual Synthesis Complete.", image, groundingLinks: [] };
    }
  }

  async connectLive(_apiKey: string, systemInstruction: string, callbacks: {
    onopen: () => void;
    onmessage: (msg: LiveServerMessage) => void;
    onerror: (e: any) => void;
    onclose: (e: any) => void;
  }, voiceName: string = 'Zephyr') {
    const apiKey = process.env.API_KEY || _apiKey;
    const ai = new GoogleGenAI({ apiKey });
    return ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks,
      config: {
        // Use string 'AUDIO' to ensure robustness
        responseModalalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName } },
        },
        systemInstruction,
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
    });
  }

  createAudioBlob(data: Float32Array): { data: string; mimeType: string } {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encodeBase64(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }
}

export const geminiService = new GeminiService();
