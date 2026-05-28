"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useApp } from "@/context/AppContext";
import NavBar from "@/components/NavBar";

export default function ChatPage() {
  const {
    character,
    messages,
    sendMessage,
    createDiaryFromChat,
    clearCurrentChat,
    isTyping,
  } = useApp();
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "ja-JP";

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = (e) => {
        console.error("Speech recognition error:", e);
        setIsListening(false);
      };

      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        if (transcript) {
          setInputText((prev) => prev + transcript);
        }
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("お使いのブラウザは音声認識に対応していません。Chrome等でお試しください。");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  // Character theme mapping
  const charConfigs = {
    clara: {
      name: "くらら",
      avatar: "/clara.png",
      headerBg: "bg-sky-100/80 border-sky-200",
      inputFocus: "focus:ring-sky-400",
      btnBg: "bg-sky-500 hover:bg-sky-600",
    },
    maro: {
      name: "まろ",
      avatar: "/maro.png",
      headerBg: "bg-amber-100/80 border-amber-200",
      inputFocus: "focus:ring-amber-400",
      btnBg: "bg-amber-500 hover:bg-amber-600",
    },
    frederica: {
      name: "フレデリカ",
      avatar: "/frederica.png",
      headerBg: "bg-emerald-100/80 border-emerald-200",
      inputFocus: "focus:ring-emerald-400",
      btnBg: "bg-emerald-500 hover:bg-emerald-600",
    },
  };

  const config = charConfigs[character] || charConfigs.clara;

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText("");
  };

  // Get the last emotion from the AI messages to show on the floating mascot
  const getLastAiEmotion = () => {
    const aiMsgs = messages.filter((m) => m.sender === "ai");
    if (aiMsgs.length === 0) return "normal";
    return aiMsgs[aiMsgs.length - 1].emotion || "normal";
  };

  const lastEmotion = getLastAiEmotion();

  // Helper to render emotion overlays/animations
  const getEmotionEffects = (emotion) => {
    switch (emotion) {
      case "happy":
        return {
          emoji: "✨🥰✨",
          animation: "animate-bounce",
          style: "ring-4 ring-pink-300",
          text: "嬉しそう！",
        };
      case "sad":
        return {
          emoji: "💧🥺💧",
          animation: "animate-pulse rotate-3",
          style: "ring-4 ring-blue-300 filter grayscale-[20%]",
          text: "しんぱいそう",
        };
      case "relaxed":
        return {
          emoji: "💤🥱💤",
          animation: "animate-float scale-95",
          style: "ring-4 ring-amber-300",
          text: "だら〜ん",
        };
      case "angry":
        return {
          emoji: "💢😡💢",
          animation: "animate-bounce scale-105",
          style: "ring-4 ring-rose-400 bg-rose-50/50",
          text: "ぷんぷん！",
        };
      default:
        return {
          emoji: "💬",
          animation: "animate-float",
          style: "ring-4 ring-slate-100",
          text: "おしゃべり中",
        };
    }
  };

  const emotionEffect = getEmotionEffects(lastEmotion);

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-slate-50">
      {/* Dynamic Character Header */}
      <header
        className={`px-4 py-3 flex items-center justify-between border-b bg-white/80 backdrop-blur-md relative z-10 ${config.headerBg}`}
      >
        <div className="flex items-center gap-3">
          {/* Reactive Mascot Avatar */}
          <div
            className={`relative w-12 h-12 rounded-full bg-white flex items-center justify-center p-1 shadow-md transition-all duration-300 ${emotionEffect.style} ${emotionEffect.animation}`}
          >
            <Image
              src={config.avatar}
              alt={config.name}
              width={40}
              height={40}
              className="object-contain"
            />
            {/* Emotion emoji indicator */}
            <span className="absolute -bottom-1.5 -right-1.5 text-xs bg-white rounded-full px-1 py-0.2 shadow-sm border border-slate-100 font-bold">
              {lastEmotion === "happy" && "💖"}
              {lastEmotion === "sad" && "💧"}
              {lastEmotion === "relaxed" && "💤"}
              {lastEmotion === "angry" && "💢"}
              {lastEmotion === "normal" && "💬"}
            </span>
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              {config.name}
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping inline-block" />
            </h2>
            <p className="text-[10px] text-slate-500 font-semibold">
              {emotionEffect.text}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={clearCurrentChat}
            title="会話をリセット"
            className="p-2 rounded-2xl hover:bg-slate-100 text-slate-400 active:scale-95 transition-all focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
          </button>

          <button
            onClick={createDiaryFromChat}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-2xl transition-all shadow-md active:scale-95 hover:shadow-lg focus:outline-none"
          >
            日記をまとめる
          </button>
        </div>
      </header>

      {/* Message area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-gradient-to-b from-indigo-50/20 via-white to-slate-50/50">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          const msgCharConfig = !isUser ? (charConfigs[msg.character] || config) : null;
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"} items-end gap-2 animate-fade-in`}
            >
              {/* Show small AI avatar beside bubble */}
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-0.5 border border-slate-100 shadow-sm flex-shrink-0 mb-1" title={msgCharConfig.name}>
                  <Image
                    src={msgCharConfig.avatar}
                    alt={msgCharConfig.name}
                    width={26}
                    height={26}
                    className="object-contain"
                  />
                </div>
              )}

              <div
                className={`max-w-[75%] px-4 py-3 rounded-3xl shadow-sm text-sm leading-relaxed ${
                  isUser
                    ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-br-none"
                    : "bg-white border border-slate-100 text-slate-700 rounded-bl-none"
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        
        {/* AI Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start items-end gap-2 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-0.5 border border-slate-100 shadow-sm flex-shrink-0 mb-1" title={config.name}>
              <Image
                src={config.avatar}
                alt={config.name}
                width={26}
                height={26}
                className="object-contain"
              />
            </div>
            <div className="bg-white border border-slate-100 px-4 py-3 rounded-3xl rounded-bl-none shadow-sm text-sm text-slate-400 flex items-center gap-1.5 min-h-[44px]">
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 bg-white/95 border-t border-slate-100 relative z-10 flex flex-col gap-2">
        <form onSubmit={handleSend} className="flex gap-2 items-center">
          {/* Speech Mic Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`w-11 h-11 border rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-95 ${
              isListening
                ? "bg-rose-500 border-rose-500 text-white animate-pulse"
                : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100 hover:text-indigo-500"
            }`}
            title={isListening ? "聞き取り中...（クリックで停止）" : "音声で入力する"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
              />
            </svg>
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isTyping ? `${config.name}が考え中だよ...` : `${config.name}に話しかける...`}
            disabled={isTyping}
            className={`flex-1 px-4 py-3 rounded-full border border-slate-200 text-sm focus:outline-none focus:ring-2 ${config.inputFocus} transition-all ${isTyping ? 'bg-slate-50 text-slate-400' : 'bg-white'}`}
          />

          {/* Send Button */}
          <button
            type="submit"
            className={`w-11 h-11 text-white rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer ${config.btnBg} ${(!inputText.trim() || isTyping) ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!inputText.trim() || isTyping}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5 translate-x-[1px]"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
              />
            </svg>
          </button>
        </form>
      </div>

      <NavBar />
    </div>
  );
}
