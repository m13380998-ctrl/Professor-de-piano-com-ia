
import { GoogleGenAI, Type } from "@google/genai";
import { SongAnalysisResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeSongFromUrl(url: string): Promise<SongAnalysisResponse> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analise o seguinte link do YouTube e forneça uma sequência simplificada de notas musicais para a melodia principal. 
    O link é: ${url}. 
    Retorne o nome da música, o artista, a dificuldade e uma lista de objetos contendo 'note' (C, C#, D, etc), 'octave' (3-5), 'duration' e 'step'.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          songTitle: { type: Type.STRING },
          artist: { type: Type.STRING },
          difficulty: { type: Type.STRING },
          notes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                note: { type: Type.STRING },
                octave: { type: Type.NUMBER },
                duration: { type: Type.STRING },
                step: { type: Type.NUMBER }
              },
              required: ["note", "octave", "step"]
            }
          }
        },
        required: ["songTitle", "artist", "notes"]
      }
    }
  });

  // Fix: Safe extraction and trimming of the text property from GenerateContentResponse
  const jsonStr = (response.text || '').trim();
  if (!jsonStr) {
    throw new Error('Empty response from AI model');
  }
  return JSON.parse(jsonStr);
}
