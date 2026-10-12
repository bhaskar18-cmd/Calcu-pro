import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  BellOff,
  BellRing,
  Clock,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  Play,
  Upload,
  Info,
  Smartphone,
  Globe,
  Trash2,
  ShieldCheck,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Theme } from "../types";
import {
  NotificationSettings,
  loadNotificationSettings,
  saveNotificationSettings,
  checkNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
  applyDailyReminderSchedule,
  isNativeCapacitor,
  getPlatformName,
} from "../utils/notificationManager";
import {
  RINGTONE_OPTIONS,
  RingtonePreset,
  playChime,
} from "../utils/audioChimes";

interface NotificationSettingsSectionProps {
  theme: Theme;
  isStandaloneView?: boolean;
  onClose?: () => void;
  onNavigateToCalendar?: () => void;
}

interface CalendarEventItem {
  id: string;
  dateStr: string;
  text: string;
  time?: string;
  category?: "personal" | "work" | "urgent" | "reminder";
}

export default function NotificationSettingsSection({
  theme,
  isStandaloneView = false,
  onClose,
  onNavigateToCalendar,
}: NotificationSettingsSectionProps) {
  const [settings, setSettings] = useState<NotificationSettings>(loadNotificationSettings);
  const [permissionStatus, setPermissionStatus] = useState<"granted" | "denied" | "prompt" | "unsupported">("prompt");
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>(() => {
    try {
      const saved = localStorage.getItem("suite_calendar_events");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isNative = isNativeCapacitor();
  const platform = getPlatformName();

  useEffect(() => {
    checkNotificationPermission().then(setPermissionStatus);
  }, []);

  const refreshCalendarEvents = () => {
    try {
      const saved = localStorage.getItem("suite_calendar_events");
      setCalendarEvents(saved ? JSON.parse(saved) : []);
    } catch {
      setCalendarEvents([]);
    }
  };

  const showToast = (text: string, type: "success" | "error" | "info" = "info") => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4500);
  };

  const updateSettings = async (partial: Partial<NotificationSettings>) => {
    const next = { ...settings, ...partial };
    setSettings(next);
    saveNotificationSettings(next);

    // If daily reminder changes, re-apply schedule immediately
    if (
      "enabled" in partial ||
      "dailyReminderEnabled" in partial ||
      "dailyReminderTime" in partial ||
      "dailyReminderFrequency" in partial
    ) {
      await applyDailyReminderSchedule(next);
    }
  };

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermissionStatus(res.status);
    if (res.granted) {
      showToast(res.message, "success");
    } else {
      showToast(res.message, "error");
    }
  };

  const handleTestNotification = async () => {
    setIsTesting(true);
    const res = await sendTestNotification();
    setIsTesting(false);
    if (res.success) {
      showToast(res.message, "success");
    } else {
      showToast(res.message, "error");
    }
  };

  const handlePlayPreview = (preset: RingtonePreset) => {
    playChime(preset, settings.customRingtoneDataUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      showToast("Please upload an audio file (MP3, WAV, OGG, M4A).", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      updateSettings({
        ringtone: "custom",
        customRingtoneName: file.name,
        customRingtoneDataUrl: dataUrl,
      });
      playChime("custom", dataUrl);
      showToast(`Custom ringtone "${file.name}" loaded!`, "success");
    };
    reader.readAsDataURL(file);
  };

  const handleResetReminder = async () => {
    await updateSettings({ dailyReminderEnabled: false });
    showToast("Daily reminder disabled and cancelled.", "info");
  };

  // Theming classes
  const getCardStyle = () => {
    switch (theme) {
      case "cosmic":
        return "bg-slate-900/60 border border-white/10 text-white";
      case "neumorphic":
        return "bg-[#181818] border border-zinc-800 text-gray-200";
      case "financial":
        return "bg-[#EDEDD5] border border-[#BCBCA6] text-[#3C3C30]";
      case "minimalist":
      default:
        return "bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-gray-900 dark:text-white";
    }
  };

  const getAccentBtnStyle = () => {
    switch (theme) {
      case "cosmic":
        return "bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-cyan-500/20";
      case "neumorphic":
        return "bg-[#00E676] hover:bg-[#12cf6c] text-black font-bold shadow-[#00E676]/20";
      case "financial":
        return "bg-[#556B2F] hover:bg-[#465827] text-white font-bold shadow-[#556B2F]/20";
      case "minimalist":
      default:
        return "bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-indigo-500/20";
    }
  };

  return (
    <div className={`space-y-4 pt-1 ${isStandaloneView ? "max-w-2xl mx-auto p-4 md:p-6 rounded-3xl " + getCardStyle() : ""}`} id="notification-settings-panel">
      {/* Header Info */}
      <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider block">
              Reminders & Notification Center
            </h2>
            <span className="text-[10px] opacity-60 block">
              Capacitor 7 Native Android & Web Engine
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Master Toggle */}
          <label className="relative inline-flex items-center cursor-pointer" title="Master Notifications Switch">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => updateSettings({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer transition-colors"
              title="Close Notification Center"
            >
              <Trash2 className="hidden" />
              <span className="text-lg font-bold px-1">&times;</span>
            </button>
          )}
        </div>
      </div>

      {/* Platform & Environment Diagnostic Banner */}
      <div className={`p-3 rounded-xl text-xs space-y-1.5 ${getCardStyle()}`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 flex items-center gap-1.5">
            {isNative ? (
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
            )}
            Runtime: {isNative ? `Native Android APK (${platform})` : "Web Browser Mode"}
          </span>
          <span
            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
              permissionStatus === "granted"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : permissionStatus === "denied"
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
            }`}
          >
            Permission: {permissionStatus}
          </span>
        </div>

        <p className="text-[10px] opacity-70 leading-relaxed">
          {isNative
            ? "Exact alarm and background delivery are enabled via Capacitor Local Notifications. Alerts deliver even when the app is closed."
            : "Browser Mode active: Notifications display in-tab or via browser permission while Calcu Pro is running. Build the Android APK for full background delivery when closed."}
        </p>

        {/* Permission Request Action Button if not granted */}
        {permissionStatus !== "granted" && (
          <div className="pt-1">
            <button
              onClick={handleRequestPermission}
              className={`w-full py-1.5 px-3 rounded-lg text-[10px] uppercase font-black tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm ${getAccentBtnStyle()}`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Request Notification Permission
            </button>
            {permissionStatus === "denied" && (
              <p className="text-[9px] text-amber-400 mt-1 leading-normal">
                ⚠️ Notifications were blocked. In Android Settings: go to <b>Apps &gt; Calcu Pro &gt; Notifications</b> and toggle Allowed.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Status Feedback Toast */}
      {statusMessage && (
        <div
          className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn ${
            statusMessage.type === "success"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : statusMessage.type === "error"
              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
              : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span className="text-[10px] leading-tight flex-1">{statusMessage.text}</span>
        </div>
      )}

      {/* Main Settings Body */}
      {settings.enabled ? (
        <div className="space-y-4">
          {/* 1. Daily Review Reminder Card */}
          <div className={`p-3.5 rounded-xl space-y-3 ${getCardStyle()}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <div>
                  <span className="text-xs font-bold block">Scheduled Daily Reminder</span>
                  <span className="text-[9px] opacity-60 block">
                    Fixed ID 1001 • No duplicate notifications
                  </span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.dailyReminderEnabled}
                  onChange={(e) => updateSettings({ dailyReminderEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {settings.dailyReminderEnabled && (
              <div className="space-y-2.5 pt-2 border-t border-black/5 dark:border-white/5 animate-fadeIn">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black opacity-60 block">
                      Reminder Time
                    </label>
                    <input
                      type="time"
                      value={settings.dailyReminderTime}
                      onChange={(e) => updateSettings({ dailyReminderTime: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs font-bold bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black opacity-60 block">
                      Frequency
                    </label>
                    <select
                      value={settings.dailyReminderFrequency}
                      onChange={(e) =>
                        updateSettings({
                          dailyReminderFrequency: e.target.value as "daily" | "weekdays" | "weekends",
                        })
                      }
                      className="w-full px-2 py-1.5 rounded-lg text-xs font-bold bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="daily">Every Day</option>
                      <option value="weekdays">Mon - Fri Only</option>
                      <option value="weekends">Weekends Only</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[9px] opacity-60 italic">
                    Alerts at {settings.dailyReminderTime} ({settings.dailyReminderFrequency})
                  </span>
                  <button
                    onClick={handleResetReminder}
                    className="text-[9px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    Disable Reminder
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. Calendar Event Reminders Toggle & Scheduled List */}
          <div className={`p-3.5 rounded-xl space-y-3 ${getCardStyle()}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="text-xs font-bold block">Calendar Notes & Reminders</span>
                  <span className="text-[9px] opacity-60 block">
                    Alerts precisely at your scheduled event time
                  </span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.calendarRemindersEnabled}
                  onChange={(e) => updateSettings({ calendarRemindersEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {settings.calendarRemindersEnabled && (
              <div className="space-y-2 pt-2 border-t border-black/5 dark:border-white/5 animate-fadeIn">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold opacity-75">
                    Active Calendar Reminders ({calendarEvents.length})
                  </span>
                  {onNavigateToCalendar && (
                    <button
                      onClick={onNavigateToCalendar}
                      className="text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer text-[10px]"
                    >
                      Open Calendar &rarr;
                    </button>
                  )}
                </div>

                {calendarEvents.length === 0 ? (
                  <div className="p-2.5 rounded-lg bg-black/5 dark:bg-white/5 text-center space-y-1">
                    <p className="text-[10px] opacity-60 italic">
                      No reminders scheduled yet. Open the calendar, select a date, and add a note with a time!
                    </p>
                    {onNavigateToCalendar && (
                      <button
                        onClick={onNavigateToCalendar}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold cursor-pointer inline-flex items-center gap-1 mt-1"
                      >
                        <Calendar className="w-3 h-3" />
                        Go to Calendar
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                    {calendarEvents.map((item) => (
                      <div
                        key={item.id}
                        className="p-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold truncate text-[11px]">{item.text}</p>
                          <div className="flex items-center gap-2 text-[9px] opacity-65">
                            <span>📅 {item.dateStr}</span>
                            {item.time && <span>⏰ {item.time}</span>}
                            <span className="px-1 rounded bg-indigo-500/20 text-indigo-400 font-bold">
                              {item.category || "personal"}
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 shrink-0 ml-2">
                          Scheduled
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Audio Ringtone & Sound Customization */}
          <div className={`p-3.5 rounded-xl space-y-3 ${getCardStyle()}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-xs font-bold block">Reminder Audio Chime</span>
                  <span className="text-[9px] opacity-60 block">
                    Custom sound played on alert trigger
                  </span>
                </div>
              </div>
              <button
                onClick={() => handlePlayPreview(settings.ringtone)}
                className="px-2.5 py-1 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-black/20 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Play current chime preview"
              >
                <Play className="w-3 h-3 fill-current text-indigo-400" />
                <span>Test Audio</span>
              </button>
            </div>

            {/* Presets List */}
            <div className="grid grid-cols-2 gap-1.5">
              {RINGTONE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    updateSettings({ ringtone: opt.id });
                    handlePlayPreview(opt.id);
                  }}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                    settings.ringtone === opt.id
                      ? "bg-indigo-500/20 border-indigo-500 text-indigo-300 font-bold"
                      : "bg-black/5 dark:bg-white/5 border-transparent text-gray-400 hover:text-white"
                  }`}
                >
                  <span className="text-[11px] block">{opt.name}</span>
                  <span className="text-[8px] opacity-60 line-clamp-1">{opt.description}</span>
                </button>
              ))}
            </div>

            {/* Custom file upload if "custom" selected */}
            {settings.ringtone === "custom" && (
              <div className="p-2.5 rounded-xl bg-black/10 dark:bg-white/5 space-y-2 border border-dashed border-white/20">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold">
                    {settings.customRingtoneName || "No custom sound selected"}
                  </span>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    Upload MP3 / Audio
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* 4. Action Buttons: Send Test & Diagnostics */}
          <div className="pt-1">
            <button
              onClick={handleTestNotification}
              disabled={isTesting}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 ${getAccentBtnStyle()}`}
              id="btn-test-notification-trigger"
            >
              <Bell className="w-4 h-4 animate-bounce" />
              <span>{isTesting ? "Triggering..." : "Send Test Notification Now"}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className={`p-4 rounded-xl text-center space-y-2 opacity-75 ${getCardStyle()}`}>
          <BellOff className="w-8 h-8 mx-auto text-gray-500" />
          <p className="text-xs font-bold">Notifications Are Switched Off</p>
          <p className="text-[10px] opacity-60">
            Switch on the master toggle above to schedule daily alarms, calendar alerts, and audio chimes.
          </p>
        </div>
      )}

      {/* Helpful Android Tips Footer */}
      <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 text-[9px] opacity-65 space-y-1">
        <span className="font-bold uppercase tracking-wider block flex items-center gap-1">
          <Info className="w-3 h-3" />
          Android Background Notifications Guide:
        </span>
        <p>• <b>Android 13+:</b> Requires explicit notification permission.</p>
        <p>• <b>Battery Optimization:</b> On MIUI, Samsung OneUI, or OxygenOS, exempt Calcu Pro from aggressive battery killing to ensure alarms fire at the exact minute while phone is sleeping.</p>
        <p>• <b>GitHub Actions:</b> Building the APK embeds all Capacitor local notification native libraries automatically.</p>
      </div>
    </div>
  );
}
