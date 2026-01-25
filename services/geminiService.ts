
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ALFA_CHAT_SYSTEM_PROMPT, MODEL_NAME } from "../constants";
import { Message } from "../types";

export const getAlfaaChatResponse = async (
  messages: Message[],
  onChunk: (text: string) => void
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  // Format history for Gemini
  const contents = messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  try {
    const stream = await ai.models.generateContentStream({
      model: MODEL_NAME,
      contents,
      config: {
        systemInstruction: ALFA_CHAT_SYSTEM_PROMPT,
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
      },
    });

    let fullText = "";
    for await (const chunk of stream) {
      const text = (chunk as GenerateContentResponse).text;
      if (text) {
        fullText += text;
        onChunk(fullText);
      }
    }
    return fullText;
  } catch (error) {
    console.error("AlfaaChat API Error:", error);
    throw error;
  }
};
