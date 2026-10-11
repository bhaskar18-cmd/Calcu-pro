import { Capacitor } from "@capacitor/core";
import { LocalNotifications, ScheduleOptions, PermissionStatus } from "@capacitor/local-notifications";
import { playChime, RingtonePreset } from "./audioChimes";

export interface NotificationSettings {
  enabled: boolean;
  dailyReminderEnabled: boolean;
  dailyReminderTime: string; // "09:00"
  dailyReminderFrequency: "daily" | "weekdays" | "weekends";
  calendarRemindersEnabled: boolean;
  groceryBudgetAlertsEnabled: boolean;
  ringtone: RingtonePreset;
  customRingtoneName?: string;
  customRingtoneDataUrl?: string;
  vibration: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  dailyReminderEnabled: false,
  dailyReminderTime: "09:00",
  dailyReminderFrequency: "daily",
  calendarRemindersEnabled: true,
  groceryBudgetAlertsEnabled: true,
  ringtone: "marimba",
  vibration: true,
};

const SETTINGS_STORAGE_KEY = "calcu_pro_notification_settings";

// Deterministic stable IDs (32-bit positive integers)
export const NOTIFICATION_IDS = {
  DAILY_REMINDER: 1001,
  TEST_NOTIFICATION: 1002,
  BUDGET_ALERT: 1003,
};

// Android notification channel IDs
const CHANNEL_REMINDERS = "calcu_pro_reminders";
const CHANNEL_CALENDAR = "calcu_pro_calendar";

export function getCalendarEventNotificationId(eventId: string): number {
  let hash = 0;
  for (let i = 0; i < eventId.length; i++) {
    hash = ((hash << 5) - hash) + eventId.charCodeAt(i);
    hash |= 0;
  }
  return 20000 + (Math.abs(hash) % 70000);
}

export function isNativeCapacitor(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function getPlatformName(): string {
  try {
    return Capacitor.getPlatform(); // 'android' | 'ios' | 'web'
  } catch {
    return "web";
  }
}

export function loadNotificationSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_NOTIFICATION_SETTINGS };
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.warn("Failed to load notification settings:", err);
    return { ...DEFAULT_NOTIFICATION_SETTINGS };
  }
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn("Failed to save notification settings:", err);
  }
}

let isInitialized = false;

/**
 * Initializes notification channels and listeners.
 */
export async function initNotificationManager(): Promise<void> {
  if (isInitialized) return;
  isInitialized = true;

  if (isNativeCapacitor()) {
    try {
      // Create high-priority notification channels on Android
      await LocalNotifications.createChannel({
        id: CHANNEL_REMINDERS,
        name: "Daily & Suite Reminders",
        description: "Scheduled daily task check-ins and review reminders",
        importance: 5,
        visibility: 1,
        vibration: true,
      });

      await LocalNotifications.createChannel({
        id: CHANNEL_CALENDAR,
        name: "Calendar Event Reminders",
        description: "Exact alerts for scheduled calendar notes and reminders",
        importance: 5,
        visibility: 1,
        vibration: true,
      });

      // Add foreground reception listener
      await LocalNotifications.addListener("localNotificationReceived", (notification) => {
        const settings = loadNotificationSettings();
        if (settings.enabled) {
          playChime(settings.ringtone, settings.customRingtoneDataUrl);
        }
      });
    } catch (err) {
      console.warn("Could not register native notification channels:", err);
    }
  }
}

/**
 * Checks current notification permission state
 */
export async function checkNotificationPermission(): Promise<"granted" | "denied" | "prompt" | "unsupported"> {
  if (isNativeCapacitor()) {
    try {
      const status: PermissionStatus = await LocalNotifications.checkPermissions();
      if (status.display === "granted") return "granted";
      if (status.display === "denied") return "denied";
      return "prompt";
    } catch {
      return "denied";
    }
  }

  // Web Browser environment
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "granted") return "granted";
    if (Notification.permission === "denied") return "denied";
    return "prompt";
  }

  return "unsupported";
}

/**
 * Requests notification permissions from the user
 */
