
import { GoogleGenAI, Type } from "@google/genai";
import { QuestionSet, AdviceResult, Language } from "../types";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing in environment");
  }
  return new GoogleGenAI({ apiKey });
};

// 提取 Base64 纯数据部分
const getRawBase64 = (base64String: string) => {
  if (base64String.includes(',')) {
    return base64String.split(',')[1];
  }
  return base64String;
};

// 尝试获取 MIME 类型
const getMimeType = (base64String: string) => {
  const match = base64String.match(/^data:(image\/[a-zA-Z]+);base64,/);
  return match ? match[1] : 'image/jpeg';
};

export const generateMinimalistQuestions = async (base64Image: string, lang: Language): Promise<QuestionSet> => {
  const ai = getAI();
  const langText = lang === 'zh' ? 'Chinese' : 'English';
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: getMimeType(base64Image),
                data: getRawBase64(base64Image),
              },
            },
            {
              text: `You are a professional minimalist consultant. Analyze this image and generate 3 deep, reflective questions in ${langText} that will help the user decide the fate of the item(s) or the state of the space shown. Focus on utility, joy, and frequency of use. Output only JSON.`,
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

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(text);
  } catch (e) {
    console.error("Gemini Analysis Error:", e);
    throw e;
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

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: getMimeType(base64Image),
                data: getRawBase64(base64Image),
              },
            },
            {
              text: `Based on the image and the user's answers, provide a summary and 3-5 minimalist tips in ${langText}. Return JSON.
              
              USER ANSWERS:
              ${context}`,
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

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(text);
  } catch (e) {
    console.error("Gemini Advice Error:", e);
    throw e;
  }
};
