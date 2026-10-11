# Capacitor 7 Local Notifications & Reminder Engine for Calcu Pro

Implement a production-grade, background-capable Local Notifications and Scheduled Reminders feature for the Calcu Pro app, fully compatible with **Capacitor 7** and **Android APK GitHub Actions** builds, while keeping graceful web browser support and preserving all existing calculator features and user data.

---

## 1. Overview & Architecture

### Key Objectives
1. **Capacitor 7 Native Notifications**:
   - Install `@capacitor/core` and `@capacitor/local-notifications` (v7 compatible).
   - Update `package.json` and lockfile so existing GitHub Actions workflow builds the APK smoothly without version mismatch or missing peer dependencies.
2. **Stable Notification Architecture**:
   - Assign deterministic numeric 32-bit integer IDs (required by Android/Capacitor NotificationManager) for reminders, daily alerts, and test notifications so editing, rescheduling, or disabling never generates duplicate notifications.
   - Use Android Notification Channels (`calcu_pro_reminders`, `calcu_pro_daily`, `calcu_pro_general`) with high importance, vibration, and custom sound options.
3. **Dedicated Notifications & Reminders Settings Section**:
   - Add a dedicated **"Notifications & Reminders"** panel inside the Drawer Settings matching Calcu Pro's theme system (Cosmic, Neumorphic, Financial, Minimalist).
   - Controls:
     - Master Notifications toggle (Enable/Disable).
     - System Permission status badge with **"Request Notification Permission"** button & guidance for Android 13+ (POST_NOTIFICATIONS) and system settings.
     - **Test Notification** button with instant feedback (delivers immediately or 5-second delay, reporting exact status or permission errors).
     - **Daily Reminder** scheduler: User-selectable time (e.g. 09:00 AM) and frequency (Daily, Weekdays), with quick Enable/Disable without duplicating.
     - **Calendar Reminder Sync**: Integrate with existing Interactive Calendar reminders so dated & timed events schedule exact local notifications.
4. **Custom Audio & Synthesized Ringtones**:
   - Web Audio tone generator for instant in-app previews + native notification sound configuration.
5. **Universal Platform Support & Safety**:
   - Detects whether running inside native Capacitor environment (`Capacitor.isNativePlatform()`) or a web browser.
   - In web browsers, seamlessly falls back to standard `Notification` API and in-app banner alerts without crashing or throwing errors.
   - Explains browser vs native Android background behavior clearly.
6. **Data Preservation**:
   - Stored in `localStorage` (`calcu_pro_notification_settings`, `calcu_pro_scheduled_reminders`).
   - Zero modification to existing calculator logs, grocery lists, or settings.

---

## 2. Notification ID Allocation & Strategy

Capacitor `LocalNotifications` requires 32-bit positive integers for notification IDs:
- `1001`: **Test Notification** (replaces test notifications cleanly)
- `2001`: **Daily Scheduled Reminder** (deterministic single ID, update or cancel without duplication)
- `3000 + hash(calendarEventId)`: **Calendar Event Reminders** (stable hash from event ID and date)

---

## 3. Implementation Steps

### Step 1: Install Capacitor 7 Dependencies
- Install `@capacitor/core@^7.0.0` and `@capacitor/local-notifications@^7.0.0`.
- Verify `package.json` and compile applet cleanly.

### Step 2: Create Notification Service (`src/utils/notificationService.ts`)
- Wrapper handling:
  - Capacitor detection (`Capacitor.isPluginAvailable('LocalNotifications')`, `Capacitor.isNativePlatform()`).
  - Permission check & request (`LocalNotifications.checkPermissions()`, `LocalNotifications.requestPermissions()`, `Notification.requestPermission()` fallback).
  - Android notification channel creation:
    - `calcu_pro_reminders`: "Calcu Pro Reminders" (High importance, sound, vibration)
    - `calcu_pro_daily`: "Daily Calculator Digest"
  - Scheduling daily recurring reminders using `schedule({ notifications: [...] })` with `every: 'day'` or `on: { hour, minute }`.
  - Cancelling specific IDs (`LocalNotifications.cancel({ notifications: [{ id }] })`).
  - Scheduling exact calendar reminders.
  - Sending immediate test notifications.
  - Getting pending scheduled notifications for diagnostics.

### Step 3: Create Audio Synthesizer Engine (`src/utils/soundEngine.ts`)
- Synthesizes 5 customizable ringtones using the Web Audio API for browser mode & audio preview:
  - *Crystal Chime*
  - *Digital Beep*
  - *Upbeat Marimba*
  - *Zen Bell*
  - *Double Pulse Alarm*
- Audio upload reader and playback for custom ringtone preferences.

### Step 4: Build Notifications & Reminders UI Component (`src/components/NotificationSettingsModal.tsx` or drawer section)
- Add a dedicated Notifications & Reminders section in `App.tsx` (accessible from Drawer Menu -> Settings and quick icon).
- UI Elements:
  - Master switch: On/Off.
  - System Permission banner (Granted / Denied / Default) with actionable "Grant Permission" button and instructions for Android Settings.
  - Test Notification trigger (instant 3-second test) with live toast confirmation.
  - Daily Reminder card:
    - Time selector (e.g. `09:00 AM`).
    - Frequency selector (Every day, Weekdays).
    - Status indicator showing whether it's actively scheduled in the system.
    - Cancel / Remove reminder button.
  - Ringtone customizer with sound preview.
  - Platform detection indicator:
    - "Native Android Mode (Capacitor)" -> Background alarms active even when app closed.
    - "Web Browser Mode" -> In-app and browser notifications active while tab is alive.

### Step 5: Connect Calendar Reminders in `InteractiveCalendar.tsx`
- When user creates or edits a calendar event with a date and time, automatically schedule a native Local Notification via `notificationService.scheduleCalendarReminder(event)`.
- If deleted, cancel the specific notification ID.
- Display a small bell icon next to timed calendar events.

### Step 6: App Startup Schedule Restoration in `App.tsx`
- On app launch (`useEffect`), read user reminder settings and ensure the scheduled notification is in sync with the OS alarm scheduler without re-creating duplicates.

---

## 4. Phone-Friendly Android APK Rebuild & Testing Steps

Provide clear, step-by-step instructions for the user to:
1. Commit changes to their `android-apk` branch on GitHub using the phone browser / AI Studio commit.
2. Watch the GitHub Actions APK workflow run.
3. Download the generated `app-release.apk` directly on Android phone.
4. Install and test notification permissions, background daily alert, and calendar event reminders.

---

## 5. Verification & Testing Checklist

- [ ] `compile_applet` passes without errors.
- [ ] No regression in Core Calculator, Scientific parser, Sub-calculators, or Grocery list.
- [ ] Notifications work both in Capacitor native environment and gracefully degrade in Web browser.
- [ ] Deterministic IDs prevent duplicate notifications.
- [ ] Scheduled daily reminder time can be changed and cancelled cleanly.
- [ ] Test notification fires reliably and reports permission status.
