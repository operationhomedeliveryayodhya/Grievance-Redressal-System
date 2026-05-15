import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

export const generateFollowUpQuestion = async (complaintText: string): Promise<string> => {
  const prompt = `You are an AI assistant for a complaint registration platform. 
  A user has submitted the following complaint: "${complaintText}".
  Generate exactly one short, relevant follow-up question to better understand the situation. 
  Return only the question text.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error generating AI question:', error);
    return "Can you provide more details about when and where this happened?"; // Fallback
  }
};
