"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useApp } from "@/context/AppContext";
import NavBar from "@/components/NavBar";
import { supabase } from "@/lib/supabase";

export default function ChatPage() {
  const { character, messages, sendMessage, saveDiaryDirect, clearCurrentChat, isAiTyping, getTokyoDateStr } = useApp();
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  
  // History toggle
  const [showAllHistory, setShowAllHistory] = useState(false);
  
  // Diary preview modal states
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewBullets, setPreviewBullets] = useState([]);
  const [previewMood, setPreviewMood] = useState("normal");
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  
  const todayStr = getTokyoDateStr();
  const todayMessages = messages.filter(m => getTokyoDateStr(m.created_at) === todayStr);
  const displayedMessages = showAllHistory ? messages : todayMessages;
  const hasHistoryBeforeToday = messages.length > todayMessages.length;

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-grow textarea height based on content wrapping
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  // Character theme mapping
  const charConfigs = {
    clara: {
      name: "くらら",
      avatar: "/clara.png",
      headerBg: "bg-sky-100/80 border-sky-200",
      inputFocus: "focus:ring-sky-400",
      btnBg: "bg-sky-500 hover:bg-sky-600"
    },
    maro: {
      name: "まろ",
      avatar: "/maro.png",
      headerBg: "bg-amber-100/80 border-amber-200",
      inputFocus: "focus:ring-amber-400",
      btnBg: "bg-amber-500 hover:bg-amber-600"
    },
    frederica: {
      name: "フレデリカ",
      avatar: "/frederica.png",
      headerBg: "bg-emerald-100/80 border-emerald-200",
      inputFocus: "focus:ring-emerald-400",
      btnBg: "bg-emerald-500 hover:bg-emerald-600"
    }
  };

  const config = charConfigs[character] || charConfigs.clara;

  // Initialize webkitSpeechRecognition for voice typing
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.lang = "ja-JP";
        rec.interimResults = false;

        rec.onstart = () => {
          setIsListening(true);
        };

        rec.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInputText((prev) => prev + transcript);
        };

        rec.onerror = (e) => {
          console.error("Speech recognition error:", e);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("お使いのブラウザは音声入力に対応していません。Chrome、Safari、Edgeなどでお試しください。");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiTyping]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      if (inputText.trim()) {
        sendMessage(inputText);
        setInputText("");
      }
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText("");
  };

  const handleSummarizeClick = async () => {
    if (todayMessages.length === 0) {
      alert(`今日（${todayStr}）はまだ会話履歴がありません。おしゃべりをしてみてね！`);
      return;
    }

    setIsGeneratingPreview(true);
    setShowPreviewModal(true);
    setPreviewBullets([]);
    setPreviewMood("normal");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch("/api/diary", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ messages: todayMessages })
      });

      if (!response.ok) {
        throw new Error("要約の生成に失敗しました");
      }

      const data = await response.json();
      setPreviewBullets(data.bullet_points || []);
      setPreviewMood(data.overall_mood || "normal");
    } catch (e) {
      console.error(e);
      alert("日記の要約の生成中にエラーが発生しました。しばらく待ってから再度お試しください。");
      setShowPreviewModal(false);
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleRegeneratePreview = async () => {
    setIsGeneratingPreview(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch("/api/diary", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ messages: todayMessages })
      });

      if (!response.ok) {
        throw new Error("再生成に失敗しました");
      }

      const data = await response.json();
      setPreviewBullets(data.bullet_points || []);
      setPreviewMood(data.overall_mood || "normal");
    } catch (e) {
      console.error(e);
      alert("日記の再生成中にエラーが発生しました。しばらく待ってから再度お試しください。");
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleSaveDiary = async () => {
    try {
      await saveDiaryDirect(todayStr, previewBullets, previewMood);
      setShowPreviewModal(false);
    } catch (e) {
      console.error(e);
    }
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
          text: "嬉しそう！"
        };
      case "sad":
        return {
          emoji: "💧🥺💧",
          animation: "animate-pulse rotate-3",
          style: "ring-4 ring-blue-300 filter grayscale-[20%]",
          text: "しんぱいそう"
        };
      case "relaxed":
        return {
          emoji: "💤🥱💤",
          animation: "animate-float scale-95",
          style: "ring-4 ring-amber-300",
          text: "だら〜ん"
        };
      case "angry":
        return {
          emoji: "💢😡💢",
          animation: "animate-bounce scale-105",
          style: "ring-4 ring-rose-400 bg-rose-50/50",
          text: "ぷんぷん！"
        };
      default:
        return {
          emoji: "💬",
          animation: "animate-float",
          style: "ring-4 ring-slate-100",
          text: "おしゃべり中"
        };
    }
  };

  const emotionEffect = getEmotionEffects(lastEmotion);

  // Helper to get historical character avatar
  const getHistoricalAvatar = (msgChar) => {
    if (msgChar === "maro") return "/maro.png";
    if (msgChar === "frederica") return "/frederica.png";
    return "/clara.png"; // fallback/default to clara
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-slate-50">

      {/* Dynamic Character Header */}
      <header className={`px-4 py-3 flex items-center justify-between border-b bg-white/80 backdrop-blur-md relative z-10 ${config.headerBg}`}>
        <div className="flex items-center gap-3">
          {/* Reactive Mascot Avatar */}
          <div className={`relative w-12 h-12 rounded-full bg-white flex items-center justify-center p-1 shadow-md transition-all duration-300 ${emotionEffect.style} ${emotionEffect.animation}`}>
            <Image
              src={config.avatar}
              alt={config.name}
              width={40}
              height={40}
              className="object-contain w-full h-full"
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
            <p className="text-[10px] text-slate-500 font-semibold">{emotionEffect.text}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={clearCurrentChat}
            title="会話をリセット"
            className="p-2 rounded-2xl hover:bg-slate-100 text-slate-400 active:scale-95 transition-all focus:outline-none cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>

          <button
            onClick={handleSummarizeClick}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-2xl transition-all shadow-md active:scale-95 hover:shadow-lg focus:outline-none cursor-pointer"
          >
            日記をまとめる
          </button>
        </div>
      </header>

      {/* Message area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-gradient-to-b from-indigo-50/20 via-white to-slate-50/50">
        {hasHistoryBeforeToday && !showAllHistory && (
          <div className="flex justify-center pb-2">
            <button
              onClick={() => setShowAllHistory(true)}
              className="text-xs text-indigo-500 hover:text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-bold px-4 py-2 rounded-2xl cursor-pointer active:scale-95 transition-all shadow-sm"
            >
              過去のメッセージを読み込む
            </button>
          </div>
        )}

        {displayedMessages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"} items-end gap-2 animate-fade-in`}
            >
              {/* Show historical AI avatar beside bubble based on msg.character */}
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-0.5 border border-slate-100 shadow-sm flex-shrink-0 mb-1">
                  <Image
                    src={getHistoricalAvatar(msg.character)}
                    alt="avatar"
                    width={26}
                    height={26}
                    className="object-contain w-full h-full"
                  />
                </div>
              )}

              <div
                className={`max-w-[75%] px-4 py-3 rounded-3xl shadow-sm text-sm leading-relaxed ${isUser
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
        {isAiTyping && (
          <div className="flex justify-start items-end gap-2 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-0.5 border border-slate-100 shadow-sm flex-shrink-0 mb-1">
              <Image
                src={config.avatar}
                alt={config.name}
                width={26}
                height={26}
                className="object-contain w-full h-full"
              />
            </div>
            <div className="bg-white border border-slate-100 px-4 py-3 rounded-3xl rounded-bl-none shadow-sm flex items-center gap-1 h-10">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
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
            className={`w-11 h-11 border rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-95 ${isListening
                ? "bg-rose-50 border-rose-300 text-rose-500 ring-2 ring-rose-500/20 animate-pulse"
                : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100 hover:text-indigo-500"
              }`}
            title={isListening ? "聞き取り中...（クリックで停止）" : "音声で入力"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
            </svg>
          </button>

          {/* Text Input (Textarea) */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "お話ししてください..." : `${config.name}に話しかける... (Enterで送信, Shift+Enterで改行)`}
            className={`flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 ${config.inputFocus} transition-all rounded-2xl resize-none max-h-32 min-h-[38px] overflow-y-auto leading-relaxed`}
            disabled={isListening}
          />

          {/* Send Button */}
          <button
            type="submit"
            className={`w-11 h-11 text-white rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer ${config.btnBg}`}
            disabled={!inputText.trim() || isListening}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 translate-x-[1px]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </button>
        </form>
      </div>

        {/* Diary Preview Modal */}
        {showPreviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[85vh] animate-scale-up">
              
              {/* Modal Header */}
              <header className="px-5 py-4 bg-indigo-50/50 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">日記のまとめ確認</span>
                  <h3 className="text-sm font-bold text-slate-800">今日（{todayStr}）の振り返り</h3>
                </div>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full cursor-pointer active:scale-95 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </header>

              {/* Modal Content */}
              <div className="p-5 overflow-y-auto flex-1 space-y-4">
                {isGeneratingPreview ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-3">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-slate-400 font-bold animate-pulse">AIが今日の日記をまとめています...</p>
                  </div>
                ) : (
                  <>
                    {/* Mood Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500">今日の気分（Mood）</label>
                      <select
                        value={previewMood}
                        onChange={(e) => setPreviewMood(e.target.value)}
                        className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-700 cursor-pointer"
                      >
                        <option value="happy">晴れやか 🥰</option>
                        <option value="normal">ふつう 🙂</option>
                        <option value="relaxed">のんびり 🥱</option>
                        <option value="sad">しょんぼり 🥺</option>
                        <option value="angry">ぷんぷん 😡</option>
                      </select>
                    </div>

                    {/* Bullet Points Editor */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-500">箇条書きのまとめ（編集できます）</label>
                        <button
                          onClick={() => setPreviewBullets([...previewBullets, ""])}
                          className="text-[10px] text-indigo-600 hover:text-indigo-700 font-bold bg-indigo-50 px-2 py-1 rounded-xl cursor-pointer"
                        >
                          ＋ 行を追加
                        </button>
                      </div>

                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {previewBullets.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-4">振り返りの箇条書きはありません。</p>
                        ) : (
                          previewBullets.map((bullet, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <input
                                type="text"
                                value={bullet}
                                onChange={(e) => {
                                  const next = [...previewBullets];
                                  next[idx] = e.target.value;
                                  setPreviewBullets(next);
                                }}
                                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium bg-slate-50/50"
                                placeholder="振り返りの箇条書きを入力..."
                              />
                              <button
                                onClick={() => setPreviewBullets(previewBullets.filter((_, i) => i !== idx))}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl cursor-pointer active:scale-95 transition-all flex-shrink-0"
                                title="この行を削除"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Actions */}
              <footer className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex gap-2 justify-end flex-shrink-0">
                <button
                  onClick={handleRegeneratePreview}
                  disabled={isGeneratingPreview}
                  className="flex-1 border-2 border-slate-200 hover:bg-slate-100 text-slate-500 font-bold text-xs py-2.5 rounded-2xl transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  再生成（リテイク）
                </button>
                <button
                  onClick={handleSaveDiary}
                  disabled={isGeneratingPreview || previewBullets.length === 0}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-2xl transition-all active:scale-98 shadow-md cursor-pointer disabled:opacity-50"
                >
                  この内容で保存
                </button>
              </footer>

            </div>
          </div>
        )}

        <NavBar />
      </div>
    );
  }
