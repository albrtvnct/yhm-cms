import { GoogleGenerativeAI } from '@google/generative-ai';

interface OpenRouterResponse {
  choices?: {
    message?: {
      content: string;
    };
  }[];
  error?: {
    message: string;
  };
}

export interface AIContentOptions {
  provider?: 'auto' | 'gemini' | 'openrouter';
}

export async function generateAIContent(prompt: string, options?: AIContentOptions): Promise<string> {
  const provider = options?.provider || 'auto';
  const googleKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5,
    process.env.GEMINI_API_KEY_6,
    process.env.GEMINI_API_KEY_7,
    process.env.GEMINI_API_KEY_8,
    process.env.GEMINI_API_KEY_9,
    process.env.GEMINI_API_KEY_10,
  ].filter(Boolean) as string[];

  const openRouterKeys = [
    process.env.OPENROUTER_API_KEY_1,
    process.env.OPENROUTER_API_KEY_2,
  ].filter(Boolean) as string[];

  let lastError: Error | null = null;

  // 1. Coba menggunakan API Key Google (Prioritas Pertama atau dipaksa)
  if (provider === 'auto' || provider === 'gemini') {
    for (const apiKey of googleKeys) {
      try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' }); // Kembali ke Gemini 2.5 Flash Lite
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error: any) {
      console.error(`Gemini API failed for key ending in ...${apiKey.slice(-4)}:`, error);
      lastError = error;
      // Jika limit habis atau error lain, lanjut ke key berikutnya
    }
    }
    if (provider === 'gemini') {
      throw new Error(`Semua API AI Google gagal. Kesalahan terakhir: ${lastError?.message || 'Tidak ada API key yang dikonfigurasi'}`);
    }
  }

  // 2. Coba menggunakan OpenRouter (Prioritas Kedua atau dipaksa)
  if (provider === 'auto' || provider === 'openrouter') {
    for (const apiKey of openRouterKeys) {
      try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openrouter/free", // Model dinamis dari OpenRouter yang 100% selalu gratis
          messages: [
            { role: "user", content: prompt }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as OpenRouterResponse;
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        return data.choices[0].message.content;
      }
      throw new Error("Invalid response format from OpenRouter");
    } catch (error: any) {
      console.error(`OpenRouter API failed for key ending in ...${apiKey.slice(-4)}:`, error);
      lastError = error;
      // Lanjut ke key OpenRouter berikutnya
    }
  }
  } // Tambahan kurung tutup untuk block if (provider === 'auto' || provider === 'openrouter')

  // Jika semuanya gagal
  throw new Error(`Semua API AI gagal. Kesalahan terakhir: ${lastError?.message || 'Tidak ada API key yang dikonfigurasi'}`);
}
