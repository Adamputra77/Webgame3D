import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Sparkles, Smile, X, RefreshCw } from "lucide-react";
import { SiagaBotMessage } from "../types";

interface SiagaBotProps {
  currentMissionId?: "earthquake" | "flood" | "volcano" | "dashboard" | "general";
  currentChoice?: string;
}

export default function SiagaBot({ currentMissionId = "general", currentChoice = "" }: SiagaBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<SiagaBotMessage[]>([
    {
      id: "1",
      sender: "bot",
      text: "Halo Sahabat Tangguh! Aku SiagaBot, asisten AI siaga bencanamu. Kamu bisa menanyakan apa saja tentang cara menyelamatkan diri dari gempa bumi, banjir, gunung meletus, atau tas siaga bencana! Ada yang ingin kamu ketahui?",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputValue;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: SiagaBotMessage = {
      id: Math.random().toString(),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Map user history format for Gemini API
      const historyPayload = messages.map((m) => ({
        role: m.sender === "user" ? "user" : "model",
        text: m.text,
      }));

      const res = await fetch("/api/gemini/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          missionId: currentMissionId,
          choice: currentChoice,
          history: historyPayload,
        }),
      });

      const data = await res.json();
      const botMsg: SiagaBotMessage = {
        id: Math.random().toString(),
        sender: "bot",
        text: data.reply || "Maaf sahabat, kepalaku agak pusing. Tapi ingat: terus waspada dilingkunganmu!",
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const botMsg: SiagaBotMessage = {
        id: Math.random().toString(),
        sender: "bot",
        text: "Koneksi satelitku sedang terputus nih. Tapi ingat aturan emas: jika gempa terasa guncang hebat, langsung berlindung di kolong meja!",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const recommendedQuestions = [
    { text: "Bagaimana cara merancang jalur evakuasi sekolah?", mission: "general" },
    { text: "Apa isi tas siaga bencana yang paling penting?", mission: "general" },
    { text: "Mengapa dilarang masuk lift saat gempa bumi?", mission: "earthquake" },
    { text: "Bagaimana cara mencegah banjir di lingkungan rumah?", mission: "flood" },
    { text: "Apa itu awan panas wedhus gembel gunung berapi?", mission: "volcano" },
  ];

  return (
    <>
      {/* Floating Chat Icon bottom right */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-2xl flex items-center justify-center relative group transition transform hover:scale-105 shadow-blue-500/30"
          id="siagabot-toggle-btn"
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
          <span className="absolute right-14 bg-slate-900 border border-slate-700 text-xs px-2.5 py-1 rounded-lg text-slate-200 hidden group-hover:block whitespace-nowrap">
            Tanya SiagaBot AI ⚡
          </span>
          {!isOpen && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[10px] items-center justify-center font-bold text-white">
                !
              </span>
            </span>
          )}
        </button>
      </div>

      {/* Floating Chat Window Panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 w-11/12 sm:w-[400px] h-[520px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
          id="siagabot-panel"
        >
          {/* Header */}
          <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500 flex items-center justify-center text-blue-400">
                <Sparkles className="w-4 h-4 animate-spin-slow" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white">SiagaBot AI Mentor</h4>
                <p className="text-[10px] text-green-400 flex items-center gap-1 font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> ONLINE - CHAT DARURAT
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950/40">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col max-w-[85%] ${
                  m.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                }`}
              >
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                    m.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-slate-800/80 text-slate-200 border border-slate-800 rounded-bl-none"
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-slate-500 mt-1 font-mono">{m.timestamp}</span>
              </div>
            ))}
            {isLoading && (
              <div className="flex mr-auto items-start max-w-[85%] gap-2">
                <div className="bg-slate-800/60 border border-slate-800 text-slate-400 text-xs px-3.5 py-2.5 rounded-2xl rounded-bl-none flex items-center gap-2 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
                  SiagaBot sedang berpikir...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Recommend Questions scrollable indicators */}
          <div className="bg-slate-950 p-2.5 border-t border-slate-800 overflow-x-auto flex gap-2 whitespace-nowrap scrollbar-thin">
            {recommendedQuestions
              .filter((q) => q.mission === "general" || q.mission === currentMissionId)
              .map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q.text)}
                  className="bg-slate-900 hover:bg-slate-800 hover:border-blue-500 border border-slate-800 text-slate-300 rounded-full px-3 py-1.5 text-[10px] transition-all flex items-center gap-1 font-medium font-sans"
                >
                  💡 {q.text}
                </button>
              ))}
          </div>

          {/* Input Sender footer form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Tanyakan SiagaBot AI tentang mitigasi..."
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-blue-500 text-slate-100 rounded-xl px-3.5 py-2 text-xs outline-none transition"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-850 disabled:text-slate-500 text-white p-2 rounded-xl transition duration-200"
            >
              <Send className="w-4 h-4 fill-white" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
