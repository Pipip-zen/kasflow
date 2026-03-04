import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.warn("VITE_GEMINI_API_KEY is missing from environment variables.");
}

export const genAI = new GoogleGenerativeAI(apiKey || "");
export const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
