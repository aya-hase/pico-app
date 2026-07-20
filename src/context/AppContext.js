"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [character, setCharacter] = useState("clara");
  const [messages, setMessages] = useState([]);
  const [diaries, setDiaries] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [todayFollowUpSchedule, setTodayFollowUpSchedule] = useState(null);

  const router = useRouter();
  const pathname = usePathname();

  // 1. Cleans legacy localStorage mockup cache to prevent crashes (Type error: messages.filter is not a function)
  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem("pico_messages");
      const storedDiaries = localStorage.getItem("pico_diaries");

      // If the stored messages are formatted as an object (clara: [...], maro: [...]), delete them
      if (storedMessages && !Array.isArray(JSON.parse(storedMessages))) {
        localStorage.removeItem("pico_messages");
      }
      // Clean diaries if they aren't formatted as an array
      if (storedDiaries && !Array.isArray(JSON.parse(storedDiaries))) {
        localStorage.removeItem("pico_diaries");
      }
    } catch (e) {
      console.error("Error cleaning legacy cache:", e);
      localStorage.removeItem("pico_messages");
      localStorage.removeItem("pico_diaries");
    }
  }, []);

  // 2. Auth state subscription
  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchUserData(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // Listen to changes in auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
        fetchUserData(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setMessages([]);
        setDiaries([]);
        setSchedules([]);
        setTodayFollowUpSchedule(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3. Page redirection if not logged in
  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.push("/login");
    }
  }, [user, loading, pathname, router]);

  // 4. Fetch all user records from Supabase DB
  const fetchUserData = async (userId) => {
    try {
      setLoading(true);

      // Fetch profile settings
      let { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      // Create a default profile if it doesn't exist yet
      if (profileError && profileError.code === "PGRST116") {
        const { data: newProfile, error: insError } = await supabase
          .from("profiles")
          .insert([{ id: userId, display_name: "ユーザー", selected_character: "clara" }])
          .select()
          .single();
        if (!insError) profileData = newProfile;
      }

      if (profileData) {
        setProfile(profileData);
        setCharacter(profileData.selected_character);
      }

      // Fetch chats (shared thread)
      const { data: chatsData } = await supabase
        .from("chats")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      setMessages(chatsData || []);

      // Fetch diaries
      const { data: diariesData } = await supabase
        .from("diaries")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false });

      const formattedDiaries = (diariesData || []).map(d => ({
        id: d.id,
        date: d.date,
        bulletPoints: d.bullet_points,
        overallMood: d.overall_mood
      }));
      setDiaries(formattedDiaries);

      // Fetch schedules
      const { data: schedulesData } = await supabase
        .from("schedules")
        .select("*")
        .eq("user_id", userId)
        .order("event_date", { ascending: true });
      setSchedules(schedulesData || []);

      // Check if there is an unfulfilled schedule today to ask about (follow-up)
      const todayStr = new Date().toLocaleDateString("ja-JP", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).replace(/\//g, "-"); // Format as YYYY-MM-DD

      const followUp = (schedulesData || []).find(
        (s) => s.event_date === todayStr && !s.is_followed_up
      );
      if (followUp) {
        setTodayFollowUpSchedule(followUp);
      }

    } catch (e) {
      console.error("Error loading Supabase data:", e);
    } finally {
      setLoading(false);
    }
  };

  const getTokyoDateStr = (dateInput) => {
    const date = dateInput ? new Date(dateInput) : new Date();
    return date.toLocaleDateString("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).replace(/\//g, "-");
  };

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert("ログインに失敗しました。メールアドレスまたはパスワードが間違っています。");
      return false;
    }
    router.push("/");
    return true;
  };

  const signup = async (email, password, displayName = "ユーザー") => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName
        }
      }
    });

    if (error) {
      alert("アカウント登録に失敗しました。入力内容を確認するか、別のメールアドレスをお試しください。");
      return false;
    }

    alert("サインアップが完了しました！自動ログインします。");
    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const changeCharacter = async (charName) => {
    setCharacter(charName);
    if (user) {
      await supabase
        .from("profiles")
        .update({ selected_character: charName })
        .eq("id", user.id);

      // Update local profile state
      setProfile(prev => prev ? { ...prev, selected_character: charName } : null);
    }
  };

  const updateProfileName = async (newName) => {
    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: newName })
        .eq("id", user.id);

      if (!error) {
        setProfile(prev => prev ? { ...prev, display_name: newName } : null);
      } else {
        alert("名前の更新に失敗しました。しばらく待ってから再度お試しください。");
      }
    }
  };

  const updateReminderTime = async (time) => {
    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({ reminder_time: time })
        .eq("id", user.id);

      if (!error) {
        setProfile(prev => prev ? { ...prev, reminder_time: time } : null);
      } else {
        alert("お知らせ時間の更新に失敗しました。しばらく待ってから再度お試しください。");
      }
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim() || !user) return;

    // 1. Save user message to Supabase
    const userMsg = {
      user_id: user.id,
      sender: "user",
      character: "user",
      content: text,
      emotion: "normal"
    };

    const { data: savedUserMsg, error: userMsgErr } = await supabase
      .from("chats")
      .insert([userMsg])
      .select()
      .single();

    if (userMsgErr) {
      console.error("Failed to save user message:", userMsgErr);
      return;
    }

    // Update local chat logs
    setMessages(prev => [...prev, savedUserMsg]);
    setIsAiTyping(true);

    try {
      // 2. Build history payload for Gemini (limit to last 20 messages to avoid token burden)
      const recentMessages = messages.slice(-20);
      const chatHistory = recentMessages.map(m => ({
        sender: m.sender,
        content: m.content,
        emotion: m.emotion,
        character: m.character
      }));

      // Gather schedule followups if any
      const todaySchedules = [];
      if (todayFollowUpSchedule) {
        todaySchedules.push({
          id: todayFollowUpSchedule.id,
          event_name: todayFollowUpSchedule.event_name,
          event_date: todayFollowUpSchedule.event_date,
          event_time: todayFollowUpSchedule.event_time
        });
      }

      // Get the last 7 diaries for context memory (covers a full week)
      const recentDiaries = diaries.slice(0, 7).map(d => ({
        date: d.date,
        bulletPoints: d.bulletPoints,
        mood: d.overallMood
      }));

      // Get the Supabase Auth session token to authorize the API route call
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // 3. Request Gemini API route
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          message: text,
          chatHistory,
          character,
          userName: profile?.display_name || "ユーザー",
          todaySchedules,
          recentDiaries
        })
      });

      if (!response.ok) {
        throw new Error("Chat API failed with status " + response.status);
      }

      const data = await response.json();

      // 4. Save AI response to Supabase
      const aiMsg = {
        user_id: user.id,
        sender: "ai",
        character: character,
        content: data.reply,
        emotion: data.emotion || "normal"
      };

      const { data: savedAiMsg, error: aiMsgErr } = await supabase
        .from("chats")
        .insert([aiMsg])
        .select()
        .single();

      if (aiMsgErr) {
        throw aiMsgErr;
      }

      setMessages(prev => [...prev, savedAiMsg]);

      // 5. Handle multiple schedule auto-insertions if detected (重複登録防止ロジック追加)
      if (data.schedules && data.schedules.length > 0) {
        const savedSchedules = [];
        for (const sch of data.schedules) {

          // すでに手元の予定リスト（schedules）に同じ日付＆同じ名前のものがないかチェック
          const isDuplicate = schedules.some(
            (existingSch) =>
              existingSch.event_date === sch.event_date &&
              existingSch.event_name === sch.event_name
          );

          // すでに予定が存在する場合は、新しく登録するのをスキップ（次の予定の処理へ）
          if (isDuplicate) {
            console.log(`重複予定のためスキップされました: ${sch.event_name} (${sch.event_date})`);
            continue;
          }

          const scheduleRecord = {
            user_id: user.id,
            event_name: sch.event_name,
            event_date: sch.event_date,
            event_time: sch.event_time,
            is_followed_up: false
          };

          const { data: savedSchedule, error: schErr } = await supabase
            .from("schedules")
            .insert([scheduleRecord])
            .select()
            .single();

          if (!schErr && savedSchedule) {
            savedSchedules.push(savedSchedule);
          }
        }
        if (savedSchedules.length > 0) {
          setSchedules(prev => [...prev, ...savedSchedules]);
        }
      }

      // 6. Handle successful follow-up marker
      if (todayFollowUpSchedule) {
        await supabase
          .from("schedules")
          .update({ is_followed_up: true })
          .eq("id", todayFollowUpSchedule.id);

        setSchedules(prev =>
          prev.map(s => s.id === todayFollowUpSchedule.id ? { ...s, is_followed_up: true } : s)
        );
        setTodayFollowUpSchedule(null);
      }

    } catch (err) {
      console.error("Error communicating with AI:", err);
      // Fallback message
      const fallbackMsg = {
        user_id: user.id,
        sender: "ai",
        character: character,
        content: "ごめん、ちょっと電波が悪くてお返事できないみたい。もう一度話しかけてみて？",
        emotion: "sad"
      };
      const { data: savedFallback } = await supabase.from("chats").insert([fallbackMsg]).select().single();
      if (savedFallback) setMessages(prev => [...prev, savedFallback]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const createDiaryFromChat = async () => {
    const todayStr = getTokyoDateStr();

    // Filter chats to only include today's messages in Asia/Tokyo timezone
    const todayMessages = messages.filter(m => getTokyoDateStr(m.created_at) === todayStr);

    if (todayMessages.length === 0 || !user) {
      alert(`今日（${todayStr}）はまだ会話履歴がありません。おしゃべりをしてみてね！`);
      return;
    }

    setIsAiTyping(true);

    try {
      // Get the Supabase Auth session token to authorize the API route call
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // 1. Call api/diary route to summarize using Gemini API
      const response = await fetch("/api/diary", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ messages: todayMessages })
      });

      if (!response.ok) {
        throw new Error("Diary summarization failed");
      }

      const data = await response.json();

      // 2. Upsert diary record into Supabase
      const { data: savedDiary, error: diaryError } = await supabase
        .from("diaries")
        .upsert({
          user_id: user.id,
          date: todayStr,
          bullet_points: data.bullet_points,
          overall_mood: data.overall_mood
        }, { onConflict: "user_id, date" })
        .select()
        .single();

      if (diaryError) {
        throw diaryError;
      }

      // 3. Format and update local state list
      const formatted = {
        id: savedDiary.id,
        date: savedDiary.date,
        bulletPoints: savedDiary.bullet_points,
        overallMood: savedDiary.overall_mood
      };

      setDiaries(prev => {
        const existingIdx = prev.findIndex(d => d.date === todayStr);
        if (existingIdx >= 0) {
          const next = [...prev];
          next[existingIdx] = formatted;
          return next;
        } else {
          return [formatted, ...prev];
        }
      });

      router.push("/diary");
    } catch (err) {
      console.error("Error creating diary:", err);
      alert("日記の要約に失敗しました。しばらく待ってから再度お試しください。");
    } finally {
      setIsAiTyping(false);
    }
  };

  const saveDiaryDirect = async (date, bulletPoints, overallMood) => {
    if (!user) return;
    setIsAiTyping(true);
    try {
      const { data: savedDiary, error: diaryError } = await supabase
        .from("diaries")
        .upsert({
          user_id: user.id,
          date,
          bullet_points: bulletPoints,
          overall_mood: overallMood
        }, { onConflict: "user_id, date" })
        .select()
        .single();

      if (diaryError) throw diaryError;

      const formatted = {
        id: savedDiary.id,
        date: savedDiary.date,
        bulletPoints: savedDiary.bullet_points,
        overallMood: savedDiary.overall_mood
      };

      setDiaries(prev => {
        const existingIdx = prev.findIndex(d => d.date === date);
        if (existingIdx >= 0) {
          const next = [...prev];
          next[existingIdx] = formatted;
          return next;
        } else {
          return [formatted, ...prev];
        }
      });

      router.push("/diary");
    } catch (err) {
      console.error("Error saving diary:", err);
      alert("日記の保存に失敗しました。電波状況をご確認の上、再度お試しください。");
    } finally {
      setIsAiTyping(false);
    }
  };

  const clearCurrentChat = async () => {
    if (!user) return;
    if (confirm("今日のチャットログをクリアして、新しい会話を始めますか？")) {
      const todayStr = getTokyoDateStr();
      const todayMessages = messages.filter(m => getTokyoDateStr(m.created_at) === todayStr);
      if (todayMessages.length === 0) {
        alert("今日の会話履歴はありません。");
        return;
      }

      const todayIds = todayMessages.map(m => m.id);
      const { error } = await supabase
        .from("chats")
        .delete()
        .in("id", todayIds);

      if (!error) {
        setMessages(prev => prev.filter(m => !todayIds.includes(m.id)));
      } else {
        alert("チャットの削除に失敗しました。しばらく待ってからやり直してください。");
      }
    }
  };

  const deleteSchedule = async (scheduleId) => {
    if (user) {
      const { error } = await supabase
        .from("schedules")
        .delete()
        .eq("id", scheduleId);

      if (!error) {
        setSchedules(prev => prev.filter(s => s.id !== scheduleId));
      } else {
        alert("予定の削除に失敗しました。");
      }
    }
  };

  const addScheduleDirect = async (eventName, eventDate, eventTime) => {
    if (!user) return;
    try {
      const scheduleRecord = {
        user_id: user.id,
        event_name: eventName,
        event_date: eventDate,
        event_time: eventTime || null,
        is_followed_up: false
      };

      const { data: saved, error } = await supabase
        .from("schedules")
        .insert([scheduleRecord])
        .select()
        .single();

      if (error) throw error;
      if (saved) {
        setSchedules(prev => [...prev, saved]);
      }
    } catch (e) {
      console.error("Failed to add schedule:", e);
      alert("予定の登録に失敗しました。入力内容をお確かめの上、再度お試しください。");
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        profile,
        character,
        messages,
        diaries,
        schedules,
        loading,
        isAiTyping,
        login,
        signup,
        logout,
        changeCharacter,
        updateProfileName,
        updateReminderTime,
        sendMessage,
        createDiaryFromChat,
        saveDiaryDirect,
        clearCurrentChat,
        deleteSchedule,
        addScheduleDirect,
        getTokyoDateStr
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}