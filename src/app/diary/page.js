"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import NavBar from "@/components/NavBar";

export default function DiaryPage() {
  const { diaries } = useApp();
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Helper to color-code moods
  const getMoodBadgeColor = (mood) => {
    if (!mood) return "bg-slate-100 text-slate-600";
    
    const moodStr = mood.toLowerCase();
    if (moodStr.includes("ハグ") || moodStr.includes("ハッピー") || moodStr.includes("充実")) {
      return "bg-pink-50 text-pink-700 border-pink-100";
    }
    if (moodStr.includes("疲れ") || moodStr.includes("残念") || moodStr.includes("悲")) {
      return "bg-blue-50 text-blue-700 border-blue-100";
    }
    if (moodStr.includes("のんびり") || moodStr.includes("穏やか") || moodStr.includes("リフレッシュ")) {
      return "bg-amber-50 text-amber-700 border-amber-100";
    }
    return "bg-slate-50 text-slate-700 border-slate-150";
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-slate-50">
      
      {/* Header */}
      <header className="px-6 py-4 bg-white border-b border-slate-100 relative z-10 flex justify-between items-center">
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">おしゃべりの記録</p>
          <h1 className="text-lg font-bold text-slate-800">ピコ日記</h1>
        </div>
        <span className="text-2xl">📓</span>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-gradient-to-b from-slate-50 to-indigo-50/20">
        
        {diaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-6 bg-white/60 backdrop-blur-md border border-slate-200/50 rounded-3xl">
            <span className="text-4xl mb-3">💬</span>
            <h3 className="text-sm font-bold text-slate-700">まだ日記がありません</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              チャット画面でピコとおしゃべりしたあとに「日記をまとめる」ボタンを押すと、ここに自動生成された日記が追加されます！
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[10px] text-slate-400 font-semibold px-1">
              ※カードをタップすると展開できます
            </p>
            {diaries.map((diary) => {
              const isExpanded = expandedId === diary.id;
              return (
                <div
                  key={diary.id}
                  onClick={() => toggleExpand(diary.id)}
                  className={`bg-white rounded-3xl border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer overflow-hidden ${
                    isExpanded ? "ring-2 ring-indigo-500/20 scale-[1.01]" : ""
                  }`}
                >
                  <div className="p-4 flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-400 font-sans">
                        {diary.date}
                      </span>
                      <span className="text-sm font-bold text-slate-700 mt-0.5">
                        {diary.bulletPoints[0] || "AIとおしゃべりした"}...
                      </span>
                    </div>

                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${getMoodBadgeColor(
                        diary.overallMood
                      )}`}
                    >
                      {diary.overallMood}
                    </span>
                  </div>

                  {/* Expanded bullet list */}
                  <div
                    className={`transition-all duration-300 ease-in-out bg-slate-50/40 border-t border-slate-50 overflow-hidden ${
                      isExpanded ? "max-h-[300px] p-4" : "max-h-0"
                    }`}
                  >
                    <ul className="space-y-2 list-disc ml-5 text-xs text-slate-600 leading-relaxed font-medium">
                      {diary.bulletPoints.map((bp, index) => (
                        <li key={index}>{bp}</li>
                      ))}
                    </ul>
                    
                    <div className="mt-3 pt-3 border-t border-slate-200/40 flex justify-between items-center text-[10px] text-slate-400">
                      <span>保存先: Supabase DB</span>
                      <span className="text-indigo-500 font-bold hover:underline">閉じる</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      <NavBar />
    </div>
  );
}
