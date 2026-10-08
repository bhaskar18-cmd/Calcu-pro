import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Sparkles, User, Bot, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import katex from "katex";
import { Theme } from "../types";

// Ensure katex stylesheet is included
import "katex/dist/katex.min.css";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AiAssistantProps {
  theme: Theme;
}

// Custom renderer to format equations
function SmartMathText({ text }: { text: string }) {
  if (!text) return null;

  // Split content by block equations $$...$$
  const blocks = text.split(/\$\$(.*?)\$\$/gs);

  return (
    <div className="space-y-2">
      {blocks.map((block, bIdx) => {
        // Odd indices are block math expressions
        if (bIdx % 2 !== 0) {
          try {
            const html = katex.renderToString(block, {
              displayMode: true,
              throwOnError: false,
            });
            return (
              <div
                key={bIdx}
                dangerouslySetInnerHTML={{ __html: html }}
                className="overflow-x-auto my-3 bg-black/5 dark:bg-white/5 p-3 rounded-xl scrollbar-thin"
              />
            );
          } catch (e) {
            return (
              <pre key={bIdx} className="bg-black/5 dark:bg-white/5 p-2 rounded text-xs overflow-x-auto">
                {block}
              </pre>
            );
          }
        }

        // Even indices are text which might contain inline math $...$
        const inlines = block.split(/\$(.*?)\$/g);
        return (
          <span key={bIdx} className="inline-block w-full">
            {inlines.map((chunk, iIdx) => {
              // Odd indices are inline math
              if (iIdx % 2 !== 0) {
                try {
                  const html = katex.renderToString(chunk, {
                    displayMode: false,
                    throwOnError: false,
                  });
                  return (
                    <span
                      key={iIdx}
                      dangerouslySetInnerHTML={{ __html: html }}
                      className="mx-1 px-1 bg-black/5 dark:bg-white/5 rounded font-mono"
                    />
                  );
                } catch (e) {
                  return <span key={iIdx} className="font-mono text-red-400">{chunk}</span>;
                }
              }

              // Even indices are standard markdown text
              return (
                <span key={iIdx} className="markdown-body inline">
                  <ReactMarkdown>{chunk}</ReactMarkdown>
                </span>
              );
            })}
          </span>
        );
      })}
    </div>
  );
}

