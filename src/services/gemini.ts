import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || " " });

export const model = genAI.models.generateContent.bind(genAI.models);

export async function generateResponse(prompt: string, systemInstruction?: string) {
  const result = await genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      systemInstruction,
      temperature: 0.7,
    }
  });
  return result.text;
}

export async function getPrecedents(query: string, council: string, decision: 'Approved' | 'Refused') {
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&council=${encodeURIComponent(council)}&decision=${decision}`);
  if (!response.ok) return [];
  return await response.json();
}
