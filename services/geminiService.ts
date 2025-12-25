
import { GoogleGenAI, Type } from "@google/genai";
import { QuestionSet, AdviceResult, Language } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateMinimalistQuestions = async (base64Image: string, lang: Language): Promise<QuestionSet> => {
  const ai = getAI();
  const langText = lang === 'zh' ? 'Chinese' : 'English';
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image.split(',')[1] || base64Image,
            },
          },
          {
            text: `You are a professional minimalist consultant. Analyze this image and generate 3 deep, reflective questions that will help the user decide the fate of the item(s) or the state of the space shown. Focus on utility, joy, and frequency of use. 
            IMPORTANT: Your output MUST be in ${langText}. Output only JSON.`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Exactly 3 minimalist questions.",
          },
        },
        required: ["questions"],
      },
    },
  });

  try {
    return JSON.parse(response.text || '{"questions": []}');
  } catch (e) {
    console.error("Failed to parse AI response as JSON", e);
    return lang === 'zh' 
      ? { questions: ["这个东西如何增加价值？", "你上次使用它是什么时候？", "它能带来喜悦吗？"] }
      : { questions: ["How does this add value?", "When was the last time you used this?", "Does this spark joy?"] };
  }
};

export const generateAdvice = async (
  base64Image: string,
  questions: string[],
  answers: string[],
  lang: Language
): Promise<AdviceResult> => {
  const ai = getAI();
  const langText = lang === 'zh' ? 'Chinese' : 'English';
  const context = questions.map((q, i) => `Q: ${q}\nA: ${answers[i]}`).join("\n\n");

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image.split(',')[1] || base64Image,
            },
          },
          {
            text: `Based on the attached image and the user's following answers to minimalist questions, provide a summary of the situation and 3-5 actionable minimalist tips.
            
            USER ANSWERS:
            ${context}
            
            IMPORTANT: Your output MUST be in ${langText}. Return the result in JSON format.`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          tips: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          philosophicalReflection: { type: Type.STRING },
        },
        required: ["summary", "tips", "philosophicalReflection"],
      },
    },
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    throw new Error(lang === 'zh' ? "生成极简建议失败。" : "Failed to generate minimalist advice.");
  }
};
