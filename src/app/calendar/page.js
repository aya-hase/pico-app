"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import NavBar from "@/components/NavBar";

export default function CalendarPage() {
  const { schedules, deleteSchedule, getTokyoDateStr } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Initial selected date is today in Tokyo timezone
  const todayTokyoStr = getTokyoDateStr();
  const [selectedDateStr, setSelectedDateStr] = useState(todayTokyoStr);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Helper to format date as YYYY-MM-DD
  const formatDateStr = (y, m, d) => {
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // Day of week (0-6) for the 1st day

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const selectDay = (day) => {
    const formatted = formatDateStr(year, month, day);
    setSelectedDateStr(formatted);
  };

  // Generate calendar grid cells
  const cells = [];
  // Empty cells for previous month padding
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push({ type: "empty" });
  }
  // Calendar days of the current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatDateStr(year, month, d);
    const hasEvents = schedules.some((s) => s.event_date === dateStr);
    cells.push({ type: "day", dayNum: d, dateStr, hasEvents });
  }

  // Get schedules for selected day
  const activeSchedules = schedules.filter((s) => s.event_date === selectedDateStr);

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-slate-50">
      {/* Header */}
      <header className="px-6 py-4 bg-white border-b border-slate-100 relative z-10 flex justify-between items-center">
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">予定の管理</p>
          <h1 className="text-lg font-bold text-slate-800">ピコ予定表</h1>
        </div>
        <span className="text-2xl">📅</span>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-5 py-5 space-y-5 bg-gradient-to-b from-slate-50 to-indigo-50/20">
        
        {/* Month Selector & Calendar Card */}
        <section className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          
          {/* Navigation */}
          <div className="flex justify-between items-center px-1">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-slate-100 rounded-xl cursor-pointer text-slate-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <h2 className="text-sm font-bold text-slate-800 font-sans">
              {year}年 {month + 1}月
            </h2>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-slate-100 rounded-xl cursor-pointer text-slate-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center border-b border-slate-100 pb-1.5">
            {["日", "月", "火", "水", "木", "金", "土"].map((day, idx) => (
              <span
                key={day}
                className={`text-[10px] font-bold py-1 ${
                  idx === 0 ? "text-rose-500" : idx === 6 ? "text-blue-500" : "text-slate-400"
                }`}
              >
                {day}
              </span>
            ))}
          </div>

          {/* Calendar Grid cells */}
          <div className="grid grid-cols-7 gap-y-2 gap-x-1">
            {cells.map((cell, idx) => {
              if (cell.type === "empty") {
                return <div key={`empty-${idx}`} className="aspect-square" />;
              }

              const isSelected = cell.dateStr === selectedDateStr;
              const isToday = todayTokyoStr === cell.dateStr;
              
              return (
                <button
                  key={cell.dateStr}
                  onClick={() => selectDay(cell.dayNum)}
                  className={`aspect-square flex flex-col items-center justify-center rounded-2xl relative transition-all active:scale-90 cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20"
                      : isToday
                      ? "bg-indigo-50 text-indigo-600 font-bold border border-indigo-200/50"
                      : "hover:bg-slate-100 text-slate-700 font-semibold"
                  }`}
                >
                  <span className="text-xs">{cell.dayNum}</span>
                  {/* Dot indicator if has events */}
                  {cell.hasEvents && (
                    <span
                      className={`absolute bottom-1.5 w-1 h-1 rounded-full ${
                        isSelected ? "bg-white" : "bg-indigo-500 animate-pulse"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

        </section>

        {/* Selected Date Details */}
        <section className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-baseline border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">
              📅 {selectedDateStr} の予定
            </h3>
            <span className="text-[10px] text-slate-400 font-bold">
              {activeSchedules.length} 件の登録
            </span>
          </div>

          {activeSchedules.length === 0 ? (
            <div className="py-6 text-center space-y-1.5">
              <span className="text-2xl">🌱</span>
              <p className="text-xs text-slate-400 font-semibold">この日の予定はありません。</p>
              <p className="text-[10.5px] text-slate-400 leading-relaxed max-w-[220px] mx-auto font-medium">
                「おしゃべり」画面で『明日10時に打ち合わせをする』などと話しかけると自動で追加されます！
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeSchedules.map((sch) => (
                <div
                  key={sch.id}
                  className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100 gap-2 hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base flex-shrink-0">📍</span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-800 truncate">{sch.event_name}</span>
                      <span className="text-[9px] text-slate-400 font-mono font-medium mt-0.5">
                        {sch.event_time ? sch.event_time : "時間指定なし"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`「${sch.event_name}」の予定を削除しますか？`)) {
                        deleteSchedule(sch.id);
                      }
                    }}
                    className="text-rose-500 hover:text-rose-600 font-bold text-[10px] bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl cursor-pointer active:scale-95 transition-all flex-shrink-0"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      <NavBar />
    </div>
  );
}
