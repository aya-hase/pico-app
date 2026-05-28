"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useApp } from "@/context/AppContext";
import NavBar from "@/components/NavBar";

export default function SettingsPage() {
  const { user, character, changeCharacter, updateProfileName, logout } = useApp();
  const [nameInput, setNameInput] = useState(user?.name || "");
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!user) return null;

  const handleSaveName = (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    updateProfileName(nameInput);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const characters = [
    {
      id: "clara",
      name: "くらら",
      type: "クラゲ",
      desc: "ゆるっとのんびり系、世話焼き。おっとり口調で日々の疲れを優しく包み込みます。",
      img: "/clara.png",
      borderColor: "border-sky-200",
      activeRing: "ring-sky-400 border-sky-400 bg-sky-50/30"
    },
    {
      id: "maro",
      name: "まろ",
      type: "マシュマロ",
      desc: "だらーん共感系、ちょっとシニカル。がんばりすぎない適当ライフを一緒に歩みます。",
      img: "/maro.png",
      borderColor: "border-amber-200",
      activeRing: "ring-amber-400 border-amber-400 bg-amber-50/20"
    },
    {
      id: "frederica",
      name: "フレデリカ",
      type: "サボテン",
      desc: "元気ポジティブ系、応援団。何があっても全力応援！元気と元気をチャージします。",
      img: "/frederica.png",
      borderColor: "border-emerald-200",
      activeRing: "ring-emerald-400 border-emerald-400 bg-emerald-50/20"
    }
  ];

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-slate-50">
      
      {/* Header */}
      <header className="px-6 py-4 bg-white border-b border-slate-100 relative z-10">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-sans">各種設定</p>
        <h1 className="text-lg font-bold text-slate-800">ピコ設定</h1>
      </header>

      {/* Main settings content */}
      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-gradient-to-b from-slate-50 via-white to-pink-50/10">
        
        {/* Profile Name Edit */}
        <section className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-700">あなたのお名前</h3>
          <form onSubmit={handleSaveName} className="flex gap-2">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="flex-1 px-4 py-2 text-sm rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="呼び名を入力してください"
            />
            <button
              type="submit"
              className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-2xl transition-all shadow-sm active:scale-95 cursor-pointer flex-shrink-0"
            >
              変更
            </button>
          </form>
          {saveSuccess && (
            <p className="text-[10px] text-green-600 font-bold ml-1 animate-pulse">
              ✔ 名前を変更しました！
            </p>
          )}
        </section>

        {/* Character Selection */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-slate-700 px-1">パートナーを選択</h3>
          
          <div className="space-y-3">
            {characters.map((char) => {
              const isActive = character === char.id;
              return (
                <div
                  key={char.id}
                  onClick={() => changeCharacter(char.id)}
                  className={`bg-white p-4 rounded-3xl border transition-all duration-300 cursor-pointer flex gap-4 items-center relative overflow-hidden hover:shadow-md ${
                    isActive
                      ? `ring-2 ${char.activeRing} scale-[1.01]`
                      : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  {/* Mascot image */}
                  <div className="w-16 h-16 relative flex-shrink-0 flex items-center justify-center bg-slate-50 rounded-2xl p-1 shadow-inner">
                    <Image
                      src={char.img}
                      alt={char.name}
                      width={56}
                      height={56}
                      className="object-contain"
                    />
                  </div>

                  {/* Character description */}
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <h4 className="text-sm font-bold text-slate-800">{char.name}</h4>
                      <span className="text-[10px] text-slate-400 font-bold">{char.type}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-1 font-medium">
                      {char.desc}
                    </p>
                  </div>

                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute top-3 right-3 bg-indigo-600 text-white w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-2.5 h-2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Account Settings / Logout */}
        <section className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-700">アカウント情報</h3>
          
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-semibold">メールアドレス</span>
            <span className="text-slate-600 font-medium">{user.email}</span>
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
            <span className="text-xs text-slate-400 font-semibold">アプリバージョン</span>
            <span className="text-xs text-slate-400 font-mono">v0.1.0-mock</span>
          </div>

          <button
            onClick={logout}
            className="w-full border-2 border-rose-100 hover:bg-rose-50 text-rose-500 font-bold text-xs py-3 rounded-2xl transition-all active:scale-98 text-center cursor-pointer mt-2"
          >
            ログアウト
          </button>
        </section>

      </main>

      <NavBar />
    </div>
  );
}