export default function AiAssistant({ theme }: AiAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Populate with friendly intro
    setMessages([
      {
        role: "assistant",
        content: `Welcome to your **AI Math & Financial Assistant**! 📐✨

I can help you:
- Solve advanced calculations or calculus problems: $$f(x) = \\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$
- Analyze EMI schedules, compound interest, or discount optimization
- Answer general financial budgeting questions or help with grocery tax conversions.

Ask me anything or paste an equation below!`,
      },
    ]);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: messages.slice(1), // Exclude introductory greeting
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with server");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.text }]);
    } catch (error: any) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an issue while processing your math request. Make sure your GEMINI_API_KEY is configured in your platform secrets.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Chat cleared! How can I assist you with math or financial advice now?",
      },
    ]);
  };

  const getThemeStyles = () => {
    switch (theme) {
      case "neumorphic":
        return {
          card: "bg-[#1A1A1A] border border-[#2A2A2A] shadow-[inset_1px_1px_5px_rgba(0,0,0,0.8)] rounded-3xl p-5 text-gray-100 flex flex-col h-[500px]",
          headerText: "text-gray-300 font-bold",
          messageUser: "bg-[#252525] border border-[#333] text-gray-100 rounded-2xl p-3.5 max-w-[85%] self-end",
          messageAi: "bg-[#1E1E1E] border border-[#252525] text-gray-100 rounded-2xl p-3.5 max-w-[85%] self-start",
          input: "bg-[#141414] border border-[#2D2D2D] text-gray-100 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#00E676] shadow-[inset_1px_1px_4px_rgba(0,0,0,0.9)]",
          btnSend: "bg-[#00E676] text-black hover:bg-[#00c853] p-2.5 rounded-xl cursor-pointer shadow-[0_0_8px_rgba(0,230,118,0.2)]",
          accentText: "text-[#00E676]",
        };
      case "financial":
        return {
          card: "bg-[#E6E6D4] border border-[#C5C5B2] shadow-md rounded-3xl p-5 text-[#3C3C30] flex flex-col h-[500px]",
          headerText: "text-[#556B2F] font-bold",
          messageUser: "bg-[#ECECD8] border border-[#C5C5B2] text-[#3C3C30] rounded-2xl p-3.5 max-w-[85%] self-end",
          messageAi: "bg-[#F3F3E7] border border-[#BCBCA6] text-[#3C3C30] rounded-2xl p-3.5 max-w-[85%] self-start",
          input: "bg-[#F3F3E7] border border-[#BCBCA6] text-[#3C3C30] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#556B2F]",
          btnSend: "bg-[#556B2F] text-white hover:bg-[#475b24] p-2.5 rounded-xl cursor-pointer",
          accentText: "text-[#556B2F]",
        };
      case "cosmic":
        return {
          card: "backdrop-blur-md bg-white/5 border border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] rounded-3xl p-5 text-white flex flex-col h-[500px]",
          headerText: "text-cyan-400 font-bold",
          messageUser: "bg-purple-900/40 border border-purple-500/20 text-white rounded-2xl p-3.5 max-w-[85%] self-end",
          messageAi: "bg-cyan-950/40 border border-cyan-500/20 text-white rounded-2xl p-3.5 max-w-[85%] self-start",
          input: "bg-black/40 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-cyan-400",
          btnSend: "bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:opacity-90 p-2.5 rounded-xl cursor-pointer shadow-[0_0_12px_rgba(168,85,247,0.3)]",
          accentText: "text-cyan-400",
        };
      case "minimalist":
      default:
        return {
          card: "bg-white border border-[#E5E5E5] shadow-sm rounded-3xl p-5 text-gray-800 flex flex-col h-[500px]",
          headerText: "text-gray-900 font-semibold",
          messageUser: "bg-gray-900 text-white rounded-2xl p-3.5 max-w-[85%] self-end",
          messageAi: "bg-[#F5F5F7] text-gray-800 border border-[#E5E5E5] rounded-2xl p-3.5 max-w-[85%] self-start",
          input: "bg-[#F9F9F9] border border-[#E5E5E5] text-gray-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-gray-900",
          btnSend: "bg-gray-900 text-white hover:bg-gray-800 p-2.5 rounded-xl cursor-pointer",
          accentText: "text-gray-900",
        };
    }
  };

  const s = getThemeStyles();

  return (
    <div className={s.card} id="ai-assistant-container">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3 mb-4">
        <div className="flex items-center space-x-2.5">
          <Sparkles className={`w-5 h-5 ${s.accentText}`} />
          <h3 className={`text-sm uppercase tracking-wider ${s.headerText}`}>AI Assistant</h3>
        </div>
        <button
          onClick={clearChat}
          className="text-xs opacity-50 hover:opacity-100 transition-opacity cursor-pointer font-semibold uppercase tracking-wider"
        >
          Reset Chat
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1.5 scrollbar-thin scrollbar-thumb-gray-300"
        id="ai-messages-scroller"
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start space-x-2.5 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role !== "user" && (
              <div className={`p-1.5 rounded-full ${theme === "cosmic" ? "bg-cyan-500/20" : "bg-black/5 dark:bg-white/5"}`}>
                <Bot className={`w-4 h-4 ${s.accentText}`} />
              </div>
            )}
            <div className={msg.role === "user" ? s.messageUser : s.messageAi}>
              <SmartMathText text={msg.content} />
            </div>
            {msg.role === "user" && (
              <div className={`p-1.5 rounded-full ${theme === "cosmic" ? "bg-purple-500/20" : "bg-black/5 dark:bg-white/5"}`}>
                <User className="w-4 h-4 text-purple-400" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start space-x-2.5">
            <div className={`p-1.5 rounded-full ${theme === "cosmic" ? "bg-cyan-500/20" : "bg-black/5 dark:bg-white/5"}`}>
              <Bot className={`w-4 h-4 ${s.accentText}`} />
            </div>
            <div className={`${s.messageAi} flex items-center space-x-2`}>
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              <span className="text-xs font-mono opacity-65">Formulating math context...</span>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input form */}
      <form onSubmit={handleSend} className="flex items-center space-x-2" id="ai-chat-form">
        <input
          type="text"
          placeholder="Ask a question or enter formula..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className={`flex-1 ${s.input}`}
          id="ai-chat-input"
        />
        <button type="submit" className={s.btnSend} id="btn-ai-chat-send" disabled={isLoading}>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