export async function requestNotificationPermission(): Promise<{
  granted: boolean;
  status: "granted" | "denied" | "prompt" | "unsupported";
  message: string;
}> {
  if (isNativeCapacitor()) {
    try {
      const result = await LocalNotifications.requestPermissions();
      const granted = result.display === "granted";
      const status = granted ? "granted" : result.display === "denied" ? "denied" : "prompt";
      return {
        granted,
        status,
        message: granted
          ? "Notification permission granted successfully!"
          : "Notification permission was not granted. On Android, please ensure notifications are enabled in App Settings.",
      };
    } catch (err: any) {
      return {
        granted: false,
        status: "denied",
        message: `Permission request error: ${err?.message || "Unknown error"}`,
      };
    }
  }

  // Web Browser
  if (typeof window !== "undefined" && "Notification" in window) {
    try {
      const res = await Notification.requestPermission();
      const granted = res === "granted";
      const status = granted ? "granted" : res === "denied" ? "denied" : "prompt";
      return {
        granted,
        status,
        message: granted
          ? "Browser notification permission granted!"
          : "Browser notification permission was denied or dismissed.",
      };
    } catch (err: any) {
      return {
        granted: false,
        status: "denied",
        message: `Browser permission error: ${err?.message || "Unknown error"}`,
      };
    }
  }

  return {
    granted: false,
    status: "unsupported",
    message: "Notifications are not supported in this environment.",
  };
}

/**
 * Dispatches an immediate test notification with ringtone
 */
