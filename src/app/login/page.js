"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";

export default function LoginPage() {
  const { login } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("メールアドレスとパスワードを入力してください。");
      return;
    }
    // Simulate login
    login(email, password, name || "ユーザー");
  };

  return (
    <div className="flex flex-col flex-1 justify-center px-8 py-12 bg-gradient-to-b from-indigo-50/50 via-white to-pink-50/30">
      <div className="flex flex-col items-center mb-10">
        {/* Cute Mascot Group Icon */}
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center shadow-inner mb-4 relative overflow-hidden animate-bounce-gentle">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-200/50 to-pink-200/50" />
          <span className="text-4xl relative z-10">💬</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-wider text-slate-800 font-sans">
          ピコ <span className="text-indigo-600">Pico</span>
        </h1>
        <p className="text-sm text-slate-500 mt-2 text-center max-w-xs">
          話しかけるだけで、今日のあなたの本音がそっと日記になる。一人暮らしのAIパートナー。
        </p>
      </div>

      <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-slate-100">
        <h2 className="text-xl font-bold text-slate-700 mb-6 text-center">
          {isSignUp ? "新しくはじめる" : "おかえりなさい"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">
                お名前 (何て呼ばれたい？)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="たかし、ゆうこ、など"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-bold py-3 rounded-2xl transition-all shadow-md active:scale-98 text-sm mt-2"
          >
            {isSignUp ? "アカウント登録してはじめる" : "ログインしてはじめる"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-indigo-500 hover:underline font-semibold focus:outline-none"
          >
            {isSignUp
              ? "すでにアカウントをお持ちですか？ログインはこちら"
              : "はじめてのご利用ですか？新規登録はこちら"}
          </button>
        </div>
      </div>

      <div className="mt-8 text-center text-[10px] text-slate-400">
        © 2026 Pico AI Companion. All rights reserved.
      </div>
    </div>
  );
}
