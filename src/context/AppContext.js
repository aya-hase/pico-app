"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

  // 1. 古いキャッシュの削除
  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem("pico_messages");
      const storedDiaries = localStorage.getItem("pico_diaries");

      if (storedMessages && !Array.isArray(JSON.parse(storedMessages))) {
        localStorage.removeItem("pico_messages");
      }
      if (storedDiaries && !Array.isArray(JSON.parse(storedDiaries))) {
        localStorage.removeItem("pico_diaries");
      }
    } catch (e) {
      console.error("Error cleaning legacy cache:", e);
      localStorage.removeItem("pico_messages");
      localStorage.removeItem("pico_diaries");
    }
  }, []);

  // 2. 認証状態の検知
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        fetchUserData(user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
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

  // 3. ユーザーデータの取得
  const fetchUserData = async (userId) => {
    try {
      setLoading(true);

      let { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

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

      const { data: chatsData } = await supabase
        .from("chats")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      setMessages(chatsData || []);

      const { data: diariesData } = await supabase
        .from("diaries")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false });

      const formattedDiaries = (diariesData || []).map(d => ({
        id: d.id,
        date: d.date,
        bulletPoints: d.bullet_points,
        overallMood: d.overall_mood,
        nextDayGreeting: d.next_day_greeting
      }));
      setDiaries(formattedDiaries);

      const { data: schedulesData } = await supabase
        .from("schedules")
        .select("*")
        .eq("user_id", userId)
        .order("event_date", { ascending: true });
      setSchedules(schedulesData || []);

      const todayStr = new Date().toLocaleDateString("ja-JP", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).replace(/\//g, "-");

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
    try {
      console.log("Attempting signInWithPassword...", { email });
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      console.log("signInWithPassword response:", { data, error });
      
      if (error) {
        alert("ログインに失敗しました。メールアドレスまたはパスワードが間違っています。");
        return false;
      }
      setUser(data.user);
      window.location.href = "/";
      return true;
    } catch (e) {
      console.error("Login catch block error:", e);
      alert("ログイン中にエラーが発生しました（接続エラーなど）: " + e.message);
      return false;
    }
  };

  const signup = async (email, password, displayName = "ユーザー") => {
    try {
      console.log("Attempting signUp...", { email, displayName });
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName
          }
        }
      });
      console.log("signUp response:", { data, error });

      if (error) {
        alert("アカウント登録に失敗しました。入力内容を確認するか、別のメールアドレスをお試しください。");
        return false;
      }

      alert("サインアップが完了しました！自動ログインします。");
      setUser(data.user);
      window.location.href = "/";
      return true;
    } catch (e) {
      console.error("Signup catch block error:", e);
      alert("サインアップ中にエラーが発生しました（接続エラーなど）: " + e.message);
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const changeCharacter = async (charName) => {
    setCharacter(charName);
    if (user) {
      await supabase
        .from("profiles")
        .update({ selected_character: charName })
        .eq("id", user.id);

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
        alert("名前の更新に失敗しました。");
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
        alert("お知らせ時間の更新に失敗しました。");
      }
    }
  };

  const updatePassword = async (newPassword) => {
    if (!user) return false;
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      alert("パスワードの変更に失敗しました: " + error.message);
      return false;
    }
    return true;
  };

  const sendMessage = async (text) => {
    if (!text.trim() || !user) return;

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

    if (userMsgErr) return;

    setMessages(prev => [...prev, savedUserMsg]);
    setIsAiTyping(true);

    try {
      const recentMessages = messages.slice(-20);
      const chatHistory = recentMessages.map(m => ({
        sender: m.sender,
        content: m.content,
        emotion: m.emotion,
        character: m.character
      }));

      const todaySchedules = [];
      if (todayFollowUpSchedule) {
        todaySchedules.push({
          id: todayFollowUpSchedule.id,
          event_name: todayFollowUpSchedule.event_name,
          event_date: todayFollowUpSchedule.event_date,
          event_time: todayFollowUpSchedule.event_time
        });
      }

      const recentDiaries = diaries.slice(0, 7).map(d => ({
        date: d.date,
        bulletPoints: d.bulletPoints,
        mood: d.overallMood
      }));

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

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

      if (!response.ok) throw new Error("Chat API failed");

      const data = await response.json();

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

      if (aiMsgErr) throw aiMsgErr;

      setMessages(prev => [...prev, savedAiMsg]);

      if (data.schedules && data.schedules.length > 0) {
        const savedSchedules = [];
        for (const sch of data.schedules) {
          const isDuplicate = schedules.some(
            (existingSch) =>
              existingSch.event_date === sch.event_date &&
              existingSch.event_name === sch.event_name
          );

          if (isDuplicate) continue;

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
    const todayMessages = messages.filter(m => getTokyoDateStr(m.created_at) === todayStr);

    if (todayMessages.length === 0 || !user) {
      alert(`今日（${todayStr}）はまだ会話履歴がありません。おしゃべりをしてみてね！`);
      return;
    }

    setIsAiTyping(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch("/api/diary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ messages: todayMessages, character })
      });

      if (!response.ok) throw new Error("Diary summarization failed");

      const data = await response.json();

      const { data: savedDiary, error: diaryError } = await supabase
        .from("diaries")
        .upsert({
          user_id: user.id,
          date: todayStr,
          bullet_points: data.bullet_points,
          overall_mood: data.overall_mood,
          next_day_greeting: data.next_day_greeting
        }, { onConflict: "user_id, date" })
        .select()
        .single();

      if (diaryError) throw diaryError;

      const formatted = {
        id: savedDiary.id,
        date: savedDiary.date,
        bulletPoints: savedDiary.bullet_points,
        overallMood: savedDiary.overall_mood,
        nextDayGreeting: savedDiary.next_day_greeting
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
      alert("日記の要約に失敗しました。");
    } finally {
      setIsAiTyping(false);
    }
  };

  const saveDiaryDirect = async (date, bulletPoints, overallMood, nextDayGreeting = null) => {
    if (!user) return;
    setIsAiTyping(true);
    try {
      const upsertData = {
        user_id: user.id,
        date,
        bullet_points: bulletPoints,
        overall_mood: overallMood
      };

      if (nextDayGreeting !== null) {
        upsertData.next_day_greeting = nextDayGreeting;
      }

      const { data: savedDiary, error: diaryError } = await supabase
        .from("diaries")
        .upsert(upsertData, { onConflict: "user_id, date" })
        .select()
        .single();

      if (diaryError) throw diaryError;

      const formatted = {
        id: savedDiary.id,
        date: savedDiary.date,
        bulletPoints: savedDiary.bullet_points,
        overallMood: savedDiary.overall_mood,
        nextDayGreeting: savedDiary.next_day_greeting
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
      alert("日記の保存に失敗しました。");
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
        alert("チャットの削除に失敗しました。");
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
      alert("予定の登録に失敗しました。");
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
        updatePassword,
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