export async function sendTestNotification(): Promise<{ success: boolean; message: string }> {
  const settings = loadNotificationSettings();
  if (!settings.enabled) {
    return {
      success: false,
      message: "Notifications are currently switched off in settings. Turn them ON first.",
    };
  }

  const permStatus = await checkNotificationPermission();
  if (permStatus !== "granted") {
    const req = await requestNotificationPermission();
    if (!req.granted) {
      return {
        success: false,
        message: "Notification permission is required to deliver alerts. " + req.message,
      };
    }
  }

  // Play audio chime preview
  playChime(settings.ringtone, settings.customRingtoneDataUrl);

  if (isNativeCapacitor()) {
    try {
      // Cancel previous test notification to prevent stacking
      try {
        await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_IDS.TEST_NOTIFICATION }] });
      } catch {}

      await LocalNotifications.schedule({
        notifications: [
          {
            id: NOTIFICATION_IDS.TEST_NOTIFICATION,
            title: "🔔 Calcu Pro Test Notification",
            body: "Your notifications and sound chimes are configured properly!",
            channelId: CHANNEL_REMINDERS,
            schedule: { at: new Date(Date.now() + 500), allowWhileIdle: true },
            sound: "beep.wav",
          },
        ],
      });

      return {
        success: true,
        message: "Test notification sent! Check your notification tray.",
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Native notification failed: ${err?.message || err}`,
      };
    }
  }

  // Web Fallback
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    try {
      new Notification("🔔 Calcu Pro Test Notification", {
        body: "Your notifications and sound chimes are active in this browser!",
        icon: "/favicon.ico",
      });
      return {
        success: true,
        message: "Browser notification fired! Audio chime played.",
      };
    } catch (e: any) {
      return {
        success: true,
        message: "Audio chime played! (In-browser notifications restricted by browser policy)",
      };
    }
  }

  return {
    success: true,
    message: "Test audio chime played successfully!",
  };
}

/**
 * Schedules the user's daily reminder
 */
export async function applyDailyReminderSchedule(settings: NotificationSettings): Promise<boolean> {
  if (!isNativeCapacitor()) {
    return true;
  }

  try {
    // Always cancel existing daily reminder first to guarantee no duplicate IDs
    await LocalNotifications.cancel({
      notifications: [{ id: NOTIFICATION_IDS.DAILY_REMINDER }],
    });

    if (!settings.enabled || !settings.dailyReminderEnabled) {
      return true;
    }

    const [hourStr, minStr] = settings.dailyReminderTime.split(":");
    const hour = parseInt(hourStr, 10) || 9;
    const minute = parseInt(minStr, 10) || 0;

    await LocalNotifications.schedule({
      notifications: [
        {
          id: NOTIFICATION_IDS.DAILY_REMINDER,
          title: "☀️ Calcu Pro Daily Check-in",
          body: "Review your grocery lists, financial plans, and calendar reminders.",
          channelId: CHANNEL_REMINDERS,
          schedule: {
            on: {
              hour,
              minute,
            },
            allowWhileIdle: true,
          },
        },
      ],
    });

    return true;
  } catch (err) {
    console.warn("Failed to apply daily reminder schedule:", err);
    return false;
  }
}

/**
 * Schedules a notification for a calendar event exactly at scheduled date & time
 */
export async function scheduleCalendarEventNotification(event: {
  id: string;
  text: string;
  dateStr: string; // YYYY-MM-DD
  time?: string; // HH:MM
}): Promise<boolean> {
  const settings = loadNotificationSettings();
  if (!settings.enabled || !settings.calendarRemindersEnabled) {
    return false;
  }

  const eventNotifId = getCalendarEventNotificationId(event.id);
  if (!event.dateStr) return false;

  // Compute trigger Date
  let triggerTime: Date;
  if (event.time && /^\d{2}:\d{2}$/.test(event.time)) {
    const [hh, mm] = event.time.split(":").map(Number);
    const [year, month, day] = event.dateStr.split("-").map(Number);
    triggerTime = new Date(year, month - 1, day, hh, mm, 0);
  } else {
    // Default to 09:00 AM on the event date if time wasn't specified
    const [year, month, day] = event.dateStr.split("-").map(Number);
    triggerTime = new Date(year, month - 1, day, 9, 0, 0);
  }

  // If time is in the past, do not schedule
  if (triggerTime.getTime() <= Date.now()) {
    return false;
  }

  if (isNativeCapacitor()) {
    try {
      try {
        await LocalNotifications.cancel({
          notifications: [{ id: eventNotifId }],
        });
      } catch {}

      await LocalNotifications.schedule({
        notifications: [
          {
            id: eventNotifId,
            title: `📅 Reminder: ${event.text}`,
            body: `Scheduled for ${event.dateStr}${event.time ? ` at ${event.time}` : ""}`,
            channelId: CHANNEL_CALENDAR,
            schedule: {
              at: triggerTime,
              allowWhileIdle: true,
            },
          },
        ],
      });
      return true;
    } catch (err) {
      console.warn(`Failed to schedule calendar notification ${eventNotifId}:`, err);
      return false;
    }
  }

  return true;
}

/**
 * Cancels a calendar event notification
 */
export async function cancelCalendarEventNotification(eventId: string): Promise<void> {
  const notifId = getCalendarEventNotificationId(eventId);
  if (isNativeCapacitor()) {
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: notifId }],
      });
    } catch (err) {
      console.warn("Could not cancel calendar notification:", err);
    }
  }
}

/**
 * Syncs all saved calendar events to ensure proper background notifications on app launch
 */
export async function syncAllCalendarNotifications(): Promise<void> {
  try {
    const raw = localStorage.getItem("suite_calendar_events");
    if (!raw) return;
    const events: Array<{ id: string; text: string; dateStr: string; time?: string }> = JSON.parse(raw);
    const settings = loadNotificationSettings();

    if (!settings.enabled || !settings.calendarRemindersEnabled) return;

    for (const ev of events) {
      await scheduleCalendarEventNotification(ev);
    }
  } catch (err) {
    console.warn("Failed to sync calendar notifications:", err);
  }
}

/**
 * Send an event notification immediately or in foreground
 */
export async function triggerImmediateReminderAlert(title: string, message: string): Promise<void> {
  const settings = loadNotificationSettings();
  if (!settings.enabled) return;

  playChime(settings.ringtone, settings.customRingtoneDataUrl);

  if (isNativeCapacitor()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 80000) + 10000,
            title,
            body: message,
            channelId: CHANNEL_REMINDERS,
            schedule: { at: new Date(Date.now() + 200), allowWhileIdle: true },
          },
        ],
      });
    } catch {}
  } else if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, { body: message });
    } catch {}
  }
        }
