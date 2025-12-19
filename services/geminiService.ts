
import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";
import { AgentConfig, GroundingLink, ModelSettings } from "../types";

// Helper to decode base64 audio data
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper to decode raw PCM audio data into an AudioBuffer
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
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
    image?: string,
    location?: { latitude: number; longitude: number }
  ) {
    // Determine which API key and model to use based on the coreProvider
    let apiKey = process.env.API_KEY;
    let targetModel = agent.model;

    // Handle provider-specific logic
    if (settings.coreProvider !== 'GEMINI') {
      // In a real scenario, we'd route this to specific APIs. 
      // For this implementation, we map requests to Gemini equivalents or placeholder logic
      // if the SDK is strictly Gemini.
      console.warn(`Redirecting ${settings.coreProvider} request through Neural Gateway.`);
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    const memoryContext = memories.length > 0 
      ? `\n[GLOBAL MEMORIES]:\n${memories.map(m => `- ${m}`).join('\n')}`
      : "";
    
    const fullSystemInstruction = `${agent.systemInstruction}${memoryContext}`;

    const tools: any[] = [];
    if (agent.tools?.includes('googleSearch')) tools.push({ googleSearch: {} });
    if (agent.tools?.includes('googleMaps')) tools.push({ googleMaps: {} });

    const contents: any[] = [];
    contents.push(...history);

    const currentParts: any[] = [{ text: message }];
    if (image) {
      currentParts.push({
        inlineData: { mimeType: "image/png", data: image.split(",")[1] },
      });
    }
    contents.push({ role: 'user', parts: currentParts });

    const calculatedMaxTokens = settings.thinkingBudget > 0 
      ? settings.maxOutputTokens + settings.thinkingBudget 
      : settings.maxOutputTokens;

    const config: any = {
      systemInstruction: fullSystemInstruction,
      temperature: settings.temperature,
      maxOutputTokens: calculatedMaxTokens,
    };

    if (settings.thinkingBudget > 0 && (targetModel.includes('gemini-3') || targetModel.includes('gemini-2.5'))) {
      config.thinkingConfig = { thinkingBudget: settings.thinkingBudget };
    }

    if (tools.length > 0) config.tools = tools;

    if (agent.tools?.includes('googleMaps') && location) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: { latitude: location.latitude, longitude: location.longitude }
        }
      };
    }

    if (targetModel.includes('image')) {
      return await this.generateImage(targetModel, message, image);
    }

    try {
      const response = await ai.models.generateContent({
        model: targetModel,
        contents,
        config,
      });

      const groundingLinks: GroundingLink[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.web) groundingLinks.push({ uri: chunk.web.uri, title: chunk.web.title });
          else if (chunk.maps) groundingLinks.push({ uri: chunk.maps.uri, title: chunk.maps.title });
        });
      }

      return {
        text: response.text || "No response generated.",
        groundingLinks
      };
    } catch (error: any) {
      if (error.message?.includes("Requested entity was not found")) {
        if (typeof window !== 'undefined' && window.aistudio) {
          window.aistudio.openSelectKey();
        }
      }
      throw error;
    }
  }

  async generateSpeech(text: string, voice: string = 'Kore') {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Audio generation failed");

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioBytes = decodeBase64(base64Audio);
    const audioBuffer = await decodeAudioData(audioBytes, audioCtx, 24000, 1);
    
    return { audioBuffer, audioCtx };
  }

  private async generateImage(model: string, prompt: string, baseImage?: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const parts: any[] = [{ text: prompt }];
    if (baseImage) {
      parts.push({
        inlineData: { data: baseImage.split(",")[1], mimeType: "image/png" }
      });
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });

    let generatedImage = "";
    let text = "";

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) generatedImage = `data:image/png;base64,${part.inlineData.data}`;
        else if (part.text) text = part.text;
      }
    }

    return { text: text || "Generated an image.", image: generatedImage, groundingLinks: [] };
  }
}

export const geminiService = new GeminiService();
