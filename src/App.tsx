import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Menu,
  X,
  Calculator,
  ShoppingCart,
  Palette,
  RotateCcw,
  Percent,
  Coins,
  Users,
  Shuffle,
  Calendar,
  DollarSign,
  Heart,
  Lightbulb,
  Sparkles,
  Globe,
  Clock,
  History,
  CloudSun,
  Search,
  Plus,
  ChevronDown,
  Settings,
  ArrowLeft,
} from "lucide-react";

import { Theme, ViewMode, SubCalculatorType, HistoryItem, TimeZoneOption } from "./types";
import FlipClock, { TIME_ZONES, ClockStyle } from "./components/FlipClock";
import CoreCalculator from "./components/CoreCalculator";
import SubCalculators from "./components/SubCalculators";
import GroceryList from "./components/GroceryList";
import AiAssistant from "./components/AiAssistant";
import InteractiveCalendar from "./components/InteractiveCalendar";

export default function App() {
  const [theme, setTheme] = useState<Theme>("cosmic");
  const [viewMode, setViewMode] = useState<ViewMode>("calculator");
  const [activeSub, setActiveSub] = useState<SubCalculatorType | null>(null); // null means Core Calculator
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDrawerSettings, setShowDrawerSettings] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (!isMenuOpen) {
      setShowDrawerSettings(false);
    }
  }, [isMenuOpen]);

  // Load clock style and active zone from localStorage
  const [clockStyle, setClockStyle] = useState<ClockStyle>(() => {
    const saved = localStorage.getItem("clock_global_style");
    return (saved as ClockStyle) || "3d-flip";
  });

  const [activeZone, setActiveZone] = useState<TimeZoneOption>(() => {
    const saved = localStorage.getItem("clock_active_zone");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return TIME_ZONES[0];
  });

  const handleStyleChange = (style: ClockStyle) => {
    setClockStyle(style);
    localStorage.setItem("clock_global_style", style);
  };

  const handleZoneSelect = (zone: TimeZoneOption) => {
    setActiveZone(zone);
    localStorage.setItem("clock_active_zone", JSON.stringify(zone));
  };

  // Weather States and Action Handlers
  const [savedWeatherLocations, setSavedWeatherLocations] = useState<string[]>(() => {
    const saved = localStorage.getItem("saved_weather_locations");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return ["New York", "London", "Tokyo"]; // default starting locations
  });

  const [weatherSearchQuery, setWeatherSearchQuery] = useState("");
  const [isWeatherExpanded, setIsWeatherExpanded] = useState(false);

  const handleAddWeatherLocation = (loc: string) => {
    const trimmed = loc.trim();
    if (!trimmed) return;
    // Prevent duplicates (case insensitive)
    if (savedWeatherLocations.some(l => l.toLowerCase() === trimmed.toLowerCase())) {
      setWeatherSearchQuery("");
      return;
    }
    const updated = [...savedWeatherLocations, trimmed];
    setSavedWeatherLocations(updated);
    localStorage.setItem("saved_weather_locations", JSON.stringify(updated));
    setWeatherSearchQuery("");
  };

  const handleRemoveWeatherLocation = (indexToRemove: number) => {
    const updated = savedWeatherLocations.filter((_, idx) => idx !== indexToRemove);
    setSavedWeatherLocations(updated);
    localStorage.setItem("saved_weather_locations", JSON.stringify(updated));
  };

  const handleSearchWeather = (loc: string) => {
    const trimmed = loc.trim();
    if (!trimmed) return;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(trimmed + " weather")}`;
    window.open(searchUrl, "_blank");
  };

  // Load calculation history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem("calc_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const addHistoryItem = (item: HistoryItem) => {
    const updated = [item, ...history].slice(0, 50); // limit to 50 items
    setHistory(updated);
    localStorage.setItem("calc_history", JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("calc_history");
  };

  // Reset application settings
  const handleResetAll = () => {
    if (confirm("Are you sure you want to reset all calculations, checklist items, and history?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // Themes class mapping
  const getThemeContainerClass = () => {
    switch (theme) {
      case "neumorphic":
        return "bg-[#141414] text-gray-100 min-h-screen font-sans selection:bg-[#00E676] selection:text-black relative";
      case "financial":
        return "bg-[#E6E6D4] text-[#3C3C30] min-h-screen font-sans selection:bg-[#556B2F] selection:text-white relative";
      case "cosmic":
        return "bg-[#05050a] text-slate-100 min-h-screen font-sans selection:bg-cyan-500 selection:text-black relative overflow-x-hidden";
      case "minimalist":
      default:
        return "bg-[#F5F5F5] text-gray-900 min-h-screen font-sans selection:bg-gray-900 selection:text-white relative";
    }
  };

  const getHeaderStyles = () => {
    switch (theme) {
      case "neumorphic":
        return "bg-[#1A1A1A] border-b border-[#2A2A2A] shadow-lg";
      case "financial":
        return "bg-[#DFDFCB] border-b border-[#C5C5B2] shadow-sm";
      case "cosmic":
        return "backdrop-blur-xl bg-[#05050a]/40 border-b border-white/10 shadow-lg";
      case "minimalist":
      default:
        return "bg-white border-b border-[#E5E5E5] shadow-sm";
    }
  };

  const getSidebarStyles = () => {
    switch (theme) {
      case "neumorphic":
        return "bg-[#1A1A1A] text-gray-100 border-r border-[#2A2A2A]";
      case "financial":
        return "bg-[#DFDFCB] text-[#3C3C30] border-r border-[#C5C5B2]";
      case "cosmic":
        return "backdrop-blur-xl bg-[#05050a]/95 text-white border-r border-white/10";
      case "minimalist":
      default:
        return "bg-white text-gray-800 border-r border-[#E5E5E5]";
    }
  };

  const getButtonActiveStyle = (active: boolean) => {
    if (!active) {
      return theme === "cosmic" ? "hover:bg-white/10 text-slate-400 border border-white/5" : "hover:bg-black/5 text-gray-500";
    }
    switch (theme) {
      case "neumorphic":
        return "bg-[#00E676] text-black font-bold shadow-[0_0_10px_rgba(0,230,118,0.3)]";
      case "financial":
        return "bg-[#556B2F] text-white font-bold";
      case "cosmic":
        return "bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-[0_10px_20px_rgba(6,182,212,0.3)] border border-cyan-400/30";
      case "minimalist":
      default:
        return "bg-gray-900 text-white font-semibold";
    }
  };

  return (
    <div className={getThemeContainerClass()} id="smart-calculator-suite-root">
      
      {/* Immersive UI Atmospheric Background Overlays */}
      {theme === "cosmic" && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[150px] rounded-full"></div>
        </div>
      )}
      
      {/* Header */}
      <header className={`sticky top-0 z-30 transition-all duration-300 ${getHeaderStyles()}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors relative z-10"
            id="sidebar-drawer-trigger"
            title="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Clock positioned in the header */}
          <div className="flex items-center relative z-10">
            <FlipClock theme={theme} clockStyle={clockStyle} activeZone={activeZone} isHeader={true} />
          </div>

        </div>
      </header>

      {/* Main Grid Body */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6" id="main-content-grid">
        
        <div className="max-w-4xl mx-auto w-full space-y-6" id="workspace-arena">
          {viewMode === "calculator" && !activeSub && (
            <CoreCalculator
              theme={theme}
              history={history}
              onAddHistory={addHistoryItem}
              onClearHistory={clearHistory}
            />
          )}
          
          {viewMode === "calculator" && activeSub && (
            <SubCalculators theme={theme} activeSub={activeSub} />
          )}

          {viewMode === "grocery" && (
            <GroceryList theme={theme} />
          )}

          {viewMode === "ai" && (
            <AiAssistant theme={theme} />
          )}
        </div>
      </main>

      {/* Slide Out Navigation Sidebar / Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex"
            id="sidebar-drawer-overlay"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              onClick={() => setIsMenuOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            />

            {/* Drawer Content */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className={`relative w-80 max-w-full flex flex-col p-6 shadow-2xl z-10 ${getSidebarStyles()}`}
              id="sidebar-drawer-panel"
            >
              <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-4 mb-5">
                {showDrawerSettings ? (
                  <button
                    onClick={() => setShowDrawerSettings(false)}
                    className="flex items-center space-x-1.5 text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Menu</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2 text-indigo-500">
                    <Calculator className="w-5 h-5" />
                    <span className="font-bold text-sm tracking-wider uppercase">Menu Navigation</span>
                  </div>
                )}
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                  id="sidebar-drawer-close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sidebar Scroller */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-1 scrollbar-thin">
                {showDrawerSettings ? (
                  <div className="space-y-6">
                    {/* Theme Settings Selection */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2.5">Select Suite Theme</span>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: "minimalist", label: "Minimalist" },
                          { id: "neumorphic", label: "Neumorphic" },
                          { id: "financial", label: "Financial" },
                          { id: "cosmic", label: "Cosmic Glass" },
                        ].map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setTheme(t.id as Theme)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                              theme === t.id
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                : "bg-black/5 dark:bg-white/5 text-gray-400 border-transparent hover:border-black/10 dark:hover:border-white/10"
                            }`}
                            id={`theme-selector-${t.id}`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Chrono Clock Settings */}
                    <div className="border-t border-black/5 dark:border-white/10 pt-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2.5">Chrono Clock Settings</span>
                      
                      {/* Timezone Select */}
                      <div className="space-y-1.5 mb-3.5">
                        <label className="text-[9px] uppercase font-extrabold tracking-wider text-gray-400 block">Timezone / Location</label>
                        <select
                          value={activeZone.timezone}
                          onChange={(e) => {
                            const selectedTz = TIME_ZONES.find(tz => tz.timezone === e.target.value);
                            if (selectedTz) handleZoneSelect(selectedTz);
                          }}
                          className={`w-full rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 cursor-pointer transition-colors border ${
                            theme === "cosmic"
                              ? "bg-slate-900 text-white border-white/10 focus:ring-cyan-500"
                              : theme === "neumorphic"
                              ? "bg-[#161616] text-[#00E676] border-zinc-800 focus:ring-[#00E676]"
                              : theme === "financial"
                              ? "bg-[#DFDFCB] text-[#3C3C30] border-[#C5C5B2] focus:ring-[#556B2F]"
                              : "bg-white text-gray-800 border-gray-200 focus:ring-gray-400"
                          }`}
                        >
                          {TIME_ZONES.map((tz) => (
                            <option key={tz.timezone} value={tz.timezone}>
                              {tz.city} {tz.country ? `(${tz.country})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Clock Style Grid */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-extrabold tracking-wider text-gray-400 block">Display Face Style</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: "3d-flip", label: "3D Flip" },
                            { id: "holographic", label: "Holo" },
                            { id: "cyber-led", label: "LED" },
                          ].map((styleOpt) => (
                            <button
                              key={styleOpt.id}
                              onClick={() => handleStyleChange(styleOpt.id as ClockStyle)}
                              className={`px-1.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer text-center ${
                                clockStyle === styleOpt.id
                                  ? theme === "cosmic"
                                    ? "bg-cyan-500/20 text-cyan-200 border-cyan-500"
                                    : theme === "neumorphic"
                                    ? "bg-[#00E676]/20 text-[#00E676] border-[#00E676]"
                                    : theme === "financial"
                                    ? "bg-[#556B2F]/20 text-[#556B2F] border-[#556B2F]"
                                    : "bg-gray-900 text-white border-gray-900"
                                  : "bg-black/5 dark:bg-white/5 text-gray-400 border-transparent hover:border-black/10 dark:hover:border-white/10"
                              }`}
                            >
                              {styleOpt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Core View Modes */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2.5">Primary Modes</span>
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            setViewMode("calculator");
                            setActiveSub(null);
                            setIsMenuOpen(false);
                          }}
                          className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer text-left transition-all ${
                            viewMode === "calculator" && !activeSub ? getButtonActiveStyle(true) : getButtonActiveStyle(false)
                          }`}
                        >
                          <Calculator className="w-4 h-4" />
                          <span>Scientific Parser Calculator</span>
                        </button>
                        <button
                          onClick={() => {
                            setViewMode("grocery");
                            setIsMenuOpen(false);
                          }}
                          className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer text-left transition-all ${
                            viewMode === "grocery" ? getButtonActiveStyle(true) : getButtonActiveStyle(false)
                          }`}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>Grocery & Checklist Mode</span>
                        </button>
                        <button
                          onClick={() => {
                            setViewMode("ai");
                            setIsMenuOpen(false);
                          }}
                          className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer text-left transition-all ${
                            viewMode === "ai" ? getButtonActiveStyle(true) : getButtonActiveStyle(false)
                          }`}
                        >
                          <Sparkles className="w-4 h-4 text-cyan-400" />
                          <span>Ai Chat</span>
                        </button>
                        
                        {/* Settings Tab inside Drawer */}
                        <button
                          onClick={() => {
                            setShowDrawerSettings(true);
                          }}
                          className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer text-left transition-all ${
                            showDrawerSettings ? getButtonActiveStyle(true) : getButtonActiveStyle(false)
                          }`}
                        >
                          <Settings className="w-4 h-4 text-indigo-500" />
                          <span>Settings</span>
                        </button>
                      </div>
                    </div>

                    {/* Utility Sub-Calculators */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2.5">Specialized Sub-Calculators</span>
                      <div className="space-y-1">
                        {[
                          { id: "discount", label: "Discount Optimizer", icon: Percent },
                          { id: "gst", label: "GST & Tax Calculator", icon: Coins },
                          { id: "split", label: "Split-Bill & Tip Tool", icon: Users },
                          { id: "unit", label: "Unit Converter Hub", icon: Shuffle },
                          { id: "age", label: "Age & Birthday Chrono", icon: Calendar },
                          { id: "emi", label: "EMI Financial Planner", icon: DollarSign },
                          { id: "bmi", label: "BMI Health Meter", icon: Heart },
                          { id: "constants", label: "Scientific Constants", icon: Lightbulb },
                        ].map((sub) => {
                          const IconComponent = sub.icon;
                          return (
                            <button
                              key={sub.id}
                              onClick={() => {
                                setViewMode("calculator");
                                setActiveSub(sub.id as SubCalculatorType);
                                setIsMenuOpen(false);
                              }}
                              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer text-left transition-all ${
                                viewMode === "calculator" && activeSub === sub.id ? getButtonActiveStyle(true) : getButtonActiveStyle(false)
                              }`}
                              id={`sidebar-sub-${sub.id}`}
                            >
                              <IconComponent className="w-4 h-4" />
                              <span>{sub.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Interactive Calendar Section */}
                    <div className="border-t border-black/5 dark:border-white/10 pt-4">
                      <InteractiveCalendar theme={theme} />
                    </div>

                    {/* Weather Portal Section */}
                    <div className="border-t border-black/5 dark:border-white/10 pt-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2.5">Weather Portal</span>
                      <div className="space-y-3">
                        {/* Search Field Box */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase font-extrabold tracking-wider text-gray-400 block">Search Location</label>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              placeholder="Type city and search/add..."
                              value={weatherSearchQuery}
                              onChange={(e) => setWeatherSearchQuery(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSearchWeather(weatherSearchQuery);
                                }
                              }}
                              className={`flex-1 min-w-0 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 border transition-colors ${
                                theme === "cosmic"
                                  ? "bg-slate-900 text-white border-white/10 focus:ring-cyan-500 placeholder-slate-500"
                                  : theme === "neumorphic"
                                  ? "bg-[#161616] text-[#00E676] border-zinc-800 focus:ring-[#00E676] placeholder-zinc-700"
                                  : theme === "financial"
                                  ? "bg-[#DFDFCB] text-[#3C3C30] border-[#C5C5B2] focus:ring-[#556B2F] placeholder-[#8A8A75]"
                                  : "bg-white text-gray-800 border-gray-200 focus:ring-gray-400 placeholder-gray-400"
                              }`}
                            />
                            {/* Search in Google button */}
                            <button
                              onClick={() => handleSearchWeather(weatherSearchQuery)}
                              className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center border shrink-0 ${
                                theme === "cosmic"
                                  ? "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/20"
                                  : theme === "neumorphic"
                                  ? "bg-[#00E676]/10 hover:bg-[#00E676]/20 text-[#00E676] border-[#00E676]/20"
                                  : theme === "financial"
                                  ? "bg-[#556B2F]/10 hover:bg-[#556B2F]/20 text-[#556B2F] border-[#556B2F]/20"
                                  : "bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300"
                              }`}
                              title="Search location weather on Google"
                            >
                              <Search className="w-4 h-4" />
                            </button>
                            {/* Add Location button */}
                            <button
                              onClick={() => handleAddWeatherLocation(weatherSearchQuery)}
                              className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center border shrink-0 ${
                                theme === "cosmic"
                                  ? "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border-indigo-500/20"
                                  : theme === "neumorphic"
                                  ? "bg-[#00E676]/10 hover:bg-[#00E676]/20 text-[#00E676] border-[#00E676]/20"
                                  : theme === "financial"
                                  ? "bg-[#556B2F]/10 hover:bg-[#556B2F]/20 text-[#556B2F] border-[#556B2F]/20"
                                  : "bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300"
                              }`}
                              title="Save location to your list"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Saved Locations List Boxes */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase font-extrabold tracking-wider text-gray-400 block">Saved Location Boxes</label>
                          {savedWeatherLocations.length === 0 ? (
                            <p className="text-[10px] text-gray-400 italic py-1 text-center">No saved locations yet. Save a location above!</p>
                          ) : (
                            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                              {savedWeatherLocations.map((loc, index) => (
                                <div
                                  key={loc + index}
                                  className={`group flex items-center justify-between pl-2.5 pr-1.5 py-1.5 rounded-xl border text-left text-[11px] font-bold transition-all ${
                                    theme === "cosmic"
                                      ? "bg-slate-900/40 border-white/5 hover:border-cyan-500/30 text-cyan-100"
                                      : theme === "neumorphic"
                                      ? "bg-[#121212] border-zinc-800 hover:border-[#00E676]/30 text-[#00E676]"
                                      : theme === "financial"
                                      ? "bg-[#DFDFCB]/40 border-[#C5C5B2] hover:border-[#556B2F]/40 text-[#3C3C30]"
                                      : "bg-white border-gray-200 hover:border-gray-400 text-gray-800"
                                  }`}
                                >
                                  <button
                                    onClick={() => handleSearchWeather(loc)}
                                    className="flex-1 text-left truncate flex items-center space-x-1.5 cursor-pointer"
                                    title={`Check weather for ${loc} on Google`}
                                  >
                                    <CloudSun className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                    <span className="truncate">{loc}</span>
                                  </button>
                                  <button
                                    onClick={() => handleRemoveWeatherLocation(index)}
                                    className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0 cursor-pointer"
                                    title={`Delete ${loc}`}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Options */}
              <div className="border-t border-black/5 dark:border-white/10 pt-4 mt-auto">
                <button
                  onClick={handleResetAll}
                  className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-md"
                  id="btn-reset-app"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Application Suite</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
