import React, { useState, useEffect } from "react";
import { Clock, Globe, ChevronDown, Sliders, Settings, Check, X } from "lucide-react";
import { Theme, TimeZoneOption } from "../types";

export type ClockStyle = "3d-flip" | "holographic" | "cyber-led";

export const TIME_ZONES: TimeZoneOption[] = [
  { city: "Local Time", timezone: "local", country: "" },
  { city: "New York", timezone: "America/New_York", country: "USA" },
  { city: "London", timezone: "Europe/London", country: "UK" },
  { city: "Paris", timezone: "Europe/Paris", country: "France" },
  { city: "Dubai", timezone: "Asia/Dubai", country: "UAE" },
  { city: "Mumbai", timezone: "Asia/Kolkata", country: "India" },
  { city: "Tokyo", timezone: "Asia/Tokyo", country: "Japan" },
  { city: "Sydney", timezone: "Australia/Sydney", country: "Australia" },
  { city: "UTC", timezone: "UTC", country: "Global" },
];

interface FlipClockProps {
  theme: Theme;
  clockStyle: ClockStyle;
  activeZone: TimeZoneOption;
  isHeader?: boolean;
}

// 3D Split-Flap Digit component with perspective rotation
function FlipDigit3D({ digit, theme }: { digit: string; theme: Theme }) {
  const [curr, setCurr] = useState(digit);
  const [next, setNext] = useState(digit);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (digit !== curr) {
      setNext(digit);
      setFlipping(true);
      const t = setTimeout(() => {
        setCurr(digit);
        setFlipping(false);
      }, 350);
      return () => clearTimeout(t);
    }
  }, [digit, curr]);

  const getStyles = () => {
    switch (theme) {
      case "neumorphic":
        return {
          bg: "bg-[#141414] text-[#00E676] drop-shadow-[0_0_4px_rgba(0,230,118,0.7)]",
          border: "border-zinc-800/80",
          divider: "bg-black/90",
        };
      case "financial":
        return {
          bg: "bg-[#DFDFCB] text-[#556B2F]",
          border: "border-[#BCBCA6]",
          divider: "bg-[#BCBCA6]/60",
        };
      case "cosmic":
        return {
          bg: "bg-gradient-to-b from-[#0f172a] to-[#040814] text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]",
          border: "border-white/5 shadow-inner",
          divider: "bg-slate-950",
        };
      case "minimalist":
      default:
        return {
          bg: "bg-gray-100 text-gray-800",
          border: "border-gray-200",
          divider: "bg-gray-300",
        };
    }
  };

  const s = getStyles();

  return (
    <div className="relative w-6 h-9 perspective-3d" style={{ perspective: "150px" }}>
      {/* Static Upper Half */}
      <div className={`absolute inset-x-0 top-0 h-1/2 overflow-hidden rounded-t-md border-t border-x ${s.border} ${s.bg} flex items-end justify-center`}>
        <span className="text-[14px] font-black leading-none translate-y-1/2 font-mono">{next}</span>
      </div>
      {/* Static Lower Half */}
      <div className={`absolute inset-x-0 bottom-0 h-1/2 overflow-hidden rounded-b-md border-b border-x ${s.border} ${s.bg} flex items-start justify-center`}>
        <span className="text-[14px] font-black leading-none -translate-y-1/2 font-mono">{curr}</span>
      </div>

      {/* Animating upper card rotating down */}
      <div
        className={`absolute inset-x-0 top-0 h-1/2 overflow-hidden rounded-t-md border-t border-x ${s.border} ${s.bg} flex items-end justify-center origin-bottom transition-all duration-300 ease-in preserve-3d backface-hidden`}
        style={{
          transform: flipping ? "rotateX(-90deg)" : "rotateX(0deg)",
          zIndex: flipping ? 30 : 10,
        }}
      >
        <span className="text-[14px] font-black leading-none translate-y-1/2 font-mono">{curr}</span>
      </div>

      {/* Animating lower card rotating to standard */}
      <div
        className={`absolute inset-x-0 bottom-0 h-1/2 overflow-hidden rounded-b-md border-b border-x ${s.border} ${s.bg} flex items-start justify-center origin-top transition-all duration-300 ease-out preserve-3d backface-hidden`}
        style={{
          transform: flipping ? "rotateX(0deg)" : "rotateX(90deg)",
          zIndex: flipping ? 40 : 10,
        }}
      >
        <span className="text-[14px] font-black leading-none -translate-y-1/2 font-mono">{next}</span>
      </div>

      {/* Center divide line */}
      <div className={`absolute top-1/2 left-0 right-0 h-[1px] z-50 ${s.divider}`} />
      
      {/* Notch details */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[1.5px] h-1 bg-black/40 rounded-r z-50" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[1.5px] h-1 bg-black/40 rounded-l z-50" />
    </div>
  );
}

