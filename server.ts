import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Gemini Chat
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message) {
         return res.status(400).json({ error: "Message is required" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server. Please check your secrets." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Enrich the prompt with structural context for math/calculations/financial advice
      const systemInstruction = `You are a highly capable AI Math Assistant and Financial Expert.
You help users solve mathematical equations, understand discount calculations, loan structures (EMIs), compound interest, tax systems (like GST), health metrics (like BMI), and grocery budgets.
Format your responses using clean Markdown. When displaying formulas or step-by-step mathematical calculations, use LaTeX notation enclosed in $...$ for inline math or $$...$$ for block math.
Always explain step-by-step when requested. Keep explanations intuitive, mathematically accurate, and well-structured.`;

      const contents: any[] = [];
      
      if (history && Array.isArray(history)) {
        history.forEach((msg: any) => {
          contents.push({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }]
          });
        });
      }
      
      contents.push({
        role: "user",
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "An error occurred with Gemini API" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
