"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const AppContext = createContext();

const defaultDiaries = [
  {
    id: "diary-1",
    date: "2026-05-24",
    bulletPoints: [
      "月曜日の会議が無事に終わってホッとした",
      "ランチに同僚とおいしいパスタを食べた",
      "夕方少し雨が降って傘を忘れて少し濡れた",
      "夜は早めに帰宅してゆっくりお風呂に入った"
    ],
    overallMood: "充実、夕方の雨だけちょっと残念"
  },
  {
    id: "diary-2",
    date: "2026-05-23",
    bulletPoints: [
      "朝寝坊してしまって少し焦った",
      "溜まっていた部屋の掃除をしてスッキリした",
      "ピコとだらだらおしゃべりして癒された"
    ],
    overallMood: "のんびり、リフレッシュできた一日"
  }
];

const defaultMessages = [
  {
    id: "m1",
    sender: "ai",
    character: "clara",
    content: "おかえりなさ〜い！今日も一日お疲れ様だよぉ。何か温かいものでも飲んでゆっくりしてねぇ。今日はどんな一日だった？",
    emotion: "normal",
    createdAt: new Date(Date.now() - 3600000).toISOString()
  }
];

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [character, setCharacter] = useState("clara");
  const [messages, setMessages] = useState([]);
  const [diaries, setDiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Load from localStorage on client side
  useEffect(() => {
    const storedUser = localStorage.getItem("pico_user");
    const storedChar = localStorage.getItem("pico_character") || "clara";
    const storedMessages = localStorage.getItem("pico_messages");
    const storedDiaries = localStorage.getItem("pico_diaries");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setCharacter(storedChar);
    setDiaries(storedDiaries ? JSON.parse(storedDiaries) : defaultDiaries);
    setMessages(storedMessages ? JSON.parse(storedMessages) : defaultMessages);
    setLoading(false);
  }, []);

  // Redirect logic if not logged in (skip on login page)
  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.push("/login");
    }
  }, [user, loading, pathname, router]);

  const login = (email, password, displayName = "ユーザー") => {
    const newUser = { email, name: displayName };
    setUser(newUser);
    localStorage.setItem("pico_user", JSON.stringify(newUser));
    router.push("/");
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("pico_user");
    router.push("/login");
  };

  const changeCharacter = (charName) => {
    setCharacter(charName);
    localStorage.setItem("pico_character", charName);
  };

  const updateProfileName = (newName) => {
    if (!user) return;
    const updatedUser = { ...user, name: newName };
    setUser(updatedUser);
    localStorage.setItem("pico_user", JSON.stringify(updatedUser));
  };

  const sendMessage = (text) => {
    if (!text.trim()) return;

    const userMsg = {
      id: `msg-user-${Date.now()}`,
      sender: "user",
      content: text,
      emotion: "normal",
      createdAt: new Date().toISOString()
    };

    const updatedChat = [...messages, userMsg];
    setMessages(updatedChat);
    localStorage.setItem("pico_messages", JSON.stringify(updatedChat));
    setIsTyping(true);

    // Simulate AI typing and response
    setTimeout(() => {
      setIsTyping(false);
      let reply = "";
      let emotion = "normal";

      // Simple keyword emotion matching
      const lowerText = text.toLowerCase();
      if (lowerText.includes("うれしい") || lowerText.includes("嬉しい") || lowerText.includes("やった") || lowerText.includes("楽し")) {
        emotion = "happy";
      } else if (lowerText.includes("悲しい") || lowerText.includes("泣") || lowerText.includes("つらい") || lowerText.includes("辛い") || lowerText.includes("だめ")) {
        emotion = "sad";
      } else if (lowerText.includes("つかれた") || lowerText.includes("疲れた") || lowerText.includes("ねむい") || lowerText.includes("眠い") || lowerText.includes("休む")) {
        emotion = "relaxed";
      } else if (lowerText.includes("腹立つ") || lowerText.includes("怒") || lowerText.includes("むかつく") || lowerText.includes("ムカつく") || lowerText.includes("イライラ") || lowerText.includes("最悪")) {
        emotion = "angry";
      }

      // Generate response based on selected character (which is the active skin)
      if (character === "clara") {
        if (emotion === "happy") {
          reply = `わぁ、それは私まで嬉しくなっちゃうよぉ！よかったねぇ。もっとそのお話聞かせてほしいなぁ。`;
        } else if (emotion === "sad") {
          reply = `うぅ、それは悲しかったねぇ…。つらかったね。よしよし、私がずっとお話聞くからね。無理しないでねぇ。`;
        } else if (emotion === "relaxed") {
          reply = `はぁ〜、今日もいっぱい頑張ったから疲れちゃったよねぇ。お布団に入って、だらだらしちゃおぉ。`;
        } else if (emotion === "angry") {
          reply = `えぇっ、それはひどいよぉ！むかむかしちゃうねぇ。よしよし、くららが代わりにぷんぷんしとくねぇ。いっぱい怒っていいからねぇ。`;
        } else {
          reply = `ふむふむ、そうなんだねぇ。そういう日もあるよねぇ。いつも一生懸命で、えらいなぁって思うよぉ。`;
        }
      } else if (character === "maro") {
        if (emotion === "happy") {
          reply = `へえ、いいじゃん。楽しそうで何より。お祝いにマシュマロ食べる？まあ私のだけど。`;
        } else if (emotion === "sad") {
          reply = `それはちょっと凹むね…。世の中理不尽なことばっかりだし。まあ、今日はもう諦めて寝ちゃお？ね？`;
        } else if (emotion === "relaxed") {
          reply = `お疲れ〜。私も常に疲れてるからわかる。充電切れる前にだらだらしなよ。がんばるの禁止。`;
        } else if (emotion === "angry") {
          reply = `うわぁ、それは腹立つね。世の中めんどくさい奴多すぎじゃん？まあそいつのことはゴミ箱にポイして寝ちゃおう。`;
        } else {
          reply = `なるほどね。まあボチボチでいいんじゃない？適当に生きるのが一番楽だしさ。`;
        }
      } else { // frederica
        if (emotion === "happy") {
          reply = `サイコーじゃん！！めっちゃテンション上がる！私もトゲトゲしちゃうくらい嬉しいよ！イェーイ！`;
        } else if (emotion === "sad") {
          reply = `えっ、そんなことがあったの！？許せない！でも大丈夫、次は絶対うまくいくよ！私が全力でパワー送るからね！！`;
        } else if (emotion === "relaxed") {
          reply = `ふぅー！疲れたときは深呼吸！スー、ハー！よく頑張った自分をハグしてあげよう！えらいぞ！`;
        } else if (emotion === "angry") {
          reply = `何それ！めっちゃ腹立つじゃん！！許せない！よし、私が代わりにサボテンパンチしてあげる！フンッ！フンッ！`;
        } else {
          reply = `なるほどなるほど！そういうこともあるよね！何があっても私は君の味方だし、全力で応援してるよ！`;
        }
      }

      const aiMsg = {
        id: `msg-ai-${Date.now()}`,
        sender: "ai",
        character: character, // Store which character replied
        content: reply,
        emotion: emotion,
        createdAt: new Date().toISOString()
      };

      const finalChat = [...updatedChat, aiMsg];
      setMessages(finalChat);
      localStorage.setItem("pico_messages", JSON.stringify(finalChat));
    }, 1000);
  };

  const createDiaryFromChat = () => {
    const userLines = messages
      .filter((m) => m.sender === "user")
      .map((m) => m.content);

    if (userLines.length === 0) {
      alert("今日はまだ会話がありません。日記を作るには会話をしてみてね！");
      return;
    }

    // Mock summarizer logic for preview
    const today = new Date().toISOString().split("T")[0];
    
    // Check if we already have a diary for today
    const existingIndex = diaries.findIndex((d) => d.date === today);

    // Simple keyword extraction for mock bullet points
    const bulletPoints = [];
    userLines.forEach((line) => {
      if (line.length > 5) {
        bulletPoints.push(line.length > 30 ? line.substring(0, 30) + "..." : line);
      }
    });

    if (bulletPoints.length === 0) {
      bulletPoints.push("AIとおしゃべりをした");
    }

    const overallMood = userLines.some(l => l.includes("腹立つ") || l.includes("怒") || l.includes("むかつく") || l.includes("イライラ") || l.includes("最悪"))
      ? "モヤモヤ・おこ"
      : userLines.some(l => l.includes("疲") || l.includes("眠")) 
        ? "少し疲れ気味" 
        : userLines.some(l => l.includes("嬉") || l.includes("楽") || l.includes("よかっ"))
          ? "ハッピーな一日" 
          : "穏やかな一日";

    const newDiary = {
      id: `diary-${Date.now()}`,
      date: today,
      bulletPoints: bulletPoints.slice(0, 4), // limit to 4
      overallMood
    };

    let updatedDiaries;
    if (existingIndex >= 0) {
      updatedDiaries = [...diaries];
      updatedDiaries[existingIndex] = newDiary;
    } else {
      updatedDiaries = [newDiary, ...diaries];
    }

    setDiaries(updatedDiaries);
    localStorage.setItem("pico_diaries", JSON.stringify(updatedDiaries));
    router.push("/diary");
  };

  const clearCurrentChat = () => {
    const clearedMessages = [
      {
        id: `msg-init-${Date.now()}`,
        sender: "ai",
        character: character,
        content: character === "clara" 
          ? "新しくおしゃべりしよぉ！今日は何をお話しするぅ？" 
          : character === "maro" 
            ? "リセット完了。新しい話、付き合うよ。" 
            : "心機一転！新しい会話スタート！何から話す？",
        emotion: "normal",
        createdAt: new Date().toISOString()
      }
    ];
    setMessages(clearedMessages);
    localStorage.setItem("pico_messages", JSON.stringify(clearedMessages));
  };

  return (
    <AppContext.Provider
      value={{
        user,
        character,
        messages,
        diaries,
        loading,
        isTyping,
        login,
        logout,
        changeCharacter,
        updateProfileName,
        sendMessage,
        createDiaryFromChat,
        clearCurrentChat
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
