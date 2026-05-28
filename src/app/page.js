"use client";

import Image from "next/image";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import NavBar from "@/components/NavBar";

export default function HomePage() {
  const { user, character, diaries } = useApp();

  // Guard loading state
  if (!user) return null;

  // Character theme configuration
  const charThemes = {
    clara: {
      name: "くらら",
      jpDesc: "クラゲ / ゆるっとのんびり・世話焼き",
      bgColor: "from-sky-100/50 via-sky-50/30 to-indigo-50/30",
      cardBg: "bg-sky-50/60 border-sky-100/60 text-sky-900",
      tagColor: "bg-sky-100 text-sky-800",
      btnBg: "bg-gradient-to-r from-sky-400 to-indigo-400 hover:from-sky-500 hover:to-indigo-500",
      greeting: "のんびりしようよぉ。今日もお疲れ様だよぉ。何か温かいものでも飲みながら、今日のことおしゃべりしよぉ？",
      img: "/clara.png"
    },
    maro: {
      name: "まろ",
      jpDesc: "マシュマロ / だらーん共感系・シニカル",
      bgColor: "from-amber-100/40 via-amber-50/20 to-orange-50/20",
      cardBg: "bg-amber-50/60 border-amber-100/50 text-amber-900",
      tagColor: "bg-amber-100 text-amber-800",
      btnBg: "bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500",
      greeting: "おつかれ〜。まあ、今日もいろいろあったよね。がんばりすぎないのが一番だよ。だらだらしながらお喋りしよ。",
      img: "/maro.png"
    },
    frederica: {
      name: "フレデリカ",
      jpDesc: "サボテン / 元気ポジティブ・応援団",
      bgColor: "from-emerald-100/40 via-emerald-50/20 to-green-50/20",
      cardBg: "bg-emerald-50/60 border-emerald-100/50 text-emerald-900",
      tagColor: "bg-emerald-100 text-emerald-800",
      btnBg: "bg-gradient-to-r from-emerald-400 to-green-400 hover:from-emerald-500 hover:to-green-500",
      greeting: "おかえりーーー！！今日も素晴らしい1日だったね！お話ししてハッピーパワーをもっとチャージしちゃおう！イェイ！",
      img: "/frederica.png"
    }
  };

  const currentTheme = charThemes[character] || charThemes.clara;

  // Simple time-based greeting for the header
  const getPeriodGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "おはようございます、";
    if (hours < 18) return "こんにちは、";
    return "お疲れ様です、";
  };

  return (
    <div className={`flex flex-col flex-1 overflow-hidden bg-gradient-to-b ${currentTheme.bgColor}`}>
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center bg-white/40 backdrop-blur-md border-b border-slate-100 relative z-10">
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pico Partner</p>
          <h1 className="text-lg font-bold text-slate-800">
            {getPeriodGreeting()}
            <span className="text-indigo-600">{user.name}</span>さん
          </h1>
        </div>
        <Link href="/settings" className="w-9 h-9 rounded-full overflow-hidden border-2 border-indigo-400 bg-indigo-50 flex items-center justify-center cursor-pointer shadow-sm hover:scale-105 transition-transform">
          <Image
            src={currentTheme.img}
            alt={currentTheme.name}
            width={32}
            height={32}
            className="object-contain"
          />
        </Link>
      </header>

      {/* Main Scrollable Area */}
      <main className="flex-1 overflow-y-auto px-6 py-4 space-y-6 relative z-10">
        
        {/* Proactive Character Greeting Card */}
        <div className={`p-5 rounded-3xl border ${currentTheme.cardBg} shadow-lg relative overflow-hidden flex flex-col items-center text-center mt-2`}>
          <div className="absolute top-3 right-4">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${currentTheme.tagColor}`}>
              話し相手
            </span>
          </div>

          {/* Floaty Mascot */}
          <div className="w-28 h-28 my-2 relative flex items-center justify-center animate-float">
            <Image
              src={currentTheme.img}
              alt={currentTheme.name}
              fill
              priority
              className="object-contain drop-shadow-md"
            />
          </div>

          <h2 className="text-xl font-bold text-slate-800">{currentTheme.name}</h2>
          <p className="text-xs text-slate-400 mb-3">{currentTheme.jpDesc}</p>
          
          <p className="text-sm font-medium leading-relaxed text-slate-700 px-2 mb-4 bg-white/60 p-3 rounded-2xl border border-white/40">
            「{currentTheme.greeting}」
          </p>

          <Link
            href="/chat"
            className={`w-full py-3 text-white font-bold rounded-2xl transition-all shadow-md active:scale-98 text-sm text-center ${currentTheme.btnBg}`}
          >
            おしゃべりをはじめる
          </Link>
        </div>

        {/* Recent Diaries Section */}
        <div>
          <div className="flex justify-between items-center mb-3 px-1">
            <h3 className="text-sm font-bold text-slate-700">最近の日記（自動生成）</h3>
            <Link href="/diary" className="text-xs text-indigo-500 hover:underline font-semibold">
              すべて見る
            </Link>
          </div>

          {diaries.length === 0 ? (
            <div className="bg-white/50 backdrop-blur-sm p-6 rounded-3xl border border-slate-200/50 text-center text-xs text-slate-400">
              まだ日記がありません。まずはピコとおしゃべりしてみよう！
            </div>
          ) : (
            <div className="space-y-3">
              {diaries.slice(0, 2).map((diary) => (
                <div
                  key={diary.id}
                  className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-100/50">
                    <span className="text-xs font-bold text-slate-500 font-sans">
                      {diary.date}
                    </span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                      心情: {diary.overallMood}
                    </span>
                  </div>
                  <ul className="space-y-1 ml-4 list-disc text-xs text-slate-600">
                    {diary.bulletPoints.map((bp, i) => (
                      <li key={i} className="leading-relaxed">{bp}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* Navigation bar */}
      <NavBar />
    </div>
  );
}
