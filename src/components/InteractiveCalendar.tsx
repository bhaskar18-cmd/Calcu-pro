import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar as CalendarIcon, Clock, Tag, Sparkles } from "lucide-react";
import { Theme } from "../types";

interface CalendarEvent {
  id: string;
  dateStr: string; // "YYYY-MM-DD"
  text: string;
  time?: string;
  category?: "personal" | "work" | "urgent" | "reminder"; // priority tags
}

interface InteractiveCalendarProps {
  theme: Theme;
}

export default function InteractiveCalendar({ theme }: InteractiveCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem("suite_calendar_events");
    return saved ? JSON.parse(saved) : [];
  });
  const [newEventText, setNewEventText] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [newEventCategory, setNewEventCategory] = useState<"personal" | "work" | "urgent" | "reminder">("personal");
  const [showEventForm, setShowEventForm] = useState(false);

  useEffect(() => {
    localStorage.setItem("suite_calendar_events", JSON.stringify(events));
  }, [events]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Helper functions for calendar logic
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  // Month and Weekday lists
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const handleDayClick = (dayNum: number) => {
    const newSel = new Date(year, month, dayNum);
    setSelectedDate(newSel);
    setShowEventForm(false);
  };

  const getFormattedDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const selectedDateStr = getFormattedDateStr(selectedDate);
  const selectedEvents = events.filter((e) => e.dateStr === selectedDateStr);

  // Count events for current month
  const currentMonthEventsCount = events.filter((e) => {
    const [y, m] = e.dateStr.split("-");
    return parseInt(y) === year && parseInt(m) === (month + 1);
  }).length;

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventText.trim()) return;

    const newEv: CalendarEvent = {
      id: Math.random().toString(36).substr(2, 9),
      dateStr: selectedDateStr,
      text: newEventText.trim(),
      time: newEventTime || undefined,
      category: newEventCategory,
    };

    setEvents((prev) => [...prev, newEv]);
    setNewEventText("");
    setNewEventTime("");
    setNewEventCategory("personal");
    setShowEventForm(false);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  // Helper to check if a day has any events
  const getDayEvents = (dayNum: number) => {
    const checkStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    return events.filter((e) => e.dateStr === checkStr);
  };

  // Helper to check if a day is today
  const isToday = (dayNum: number) => {
    const today = new Date();
    return (
      today.getDate() === dayNum &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  // Helper to check if a day is currently selected
  const isSelected = (dayNum: number) => {
    return (
      selectedDate.getDate() === dayNum &&
      selectedDate.getMonth() === month &&
      selectedDate.getFullYear() === year
    );
  };

  // Category visual helper
  const getCategoryColor = (cat?: string) => {
    switch (cat) {
      case "urgent":
        return {
          dot: "bg-rose-500",
          badge: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
          solid: "bg-rose-500",
        };
      case "work":
        return {
          dot: "bg-amber-500",
          badge: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
          solid: "bg-amber-500",
        };
      case "reminder":
        return {
          dot: "bg-indigo-400",
          badge: "bg-indigo-400/10 text-indigo-300 border border-indigo-400/20",
          solid: "bg-indigo-400",
        };
      case "personal":
      default:
        return {
          dot: "bg-emerald-400",
          badge: "bg-emerald-400/10 text-emerald-300 border border-emerald-400/20",
          solid: "bg-emerald-400",
        };
    }
  };

  // Build the styling configurations for themes
  const getThemeStyles = () => {
    switch (theme) {
      case "cosmic":
        return {
          container: "bg-gradient-to-b from-slate-950/85 to-slate-900/65 border border-cyan-500/20 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)] text-white backdrop-blur-md",
          headerBtn: "p-2 rounded-xl bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/30 border border-white/5 text-cyan-400 transition-all cursor-pointer hover:scale-105 active:scale-95",
          todayBtn: "px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-400/30 text-[10px] uppercase font-black tracking-widest hover:from-cyan-500/35 hover:to-blue-500/35 transition-all cursor-pointer shadow-lg shadow-cyan-950/30 hover:scale-105 active:scale-95",
          weekdayText: "text-slate-400 font-extrabold text-[11px] uppercase tracking-wider select-none",
          dayCell: (isSel: boolean, isTod: boolean, hasEvs: boolean) => {
            if (isSel) return "bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black shadow-[0_0_12px_rgba(6,182,212,0.4)] scale-110 z-10";
            if (isTod) return "border-2 border-cyan-400/60 text-cyan-200 font-bold bg-cyan-950/40 shadow-[inset_0_0_8px_rgba(34,211,238,0.2)]";
            if (hasEvs) return "bg-white/5 border border-white/10 hover:bg-white/10 text-slate-100 hover:scale-105";
            return "hover:bg-white/5 text-slate-400 hover:text-white hover:scale-105";
          },
          selectedDateDisplay: "text-cyan-400 border-t border-white/10 mt-4 pt-4 text-xs font-semibold",
          emptyEventsText: "text-slate-500 text-[11px] italic text-center py-2 bg-slate-900/40 rounded-xl border border-white/5",
          inputField: "w-full rounded-lg px-2.5 py-1.5 bg-slate-905 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all",
          submitBtn: "px-3 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-slate-955 text-[11px] font-black rounded-lg transition-all cursor-pointer shadow-md shadow-cyan-400/10 hover:scale-105 active:scale-95",
          cancelBtn: "px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-semibold rounded-lg transition-all cursor-pointer hover:scale-105 active:scale-95",
          eventItem: "bg-slate-900/60 border border-white/5 hover:border-cyan-500/20 rounded-xl p-2.5 flex items-start justify-between gap-1.5 transition-all shadow-sm hover:translate-x-0.5",
        };
      case "neumorphic":
        return {
          container: "bg-[#1A1A1A] border border-zinc-800 rounded-2xl p-4 shadow-[inset_1px_1px_5px_rgba(255,255,255,0.03),_0_12px_24px_rgba(0,0,0,0.8)] text-gray-200",
          headerBtn: "p-2 rounded-xl bg-zinc-900 hover:border-[#00E676]/40 hover:bg-zinc-850 border border-zinc-800/80 text-[#00E676] transition-all cursor-pointer hover:scale-105 active:scale-95",
          todayBtn: "px-3 py-1.5 rounded-lg bg-zinc-900 text-[#00E676] border border-[#00E676]/30 text-[10px] uppercase font-black tracking-widest hover:bg-[#00E676]/10 hover:border-[#00E676]/50 transition-all cursor-pointer hover:scale-105 active:scale-95",
          weekdayText: "text-zinc-500 font-extrabold text-[11px] uppercase tracking-wider select-none",
          dayCell: (isSel: boolean, isTod: boolean, hasEvs: boolean) => {
            if (isSel) return "bg-[#00E676] text-black font-black shadow-[0_0_12px_rgba(0,230,118,0.3)] scale-110 z-10";
            if (isTod) return "border-2 border-[#00E676]/50 text-[#00E676] font-bold bg-[#00E676]/5";
            if (hasEvs) return "bg-zinc-900 border border-zinc-800 text-gray-100 hover:scale-105";
            return "hover:bg-zinc-850 text-zinc-400 hover:text-white hover:scale-105";
          },
          selectedDateDisplay: "text-[#00E676] border-t border-zinc-800/80 mt-4 pt-4 text-xs font-semibold",
          emptyEventsText: "text-zinc-500 text-[11px] italic text-center py-2 bg-zinc-950/40 rounded-xl border border-zinc-900",
          inputField: "w-full rounded-lg px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 text-[#00E676] placeholder-zinc-700 text-xs focus:outline-none focus:ring-1 focus:ring-[#00E676] transition-all",
          submitBtn: "px-3 py-1.5 bg-[#00E676] hover:bg-[#12cf6c] text-black text-[11px] font-black rounded-lg transition-all cursor-pointer shadow-md shadow-[#00E676]/10 hover:scale-105 active:scale-95",
          cancelBtn: "px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 text-[11px] font-semibold rounded-lg transition-all cursor-pointer hover:scale-105 active:scale-95",
          eventItem: "bg-zinc-950/50 border border-zinc-900 hover:border-[#00E676]/25 rounded-xl p-2.5 flex items-start justify-between gap-1.5 transition-all shadow-sm hover:translate-x-0.5",
        };
      case "financial":
        return {
          container: "bg-gradient-to-b from-[#F7F7E8] to-[#EDEDD5] border border-[#BCBCA6] rounded-2xl p-4 shadow-md text-[#3C3C30]",
          headerBtn: "p-2 rounded-xl bg-[#ECECD8] hover:bg-[#E3E3CA] border border-[#BCBCA6] text-[#556B2F] transition-all cursor-pointer hover:scale-105 active:scale-95",
          todayBtn: "px-3 py-1.5 rounded-lg bg-[#E3E3CA] text-[#556B2F] border border-[#556B2F]/30 text-[10px] uppercase font-black tracking-widest hover:bg-[#556B2F]/10 transition-all cursor-pointer hover:scale-105 active:scale-95",
          weekdayText: "text-[#8A8A75] font-extrabold text-[11px] uppercase tracking-wider font-mono select-none",
          dayCell: (isSel: boolean, isTod: boolean, hasEvs: boolean) => {
            if (isSel) return "bg-[#556B2F] text-white font-black shadow-md scale-110 z-10";
            if (isTod) return "border-2 border-[#556B2F]/60 text-[#556B2F] font-bold bg-[#556B2F]/5";
            if (hasEvs) return "bg-[#ECECD8] border border-[#BCBCA6] text-[#3C3C30] hover:scale-105";
            return "hover:bg-[#DFDFCB]/70 text-[#5A5A4A] hover:scale-105";
          },
          selectedDateDisplay: "text-[#556B2F] border-t border-[#BCBCA6]/50 mt-4 pt-4 text-xs font-semibold",
          emptyEventsText: "text-[#8A8A75] text-[11px] italic text-center py-2 bg-[#ECECD8]/30 rounded-xl border border-[#BCBCA6]/40",
          inputField: "w-full rounded-lg px-2.5 py-1.5 bg-[#FDFDF7] border border-[#BCBCA6] text-[#3C3C30] placeholder-[#BCBCA6] text-xs focus:outline-none focus:ring-1 focus:ring-[#556B2F] transition-all",
          submitBtn: "px-3 py-1.5 bg-[#556B2F] hover:bg-[#475b24] text-white text-[11px] font-black rounded-lg transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95",
          cancelBtn: "px-2.5 py-1.5 bg-[#D9D9C0] hover:bg-[#CFCFA8] text-[#556B2F] text-[11px] font-semibold rounded-lg transition-all cursor-pointer hover:scale-105 active:scale-95",
          eventItem: "bg-[#DFDFCB]/20 border border-[#BCBCA6]/60 hover:border-[#556B2F]/40 rounded-xl p-2.5 flex items-start justify-between gap-1.5 transition-all shadow-sm hover:translate-x-0.5",
        };
      case "minimalist":
      default:
        return {
          container: "bg-white border border-gray-200/90 rounded-2xl p-4 shadow-sm text-gray-800",
          headerBtn: "p-2 rounded-xl bg-gray-50 hover:bg-gray-100 hover:border-gray-300 border border-gray-200 text-gray-700 transition-all cursor-pointer hover:scale-105 active:scale-95",
          todayBtn: "px-3 py-1.5 rounded-lg bg-gray-50 text-gray-800 border border-gray-200 text-[10px] uppercase font-black tracking-widest hover:bg-gray-100 transition-all cursor-pointer hover:scale-105 active:scale-95",
          weekdayText: "text-gray-400 font-extrabold text-[11px] uppercase tracking-wider select-none",
          dayCell: (isSel: boolean, isTod: boolean, hasEvs: boolean) => {
            if (isSel) return "bg-gray-900 text-white font-black shadow-sm scale-110 z-10";
            if (isTod) return "border-2 border-gray-950 text-gray-950 font-bold bg-gray-50/50";
            if (hasEvs) return "bg-gray-50 border border-gray-200 text-gray-800 hover:scale-105";
            return "hover:bg-gray-50 text-gray-500 hover:text-gray-900 hover:scale-105";
          },
          selectedDateDisplay: "text-gray-900 border-t border-gray-100 mt-4 pt-4 text-xs font-semibold",
          emptyEventsText: "text-gray-400 text-[11px] italic text-center py-2 bg-gray-50 rounded-xl border border-gray-100",
          inputField: "w-full rounded-lg px-2.5 py-1.5 bg-white border border-gray-200 text-gray-800 placeholder-gray-400 text-xs focus:outline-none focus:ring-1 focus:ring-gray-400 transition-all",
          submitBtn: "px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-[11px] font-black rounded-lg transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95",
          cancelBtn: "px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[11px] font-semibold rounded-lg transition-all cursor-pointer hover:scale-105 active:scale-95",
          eventItem: "bg-gray-50/80 border border-gray-150 hover:border-gray-300 rounded-xl p-2.5 flex items-start justify-between gap-1.5 transition-all shadow-sm hover:translate-x-0.5",
        };
    }
  };

  const s = getThemeStyles();

  // Create empty arrays to represent layout grid
  const totalSlots = 42; // standard 6 rows
  const slots: (number | null)[] = [];

  // Fill preceding slots with null (for previous month days buffer)
  for (let i = 0; i < firstDayIndex; i++) {
    slots.push(null);
  }

  // Fill current month days
  for (let d = 1; d <= daysInMonth; d++) {
    slots.push(d);
  }

  // Fill remaining slots up to 42 with null or next month days
  while (slots.length < totalSlots) {
    slots.push(null);
  }

  return (
    <div className={s.container} id="chrono-interactive-calendar-widget">
      {/* Calendar Header with navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-black opacity-60 tracking-widest flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
            Calendar & Notes
          </span>
          <span className="text-sm font-black tracking-tight mt-0.5">
            {months[month]} {year}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button onClick={handleToday} className={s.todayBtn} title="Jump to today">
            Today
          </button>
          <button onClick={handlePrevMonth} className={s.headerBtn} title="Prev Month">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={handleNextMonth} className={s.headerBtn} title="Next Month">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tiny statistical indicator */}
      {currentMonthEventsCount > 0 && (
        <div className="mb-3 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 dark:text-cyan-400 border border-indigo-500/10 text-[10px] font-bold flex items-center justify-between animate-fadeIn">
          <span>📅 Schedule Overview</span>
          <span>{currentMonthEventsCount} item{currentMonthEventsCount > 1 ? "s" : ""} booked this month</span>
        </div>
      )}

      {/* Weekdays Row */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {weekdays.map((wd) => (
          <div key={wd} className={s.weekdayText}>
            {wd}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {slots.map((dayNum, index) => {
          if (dayNum === null) {
            return (
              <div
                key={`empty-${index}`}
                className="aspect-square flex items-center justify-center text-[10px] opacity-10 cursor-not-allowed select-none"
              >
                -
              </div>
            );
          }

          const isSel = isSelected(dayNum);
          const isTod = isToday(dayNum);
          const dayEvents = getDayEvents(dayNum);
          const hasEvs = dayEvents.length > 0;

          return (
            <button
              key={`day-${dayNum}`}
              onClick={() => handleDayClick(dayNum)}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-bold transition-all duration-200 ${s.dayCell(
                isSel,
                isTod,
                hasEvs
              )}`}
            >
              <span>{dayNum}</span>
              
              {/* Event indicators - multiple tiny dots or colored rings */}
              {hasEvs && (
                <div className="absolute bottom-1 flex items-center justify-center gap-0.5">
                  {dayEvents.slice(0, 3).map((ev) => {
                    const colors = getCategoryColor(ev.category);
                    return (
                      <span
                        key={ev.id}
                        className={`w-1 h-1 rounded-full ${colors.solid}`}
                      />
                    );
                  })}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day View and Events Logger */}
      <div className={s.selectedDateDisplay}>
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-black/5 dark:border-white/10">
          <span className="flex items-center gap-1.5 font-black uppercase tracking-wider text-[10px] text-indigo-400 dark:text-cyan-400">
            <CalendarIcon className="w-3.5 h-3.5 opacity-90 animate-pulse" />
            {selectedDate.toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>

          {!showEventForm && (
            <button
              onClick={() => setShowEventForm(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-indigo-500/20 hover:scale-105 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Reminder</span>
            </button>
          )}
        </div>

        {/* Form to add a new reminder/event with Priority tags */}
        {showEventForm && (
          <form onSubmit={handleAddEvent} className="space-y-3 mb-4 bg-black/10 dark:bg-white/5 p-3.5 rounded-xl border border-black/5 dark:border-white/5 animate-fadeIn">
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-black opacity-50 block">Reminder/Task Title</label>
              <input
                type="text"
                required
                placeholder="Buy groceries, meeting, gym..."
                value={newEventText}
                onChange={(e) => setNewEventText(e.target.value)}
                className={s.inputField}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black opacity-50 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  Time (optional)
                </label>
                <input
                  type="time"
                  value={newEventTime}
                  onChange={(e) => setNewEventTime(e.target.value)}
                  className={s.inputField}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black opacity-50 flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5" />
                  Priority/Tag
                </label>
                <select
                  value={newEventCategory}
                  onChange={(e) => setNewEventCategory(e.target.value as any)}
                  className="w-full rounded-lg px-2.5 py-1.5 bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all dark:bg-zinc-950 dark:text-zinc-300"
                  style={{ colorScheme: "dark" }}
                >
                  <option value="personal">💚 Personal</option>
                  <option value="work">💛 Work</option>
                  <option value="urgent">❤️ Urgent</option>
                  <option value="reminder">💙 Reminder</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={() => {
                  setShowEventForm(false);
                  setNewEventText("");
                  setNewEventTime("");
                  setNewEventCategory("personal");
                }}
                className={s.cancelBtn}
              >
                Cancel
              </button>
              <button type="submit" className={s.submitBtn}>
                Save note
              </button>
            </div>
          </form>
        )}

        {/* Selected date events list */}
        <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5 scrollbar-thin">
          {selectedEvents.length === 0 ? (
            <p className={s.emptyEventsText}>No events or reminders booked for today.</p>
          ) : (
            selectedEvents.map((ev) => {
              const catConfig = getCategoryColor(ev.category);
              return (
                <div key={ev.id} className={s.eventItem}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`w-2 h-2 rounded-full ${catConfig.solid} shrink-0`} />
                      <p className="text-[11px] font-bold break-words leading-snug">{ev.text}</p>
                    </div>
                    <div className="flex items-center gap-1.5 ml-4">
                      <span className={`px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-md ${catConfig.badge}`}>
                        {ev.category || "personal"}
                      </span>
                      {ev.time && (
                        <span className="inline-flex items-center gap-1 text-[9px] opacity-65 font-mono font-bold">
                          <Clock className="w-2.5 h-2.5 text-indigo-400 dark:text-cyan-400" />
                          {ev.time}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteEvent(ev.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all shrink-0 cursor-pointer hover:scale-110 active:scale-95"
                    title="Delete reminder"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
