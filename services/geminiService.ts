
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
    userApiKey: string,
    image?: string,
    location?: { latitude: number; longitude: number }
  ) {
    if (!userApiKey) throw new Error("API_KEY_MISSING");
    const ai = new GoogleGenAI({ apiKey: userApiKey });

    // Handle Video Generation Case
    if (agent.model.includes('veo')) {
      return await this.generateVideo(message, userApiKey);
    }

    // Handle Image Generation Case
    if (agent.model.includes('image')) {
      return await this.generateImage(agent.model, message, userApiKey, image);
    }

    const memoryContext = memories.length > 0 ? `\n[MEMORIES]:\n${memories.join('\n')}` : "";
    const fullSystemInstruction = `${agent.systemInstruction}${memoryContext}`;
    
    const contents: any[] = [...history];
    const currentParts: any[] = [{ text: message }];
    if (image) currentParts.push({ inlineData: { mimeType: "image/png", data: image.split(",")[1] } });
    contents.push({ role: 'user', parts: currentParts });

    const config: any = {
      systemInstruction: fullSystemInstruction,
      temperature: settings.temperature,
      maxOutputTokens: settings.maxOutputTokens,
      tools: agent.tools?.map(t => ({ [t]: {} }))
    };

    if (settings.thinkingBudget > 0 && (agent.model.includes('gemini-3') || agent.model.includes('gemini-2.5'))) {
      config.thinkingConfig = { thinkingBudget: settings.thinkingBudget };
      config.maxOutputTokens = settings.maxOutputTokens + settings.thinkingBudget;
    }

    const response = await ai.models.generateContent({ model: agent.model, contents, config });
    
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
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const finalUri = `${downloadLink}&key=${apiKey}`;
    return { text: "Synthesis Complete. Video asset generated.", video: finalUri, groundingLinks: [] };
  }

  async generateSpeech(text: string, apiKey: string, voice: string = 'Kore') {
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

  private async generateImage(model: string, prompt: string, apiKey: string, baseImage?: string) {
    const ai = new GoogleGenAI({ apiKey });
    const parts: any[] = [{ text: prompt }];
    if (baseImage) parts.push({ inlineData: { data: baseImage.split(",")[1], mimeType: "image/png" } });
    const response = await ai.models.generateContent({ model, contents: { parts }, config: { imageConfig: { aspectRatio: "1:1" } } });
    let image = "";
    response.candidates?.[0]?.content?.parts?.forEach(p => { if (p.inlineData) image = `data:image/png;base64,${p.inlineData.data}`; });
    return { text: "Visual Synthesis Complete.", image, groundingLinks: [] };
  }
}

export const geminiService = new GeminiService();
