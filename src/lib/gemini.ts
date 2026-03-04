import Groq from "groq-sdk";
import { getBendaharaContext } from "./chatContext";
import { groqTools } from "./geminiTools";
import { executeFunction } from "./functionExecutor";

// ---- Types ----
export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  functionCalled?: string;
};

// ChatHistory now uses OpenAI/Groq-compatible format
export type ChatHistory = {
  role: "user" | "assistant";
  content: string;
};

// ---- Groq Client ----
const apiKey = import.meta.env.VITE_GROQ_API_KEY;

if (!apiKey) {
  console.warn("VITE_GROQ_API_KEY is missing from environment variables.");
}

const groq = new Groq({
  apiKey: apiKey || "",
  dangerouslyAllowBrowser: true,
});

// ---- System Prompt ----
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

// ---- sendMessage ----
export async function sendMessage(
  message: string,
  history: ChatHistory[],
  userId: string,
  onFunctionCall?: (fnName: string) => void
): Promise<string> {
  const contextData = await getBendaharaContext(userId);

  const systemContent = SYSTEM_PROMPT.replace(
    "{CONTEXT_DATA}",
    JSON.stringify(contextData, null, 2)
  );

  // Build messages array in OpenAI format
  const messages: any[] = [
    { role: "system", content: systemContent },
    ...history,
    { role: "user", content: message },
  ];

  let response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    tools: groqTools,
    tool_choice: "auto",
    max_tokens: 2048,
  });

  let responseMessage = response.choices[0].message;

  // ---- Function Calling Loop ----
  while (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
    // Push the assistant's tool_calls message back into the conversation
    messages.push(responseMessage);

    for (const toolCall of responseMessage.tool_calls) {
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments || "{}");

      onFunctionCall?.(functionName);

      const result = await executeFunction(functionName, functionArgs, userId);

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }

    // Re-send with function results
    response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 2048,
    });

    responseMessage = response.choices[0].message;
  }

  return responseMessage.content || "";
}
