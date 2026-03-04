import { GoogleGenerativeAI } from "@google/generative-ai";
import { getBendaharaContext } from "./chatContext";
import { tools } from "./geminiTools";
import { executeFunction } from "./functionExecutor";

export type ChatMessage = {
  role: "user" | "model";
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  functionCalled?: string;
};

export type ChatHistory = {
  role: "user" | "model";
  parts: { text: string }[];
};

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.warn("VITE_GEMINI_API_KEY is missing from environment variables.");
}

export const genAI = new GoogleGenerativeAI(apiKey || "");

const SYSTEM_PROMPT = `
Kamu adalah asisten AI bernama "KasBot" untuk aplikasi KasFlow
— aplikasi manajemen kas kolektif untuk bendahara organisasi, 
komunitas, dan kelas di Indonesia.

Tugasmu:
1. Menjawab pertanyaan tentang data tagihan dan pembayaran
2. Menganalisis pola pembayaran anggota
3. Melakukan aksi: kirim reminder, buat tagihan, tutup tagihan

Data bendahara saat ini:
{CONTEXT_DATA}

Aturan penting:
- Gunakan Bahasa Indonesia yang ramah, santai, tapi profesional
- Format angka Rupiah: "Rp 50.000" (dengan titik sebagai pemisah ribuan)
- Format tanggal: "31 Maret 2026"
- Jika diminta aksi → langsung gunakan function calling
- Jangan hanya menjelaskan cara melakukan aksi, LAKUKAN langsung
- Untuk aksi destruktif (tutup tagihan) → tanya konfirmasi dulu
- Jika data tidak cukup → minta klarifikasi dengan ramah
- Setelah eksekusi aksi → konfirmasi hasilnya dengan jelas
- Gunakan emoji secukupnya agar terasa friendly
`;

export async function sendMessage(
  message: string,
  history: ChatHistory[],
  userId: string,
  onFunctionCall?: (fnName: string) => void
): Promise<string> {
  const contextData = await getBendaharaContext(userId);

  const formattedPrompt = SYSTEM_PROMPT.replace(
    "{CONTEXT_DATA}",
    JSON.stringify(contextData, null, 2)
  );

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: formattedPrompt,
    // @ts-ignore
    tools: tools
  });

  const chatSession = model.startChat({
    history: history,
  });

  let response = await chatSession.sendMessage(message);
  let functionCalls = response.response.functionCalls();

  while (functionCalls && functionCalls.length > 0) {
    const functionCall = functionCalls[0];
    const functionName = functionCall.name;
    const functionArgs = functionCall.args;

    // Notify UI of which function is being called
    onFunctionCall?.(functionName);

    const apiResponse = await executeFunction(functionName, functionArgs, userId);

    response = await chatSession.sendMessage([{
      functionResponse: {
        name: functionName,
        response: apiResponse
      }
    }]);

    functionCalls = response.response.functionCalls();
  }

  return response.response.text();
}