// 1. Split-Flap Clock Face
function SplitFlapClockFace({ hours, minutes, seconds, ampm, theme }: { hours: string; minutes: string; seconds: string; ampm: string; theme: Theme }) {
  const getUnitStyle = () => {
    switch (theme) {
      case "neumorphic":
        return "bg-black/50 text-[#00E676] border-zinc-800/80 drop-shadow-[0_0_4px_rgba(0,230,118,0.6)]";
      case "financial":
        return "bg-[#DFDFCB]/50 text-[#556B2F] border-[#BCBCA6]";
      case "cosmic":
        return "bg-slate-950/40 text-cyan-400 border-white/5 drop-shadow-[0_0_5px_rgba(34,211,238,0.6)]";
      case "minimalist":
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="flex items-center space-x-1.5 py-0.5">
      <div className="flex items-center space-x-0.5">
        <FlipDigit3D digit={hours[0]} theme={theme} />
        <FlipDigit3D digit={hours[1]} theme={theme} />
      </div>
      <div className="text-sm font-black opacity-60 font-mono animate-pulse text-slate-400">:</div>
      <div className="flex items-center space-x-0.5">
        <FlipDigit3D digit={minutes[0]} theme={theme} />
        <FlipDigit3D digit={minutes[1]} theme={theme} />
      </div>
      <div className="text-sm font-black opacity-40 font-mono animate-pulse text-slate-400">:</div>
      <div className="flex items-center space-x-0.5">
        <FlipDigit3D digit={seconds[0]} theme={theme} />
        <FlipDigit3D digit={seconds[1]} theme={theme} />
      </div>
      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md border font-mono ml-1.5 shrink-0 ${getUnitStyle()}`}>
        {ampm}
      </span>
    </div>
  );
}

// 2. Holographic Concentric Dial Face
function HolographicClockFace({ hours, minutes, seconds, hNum, mNum, sNum, ampm, theme }: any) {
  const size = 56;
  const center = size / 2;
  const rHr = 21;
  const rMin = 16;
  const rSec = 11;

  const cHr = 2 * Math.PI * rHr;
  const cMin = 2 * Math.PI * rMin;
  const cSec = 2 * Math.PI * rSec;

  const offsetHr = cHr - (hNum / 24) * cHr;
  const offsetMin = cMin - (mNum / 60) * cMin;
  const offsetSec = cSec - (sNum / 60) * cSec;

  const getColors = () => {
    switch (theme) {
      case "neumorphic":
        return { 
          hr: "#00E676", 
          min: "#ffffff", 
          sec: "#555555",
          glowHr: "drop-shadow-[0_0_4px_rgba(0,230,118,0.85)]",
          glowMin: "drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]"
        };
      case "financial":
        return { 
          hr: "#556B2F", 
          min: "#8B8B7A", 
          sec: "#C5C5B2",
          glowHr: "",
          glowMin: ""
        };
      case "cosmic":
        return { 
          hr: "#22d3ee", 
          min: "#a855f7", 
          sec: "#ec4899",
          glowHr: "drop-shadow-[0_0_5px_rgba(34,211,238,0.9)]",
          glowMin: "drop-shadow-[0_0_3px_rgba(168,85,247,0.7)]"
        };
      case "minimalist":
      default:
        return { 
          hr: "#111827", 
          min: "#4b5563", 
          sec: "#9ca3af",
          glowHr: "",
          glowMin: ""
        };
    }
  };

  const colors = getColors();

  return (
    <div className="flex items-center space-x-3 py-0.5">
      <div className="relative w-14 h-14 shrink-0">
        <svg className="w-full h-full transform -rotate-90">
          {/* Hour Circle */}
          <circle cx={center} cy={center} r={rHr} fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="1.5" />
          <circle
            cx={center}
            cy={center}
            r={rHr}
            fill="transparent"
            stroke={colors.hr}
            strokeWidth="2.2"
            strokeDasharray={cHr}
            strokeDashoffset={offsetHr}
            strokeLinecap="round"
            className={`transition-all duration-500 ease-out ${colors.glowHr}`}
          />

          {/* Minute Circle */}
          <circle cx={center} cy={center} r={rMin} fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="1.5" />
          <circle
            cx={center}
            cy={center}
            r={rMin}
            fill="transparent"
            stroke={colors.min}
            strokeWidth="2"
            strokeDasharray={cMin}
            strokeDashoffset={offsetMin}
            strokeLinecap="round"
            className={`transition-all duration-300 ease-out ${colors.glowMin}`}
          />

          {/* Second Circle */}
          <circle cx={center} cy={center} r={rSec} fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          <circle
            cx={center}
            cy={center}
            r={rSec}
            fill="transparent"
            stroke={colors.sec}
            strokeWidth="1.5"
            strokeDasharray={cSec}
            strokeDashoffset={offsetSec}
            strokeLinecap="round"
            className="transition-all duration-100 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[7px] uppercase font-bold tracking-wider opacity-60 font-mono leading-none">{ampm}</span>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="text-lg font-black font-mono tracking-wide flex items-center leading-none">
          <span className={theme === "neumorphic" ? "text-[#00E676] drop-shadow-[0_0_5px_rgba(0,230,118,0.7)]" : theme === "cosmic" ? "text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.7)]" : ""}>{hours}</span>
          <span className="animate-pulse mx-0.5 opacity-60 text-slate-400">:</span>
          <span>{minutes}</span>
          <span className="animate-pulse mx-0.5 opacity-30 text-slate-400">:</span>
          <span className="text-xs text-slate-500 font-semibold">{seconds}</span>
        </div>
        <span className="text-[7px] text-slate-400 uppercase tracking-widest font-extrabold mt-0.5 leading-none">Holo Orb</span>
      </div>
    </div>
  );
}

// 3. Cyber LED panel Clock Face
function CyberLedClockFace({ hours, minutes, seconds, ampm, theme }: { hours: string; minutes: string; seconds: string; ampm: string; theme: Theme }) {
  const getPanelColors = () => {
    switch (theme) {
      case "neumorphic":
        return "text-[#00E676] bg-black/55 border-zinc-800/80 drop-shadow-[0_0_5px_rgba(0,230,118,0.75)]";
      case "financial":
        return "text-[#556B2F] bg-[#E2E2CE]/40 border-[#BCBCA6]";
      case "cosmic":
        return "text-cyan-400 bg-black/60 border-cyan-500/20 drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]";
      case "minimalist":
      default:
        return "text-gray-900 bg-gray-100 border-gray-200";
    }
  };

  return (
    <div className={`relative overflow-hidden flex items-center space-x-2 px-3 py-1.5 rounded-xl border ${getPanelColors()} shadow-inner`}>
      {/* Segment background simulation behind content */}
      <div className="absolute inset-0 px-3 py-1.5 flex items-center select-none pointer-events-none opacity-5 font-mono text-lg font-black tracking-wide">
        <span>88</span>
        <span className="mx-0.5">:</span>
        <span>88</span>
        <span className="mx-0.5">:</span>
        <span>88</span>
      </div>

      <div className="relative z-10 flex items-baseline space-x-0.5">
        <span className="text-lg font-black font-mono tracking-wide">{hours}</span>
        <span className="text-base font-mono opacity-50 animate-pulse">:</span>
        <span className="text-lg font-black font-mono tracking-wide">{minutes}</span>
        <span className="text-base font-mono opacity-50 animate-pulse">:</span>
        <span className="text-sm font-bold font-mono tracking-wide opacity-90">{seconds}</span>
      </div>
      <div className="relative z-10 flex flex-col ml-2 pl-2 border-l border-current/20 justify-center">
        <span className="text-[8px] font-black font-mono leading-none">{ampm}</span>
        <span className="text-[6px] uppercase tracking-widest opacity-50 font-extrabold mt-0.5">GRID</span>
      </div>
    </div>
  );
}

export default function FlipClock({ theme, clockStyle, activeZone, isHeader }: FlipClockProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getFormattedTime = (timezone: string) => {
    if (timezone === "local") {
      const hours = currentTime.getHours().toString().padStart(2, "0");
      const minutes = currentTime.getMinutes().toString().padStart(2, "0");
      const seconds = currentTime.getSeconds().toString().padStart(2, "0");
      const ampm = currentTime.getHours() >= 12 ? "PM" : "AM";
      return { hours, minutes, seconds, ampm, hNum: currentTime.getHours(), mNum: currentTime.getMinutes(), sNum: currentTime.getSeconds() };
    }

    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      });
      const parts = formatter.formatToParts(currentTime);
      let hours = parts.find((p) => p.type === "hour")?.value || "00";
      const minutes = parts.find((p) => p.type === "minute")?.value || "00";
      const seconds = parts.find((p) => p.type === "second")?.value || "00";
      
      if (hours === "24") {
        hours = "00";
      }
      
      const hNum = parseInt(hours, 10);
      const mNum = parseInt(minutes, 10);
      const sNum = parseInt(seconds, 10);
      const ampm = hNum >= 12 ? "PM" : "AM";
      return { hours, minutes, seconds, ampm, hNum, mNum, sNum };
    } catch (e) {
      return { hours: "00", minutes: "00", seconds: "00", ampm: "AM", hNum: 0, mNum: 0, sNum: 0 };
    }
  };

  const getThemeStyles = () => {
    switch (theme) {
      case "neumorphic":
        return {
          card: "bg-[#141414] border border-zinc-800/60 shadow-[inset_1px_1px_4px_rgba(0,0,0,0.8),_1px_1px_8px_rgba(0,0,0,0.5)] rounded-2xl py-2 px-3 sm:px-4 text-gray-100",
          accentText: "text-[#00E676] drop-shadow-[0_0_4px_rgba(0,230,118,0.7)]",
        };
      case "financial":
        return {
          card: "bg-[#E6E6D4] border border-[#C5C5B2] shadow-sm rounded-2xl py-2 px-3 sm:px-4 text-[#3C3C30]",
          accentText: "text-[#556B2F]",
        };
      case "cosmic":
        return {
          card: "backdrop-blur-md bg-white/5 border border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] rounded-2xl py-2 px-3 sm:px-4 text-white",
          accentText: "text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]",
        };
      case "minimalist":
      default:
        return {
          card: "bg-white border border-[#E5E5E5] shadow-sm rounded-2xl py-2 px-3 sm:px-4 text-gray-800",
          accentText: "text-gray-900",
        };
    }
  };

  const s = getThemeStyles();
  const { hours, minutes, seconds, ampm, hNum, mNum, sNum } = getFormattedTime(activeZone.timezone);

  if (isHeader) {
    return (
      <div className="relative flex items-center justify-center" id="nexus-world-clock-header">
        <div className="flex flex-row items-center gap-3.5 flex-nowrap">
          {/* Left Side: Timezone Label */}
          <div className="hidden sm:flex items-center space-x-1.5 min-w-0">
            <div className="p-1 rounded-lg bg-black/10 dark:bg-white/5 flex items-center justify-center shrink-0">
              <Clock className={`w-3 h-3 ${s.accentText}`} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[7.5px] uppercase tracking-widest font-extrabold text-slate-500 leading-none mb-0.5 flex items-center gap-0.5 truncate">
                {activeZone.city === "Local Time" ? "Local" : activeZone.city}
              </span>
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-300 truncate leading-none">
                {activeZone.country ? activeZone.country : "Device"}
              </span>
            </div>
          </div>

          {/* Center: Main Unified Clock Face */}
          <div className="flex items-center justify-center py-0.5 shrink-0 relative z-10">
            {clockStyle === "3d-flip" && (
              <SplitFlapClockFace hours={hours} minutes={minutes} seconds={seconds} ampm={ampm} theme={theme} />
            )}
            {clockStyle === "holographic" && (
              <HolographicClockFace hours={hours} minutes={minutes} seconds={seconds} hNum={hNum} mNum={mNum} sNum={sNum} ampm={ampm} theme={theme} />
            )}
            {clockStyle === "cyber-led" && (
              <CyberLedClockFace hours={hours} minutes={minutes} seconds={seconds} ampm={ampm} theme={theme} />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${s.card} relative min-h-[58px] flex items-center justify-center`} id="nexus-world-clock-container">
      <div className="w-full flex flex-row items-center justify-between gap-2.5 sm:gap-4 flex-nowrap">
        
        {/* Left Side: Timezone Label */}
        <div className="flex items-center space-x-1.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-black/10 dark:bg-white/5 flex items-center justify-center shrink-0">
            <Clock className={`w-3.5 h-3.5 ${s.accentText}`} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[7.5px] uppercase tracking-widest font-extrabold text-slate-500 leading-none mb-1 flex items-center gap-0.5 truncate">
              <Globe className="w-2.5 h-2.5 opacity-60 shrink-0" />
              {activeZone.city === "Local Time" ? "Local" : activeZone.city}
            </span>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-300 truncate leading-none">
              {activeZone.country ? activeZone.country : "Device"}
            </span>
          </div>
        </div>

        {/* Center: Main Unified Clock Face */}
        <div className="flex items-center justify-center py-0.5 shrink-0 relative z-10">
          {clockStyle === "3d-flip" && (
            <SplitFlapClockFace hours={hours} minutes={minutes} seconds={seconds} ampm={ampm} theme={theme} />
          )}
          {clockStyle === "holographic" && (
            <HolographicClockFace hours={hours} minutes={minutes} seconds={seconds} hNum={hNum} mNum={mNum} sNum={sNum} ampm={ampm} theme={theme} />
          )}
          {clockStyle === "cyber-led" && (
            <CyberLedClockFace hours={hours} minutes={minutes} seconds={seconds} ampm={ampm} theme={theme} />
          )}
        </div>

        {/* Dummy right spacer to balance left timezone column visually */}
        <div className="w-[85px] sm:w-[110px] hidden xs:block shrink-0" />

      </div>
    </div>
  );
}

