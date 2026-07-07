"use client";

import Image from "next/image";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import NavBar from "@/components/NavBar";

export default function HomePage() {
  const { user, profile, character, diaries, schedules } = useApp();

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

  // Filter today's schedules
  const todayStr = new Date().toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).replace(/\//g, "-");

  const todaySchedules = schedules.filter(s => s.event_date === todayStr);

  // Check if past reminder time
  const getReminderGreeting = () => {
    const now = new Date();
    let tokyoTimeStr = "";
    try {
      tokyoTimeStr = new Intl.DateTimeFormat("ja-JP", {
        timeZone: "Asia/Tokyo",
        hour: "numeric",
        minute: "numeric",
        hour12: false
      }).format(now);
    } catch (e) {
      // Fallback if Intl format fails
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      tokyoTimeStr = `${hours}:${minutes}`;
    }
    
    const [currentHour, currentMin] = tokyoTimeStr.split(":").map(Number);

    const reminderTime = profile?.reminder_time || "20:00";
    const [targetHour, targetMin] = reminderTime.split(":").map(Number);

    const isPastReminder = (currentHour > targetHour) || (currentHour === targetHour && currentMin >= targetMin);
    const hasTodayDiary = diaries.some(d => d.date === todayStr);

    if (isPastReminder && !hasTodayDiary) {
      const uName = profile?.display_name || "ユーザー";
      const scheduleText = todaySchedules.length > 0 ? `『${todaySchedules[0].event_name}』` : "今日の出来事";
      
      if (character === "clara") {
        return `${uName}ちゃん、お約束の${reminderTime}を過ぎたよぉ。${scheduleText}はどうだったかなぁ？くららにお話ししよぉ？`;
      } else if (character === "maro") {
        return `おつかれ〜。設定してた${reminderTime}過ぎてるよ。今日の${scheduleText}とか、そろそろダラダラ話そうよ。`;
      } else {
        return `${uName}さん！約束の${reminderTime}になったよ！今日の${scheduleText}のこと、早くフレデリカに教えてー！`;
      }
    }
    return null;
  };

  const reminderGreeting = getReminderGreeting();
  const displayGreeting = reminderGreeting || currentTheme.greeting;

  return (
    <div className={`flex flex-col flex-1 overflow-hidden bg-gradient-to-b ${currentTheme.bgColor}`}>
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center bg-white/40 backdrop-blur-md border-b border-slate-100 relative z-10">
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pico Partner</p>
          <h1 className="text-lg font-bold text-slate-800">
            {getPeriodGreeting()}
            <span className="text-indigo-600">{profile?.display_name || "ユーザー"}</span>さん
          </h1>
        </div>
        <Link href="/settings" className="w-9 h-9 rounded-full overflow-hidden border-2 border-indigo-400 bg-indigo-50 flex items-center justify-center cursor-pointer shadow-sm hover:scale-105 transition-transform">
          <Image
            src={currentTheme.img}
            alt={currentTheme.name}
            width={32}
            height={32}
            className="object-contain w-full h-full"
          />
        </Link>
      </header>

      {/* Main Scrollable Area */}
      <main className="flex-1 overflow-y-auto px-6 py-4 space-y-6 relative z-10">

        {/* Proactive Character Greeting Card */}
        <div className={`p-5 rounded-3xl border ${currentTheme.cardBg} shadow-lg relative overflow-hidden flex flex-col items-center text-center mt-2`}>
          <div className="absolute top-3 right-4">
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${currentTheme.tagColor}`}>
              {reminderGreeting ? "お約束の時間" : "話し相手"}
            </span>
          </div>

          {/* Floaty Mascot */}
          <div className="w-28 h-28 my-2 relative flex items-center justify-center animate-float">
            <Image
              src={currentTheme.img}
              alt={currentTheme.name}
              fill
              priority
              className="object-contain drop-shadow-md animate-float"
              sizes="(max-width: 768px) 100vw, 112px"
            />
          </div>

          <h2 className="text-xl font-bold text-slate-800">{currentTheme.name}</h2>
          <p className="text-xs text-slate-400 mb-3">{currentTheme.jpDesc}</p>

          <p className="text-sm font-medium leading-relaxed text-slate-700 px-2 mb-4 bg-white/60 p-3 rounded-2xl border border-white/40">
            「{displayGreeting}」
          </p>

          <Link
            href="/chat"
            className={`w-full py-3 text-white font-bold rounded-2xl transition-all shadow-md active:scale-98 text-sm text-center cursor-pointer ${currentTheme.btnBg}`}
          >
            {reminderGreeting ? "振り返りチャットをはじめる" : "おしゃべりをはじめる"}
          </Link>
        </div>

        {/* Today's Schedule Card */}
        {todaySchedules.length > 0 && (
          <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-slate-100 shadow-sm space-y-2">
            <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1.5 px-1 uppercase tracking-wider">
              📅 今日の予定
            </h3>
            <div className="space-y-2">
              {todaySchedules.map((sch) => (
                <div key={sch.id} className="flex items-center justify-between bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📍</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700">{sch.event_name}</span>
                      <span className="text-[10px] text-slate-400 font-mono font-medium">
                        {sch.event_time ? sch.event_time : "時間未指定"}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sch.is_followed_up ? "bg-slate-100 text-slate-400" : "bg-indigo-50 text-indigo-600 animate-pulse"
                    }`}>
                    {sch.is_followed_up ? "振り返り完了" : "未確認（会話で振り返る）"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

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

      <NavBar />
    </div>
  );
}
