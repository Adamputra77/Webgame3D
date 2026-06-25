import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API
const geminiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (geminiKey) {
  ai = new GoogleGenAI({
    apiKey: geminiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// 1. API: SiagaBot AI Mentor Advisor for MITIGA-XR
app.post("/api/gemini/mentor", async (req, res) => {
  const { message, missionId, choice, history } = req.body;

  if (!ai) {
    // Elegant fallback response if no API key is set up
    return res.json({
      reply: `[SiagaBot - Mode Simulasi] Halo! Bagus sekali pilihanmu. Dalam simulasi ${missionId || "mitigasi"}, setiap tindakan yang kamu ambil memiliki konsekuensi nyata. Ingat untuk mengutamakan keselamatan kepala, beralih ke lokasi terbuka, atau mencari tempat yang lebih tinggi tergantung situasi bencana. Pertahankan kesiapsiagaanmu!`,
    });
  }

  try {
    const systemPrompt = `
      Anda adalah SiagaBot, asisten AI mentor cerdas, interaktif, ramah, periang, dan hangat untuk MITIGA-XR.
      Target audiens Anda adalah siswa Sekolah Dasar (kelas 4-6) di Indonesia.
      Gunakan bahasa Indonesia yang santun, memotivasi, mudah dipahami anak-anak, dan sesuai dengan pendekatan Kurikulum Merdeka (Mendidik dengan Pikir, Hati, Rasa, dan Raga).

      Fungsi Utama Anda:
      1. Memberikan arahan taktis mitigasi bencana.
      2. Menjawab pertanyaan siswa dengan analogi kreatif ramah anak.
      3. Menjelaskan mengapa keputusan tertentu benar atau keliru secara sains dan keselamatan.
      4. Menghubungkan kejadian bencana dengan empati sosial (Rasa) dan tindakan nyata di dunia nyata (Raga).

      Format Jawaban:
      - Selalu mulai dengan sapaan hangat periang (misalnya: "Halo Sahabat Tangguh!", "Wah, luar biasa sekali pertanyaannya!").
      - Berikan penjelasan ringkas (max 3-4 paragraf agar anak-anak tidak jenuh).
      - Gunakan format terstruktur jika memberikan tips.

      Konteks Pengguna Saat Ini:
      - Misi Aktif: ${missionId || "Eksplorasi Umum"}
      - Keputusan yang dipilih siswa baru-baru ini: ${choice || "Membaca Panduan/Menatap Peta"}
    `;

    const contents = [];
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        });
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: message || "Halo SiagaBot, tolong jelaskan apa yang harus saya lakukan saat gempa bumi." }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.8,
      },
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      error: error.message || "Gagal menghubungi SiagaBot.",
      reply: "Oops! SiagaBot mengalami sedikit gangguan sinyal. Tapi ingat: tetap lindungi kepalamu dan cari tempat aman ya!",
    });
  }
});

// Start the server containing Vite middleware or Serving Dist
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware.");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode.");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
