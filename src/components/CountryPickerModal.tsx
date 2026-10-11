import React, { useState, useMemo } from "react";
import { X, Check, Globe, Search, Sparkles } from "lucide-react";
import { COUNTRIES, CountryConfig } from "../utils/countryConfig";
import { Theme } from "../types";

interface CountryPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCountry: CountryConfig;
  onSelectCountry: (country: CountryConfig) => void;
  theme: Theme;
}

export default function CountryPickerModal({
  isOpen,
  onClose,
  selectedCountry,
  onSelectCountry,
  theme,
}: CountryPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return COUNTRIES;
    const q = searchQuery.toLowerCase().trim();
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.currencyCode.toLowerCase().includes(q) ||
        c.currencySymbol.toLowerCase().includes(q) ||
        c.currencyName.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  const getThemeCardClass = () => {
    switch (theme) {
      case "neumorphic":
        return "bg-[#1E1E1E] text-white border border-[#2D2D2D] shadow-[0_20px_50px_rgba(0,0,0,0.8)]";
      case "financial":
        return "bg-[#EFEFDC] text-[#2C2C24] border border-[#BCBCA0] shadow-2xl";
      case "cosmic":
        return "backdrop-blur-2xl bg-slate-950/95 text-white border border-cyan-500/30 shadow-[0_25px_60px_rgba(0,0,0,0.8)]";
      case "minimalist":
      default:
        return "bg-white text-gray-900 border border-gray-200 shadow-2xl";
    }
  };

  const getActiveItemClass = (isSelected: boolean) => {
    if (isSelected) {
      switch (theme) {
        case "neumorphic":
          return "bg-[#00E676]/15 border-[#00E676] text-white shadow-[0_0_15px_rgba(0,230,118,0.2)]";
        case "financial":
          return "bg-[#556B2F]/20 border-[#556B2F] text-[#2C2C24]";
        case "cosmic":
          return "bg-cyan-500/15 border-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.25)]";
        case "minimalist":
        default:
          return "bg-gray-100 border-gray-900 text-black";
      }
    }
    return "bg-black/5 dark:bg-white/5 border-transparent hover:border-black/10 dark:hover:border-white/10 opacity-80 hover:opacity-100";
  };

  const getThemeInputClass = () => {
    switch (theme) {
      case "neumorphic":
        return "bg-black/90 text-white placeholder-zinc-500 border border-zinc-800 focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676]";
      case "financial":
        return "bg-[#FCFDF6] text-[#2C2C24] placeholder-[#8A8A75] border border-[#BCBCA0] focus:border-[#556B2F] focus:ring-1 focus:ring-[#556B2F]";
      case "cosmic":
        return "bg-slate-900/90 text-white placeholder-slate-400 border border-white/20 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400";
      case "minimalist":
      default:
        return "bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-300 focus:border-black focus:ring-1 focus:ring-black";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-3xl p-5 md:p-6 relative max-h-[90vh] flex flex-col ${getThemeCardClass()}`}
        id="country-picker-modal-box"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight flex items-center gap-2">
                <span>Country & Regional Settings</span>
              </h2>
              <p className="text-[11px] opacity-65 mt-0.5">
                Sets your local currency sign (₹ Rupees, $ USD) & grocery weight units.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100 transition-colors cursor-pointer"
            id="btn-close-country-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar with high contrast and explicit text colors */}
        <div className="mt-4 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400 opacity-75 pointer-events-none" />
          <input
            type="text"
            placeholder="Search country, currency (INR, USD, Rupee, ₹)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-9 py-2.5 rounded-xl text-sm font-semibold transition-all focus:outline-none ${getThemeInputClass()}`}
            id="country-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Clear search query"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Selected Country Banner */}
        <div className="mt-3 p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl">{selectedCountry.flag}</span>
            <div>
              <div className="text-xs font-black flex items-center gap-1.5">
                <span>Active: {selectedCountry.name}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                  {selectedCountry.currencySymbol} {selectedCountry.currencyCode}
                </span>
              </div>
              <div className="text-[10px] opacity-75 mt-0.5">
                Weight units: {selectedCountry.weightUnits.map((u) => u.shortLabel).join(", ")}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold opacity-60 block">Price Rate:</span>
            <span className="text-xs font-mono font-bold text-cyan-400">
              {selectedCountry.rateFormatExample}
            </span>
          </div>
        </div>

        {/* Countries List */}
        <div className="mt-3 flex-1 overflow-y-auto pr-1 space-y-2 max-h-72 scrollbar-thin">
          {filteredCountries.length === 0 ? (
            <div className="py-8 text-center opacity-50 text-xs">
              No country found matching &ldquo;{searchQuery}&rdquo;
            </div>
          ) : (
            filteredCountries.map((c) => {
              const isSelected = selectedCountry.code === c.code;
              return (
                <button
                  key={c.code}
                  onClick={() => {
                    onSelectCountry(c);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${getActiveItemClass(
                    isSelected
                  )}`}
                  id={`country-option-${c.code}`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{c.flag}</span>
                    <div>
                      <div className="text-xs font-black flex items-center gap-1.5">
                        <span>{c.name}</span>
                        {c.code === "IN" && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Rupees (₹)
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] opacity-60 mt-0.5 flex items-center gap-2">
                        <span>
                          {c.currencyName} ({c.currencyCode})
                        </span>
                        <span>·</span>
                        <span className="capitalize">{c.weightSystem} weights</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5">
                    <div className="text-right">
                      <span className="text-sm font-black font-mono px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 block">
                        {c.currencySymbol}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-cyan-500 text-black flex items-center justify-center font-bold">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-[11px] opacity-65">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Updates all calculations, rates & weights instantly</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-cyan-500 text-black font-extrabold text-xs cursor-pointer hover:bg-cyan-400 transition-all shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
