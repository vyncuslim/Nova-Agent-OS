
import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";
import { AgentConfig, GroundingLink, ModelSettings } from "../types";

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Inject memories into system instruction
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

    const config: any = {
      systemInstruction: fullSystemInstruction,
      temperature: settings.temperature,
      maxOutputTokens: settings.maxOutputTokens,
    };

    // Thinking Budget config for Gemini 3 and 2.5
    if (settings.thinkingBudget > 0 && (agent.model.includes('gemini-3') || agent.model.includes('gemini-2.5'))) {
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

    if (agent.model.includes('image')) {
      return await this.generateImage(agent.model, message, image);
    }

    const response = await ai.models.generateContent({
      model: agent.model,
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
  }

  async generateSpeech(text: string, voice: string = 'Kore') {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
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
