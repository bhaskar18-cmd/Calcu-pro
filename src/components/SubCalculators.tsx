import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Percent,
  Calculator,
  Users,
  Shuffle,
  Calendar,
  DollarSign,
  Heart,
  Lightbulb,
  Copy,
  TrendingUp,
} from "lucide-react";
import { Theme, SubCalculatorType, ScientificConstant, EmiScheduleItem } from "../types";
import { BirthdayCard } from "./BirthdayCard";

interface SubCalculatorsProps {
  theme: Theme;
  activeSub: SubCalculatorType;
}

const SCIENTIFIC_CONSTANTS: ScientificConstant[] = [
  // Physical
  { name: "Speed of Light (c)", symbol: "c", value: "299792458", unit: "m/s", category: "Physical" },
  { name: "Planck Constant (h)", symbol: "h", value: "6.62607015e-34", unit: "J·s", category: "Physical" },
  { name: "Gravitational Constant (G)", symbol: "G", value: "6.6743e-11", unit: "m³/(kg·s²)", category: "Physical" },
  { name: "Boltzmann Constant (k)", symbol: "k", value: "1.380649e-23", unit: "J/K", category: "Physical" },
  { name: "Elementary Charge (e)", symbol: "e", value: "1.602176634e-19", unit: "C", category: "Physical" },
  // Chemical
  { name: "Avogadro Constant (N_A)", symbol: "N_A", value: "6.02214076e23", unit: "mol⁻¹", category: "Chemical" },
  { name: "Gas Constant (R)", symbol: "R", value: "8.314462618", unit: "J/(mol·K)", category: "Chemical" },
  { name: "Faraday Constant (F)", symbol: "F", value: "96485.33212", unit: "C/mol", category: "Chemical" },
  // Astronomical
  { name: "Astronomical Unit (AU)", symbol: "AU", value: "149597870700", unit: "m", category: "Astronomical" },
  { name: "Light Year (ly)", symbol: "ly", value: "9.460730472e15", unit: "m", category: "Astronomical" },
  { name: "Parsec (pc)", symbol: "pc", value: "3.085677581e16", unit: "m", category: "Astronomical" },
  { name: "Solar Mass (M_☉)", symbol: "M_☉", value: "1.98847e30", unit: "kg", category: "Astronomical" },
];

export default function SubCalculators({ theme, activeSub }: SubCalculatorsProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const triggerCopyNotification = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedText(val);
    setTimeout(() => setCopiedText(null), 1500);
  };

  // 1. Discount Calculator State
  const [discountPrice, setDiscountPrice] = useState("100");
  const [discountPercent, setDiscountPercent] = useState("15");
  const [discountTax, setDiscountTax] = useState("5");

  // 2. GST Calculator State
  const [gstAmount, setGstAmount] = useState("1000");
  const [gstRate, setGstRate] = useState("18");
  const [gstType, setGstType] = useState<"inclusive" | "exclusive">("exclusive");

  // 3. Split Bill State
  const [billTotal, setBillTotal] = useState("120");
  const [billTip, setBillTip] = useState("15");
  const [billPeople, setBillPeople] = useState("4");

  // 4. Unit Converter State
  const [unitCategory, setUnitCategory] = useState<"Length" | "Weight" | "Temperature" | "Area" | "Volume" | "Storage">("Length");
  const [unitValue, setUnitValue] = useState("1");
  const [unitFrom, setUnitFrom] = useState("m");
  const [unitTo, setUnitTo] = useState("km");
  const [unitResult, setUnitResult] = useState("0.001");

  // 5. Age Calculator State
  const [birthDate, setBirthDate] = useState("2000-01-01");
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split("T")[0]);

  // 6. EMI Financial State
  const [loanPrincipal, setLoanPrincipal] = useState("50000");
  const [loanRate, setLoanRate] = useState("8.5");
  const [loanTenure, setLoanTenure] = useState("5");
  const [loanTenureUnit, setLoanTenureUnit] = useState<"years" | "months">("years");

  // 7. BMI Health State
  const [bmiSystem, setBmiSystem] = useState<"metric" | "imperial">("metric");
  const [bmiWeight, setBmiWeight] = useState("70"); // kg or lbs
  const [bmiHeight, setBmiHeight] = useState("175"); // cm or total inches

  // Unit conversions map
  const CONVERSIONS: Record<string, Record<string, number>> = {
    Length: {
      m: 1,
      km: 0.001,
      cm: 100,
      mm: 1000,
      mile: 0.000621371,
      yard: 1.09361,
      foot: 3.28084,
      inch: 39.3701,
    },
    Weight: {
      kg: 1,
      g: 1000,
      mg: 1000000,
      lb: 2.20462,
      oz: 35.274,
    },
    Area: {
      "sq m": 1,
      "sq km": 0.000001,
      "sq mile": 3.861e-7,
      acre: 0.000247105,
    },
    Volume: {
      liter: 1,
      ml: 1000,
      gal: 0.264172,
      cup: 4.22675,
    },
    Storage: {
      B: 1,
      KB: 1 / 1024,
      MB: 1 / (1024 * 1024),
      GB: 1 / (1024 * 1024 * 1024),
      TB: 1 / (1024 * 1024 * 1024 * 1024),
    },
  };

  // Handle unit conversions
  useEffect(() => {
    const val = parseFloat(unitValue);
    if (isNaN(val)) {
      setUnitResult("0");
      return;
    }

    if (unitCategory === "Temperature") {
      if (unitFrom === unitTo) {
        setUnitResult(val.toString());
        return;
      }
      let cVal = val;
      // Convert to Celsius first
      if (unitFrom === "F") cVal = ((val - 32) * 5) / 9;
      else if (unitFrom === "K") cVal = val - 273.15;

      // Convert Celsius to Target
      let res = cVal;
      if (unitTo === "F") res = (cVal * 9) / 5 + 32;
      else if (unitTo === "K") res = cVal + 273.15;

      setUnitResult(res.toFixed(4));
    } else {
      const catConvs = CONVERSIONS[unitCategory];
      if (!catConvs || !catConvs[unitFrom] || !catConvs[unitTo]) return;
      // Convert to base unit then to target
      const baseValue = val / catConvs[unitFrom];
      const targetValue = baseValue * catConvs[unitTo];
      setUnitResult(targetValue.toLocaleString(undefined, { maximumFractionDigits: 6 }));
    }
  }, [unitCategory, unitValue, unitFrom, unitTo]);

  // Sync unit options on category change
  useEffect(() => {
    let options: string[] = [];
    if (unitCategory === "Temperature") {
      options = ["C", "F", "K"];
    } else {
      options = Object.keys(CONVERSIONS[unitCategory] || {});
    }
    if (options.length > 1) {
      setUnitFrom(options[0]);
      setUnitTo(options[1]);
    }
  }, [unitCategory]);

  // Color mappings for themes
  const getThemeStyles = () => {
    switch (theme) {
      case "neumorphic":
        return {
          card: "bg-[#1A1A1A] border border-[#2A2A2A] shadow-[inset_1px_1px_5px_rgba(0,0,0,0.8)] rounded-3xl p-6 text-gray-100",
          input: "w-full bg-[#141414] border border-[#2D2D2D] text-gray-100 rounded-xl px-4 py-2.5 font-mono focus:outline-none focus:border-[#00E676] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.8)]",
          label: "block text-xs uppercase tracking-wider text-gray-400 mb-1.5 font-semibold",
          select: "w-full bg-[#141414] border border-[#2D2D2D] text-gray-100 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#00E676]",
          resultBlock: "bg-[#202020] border border-[#2D2D2D] rounded-2xl p-5 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.6)]",
          accentText: "text-[#00E676]",
          btnActive: "bg-[#00E676] text-black font-bold px-4 py-2 rounded-xl transition-all shadow-[0_0_10px_rgba(0,230,118,0.3)]",
          btnInactive: "bg-[#252525] text-gray-400 hover:bg-[#303030] border border-[#333] px-4 py-2 rounded-xl transition-all",
        };
      case "financial":
        return {
          card: "bg-[#E6E6D4] border border-[#C5C5B2] shadow-md rounded-3xl p-6 text-[#3C3C30]",
          input: "w-full bg-[#F3F3E7] border border-[#BCBCA6] text-[#3C3C30] rounded-xl px-4 py-2.5 font-mono focus:outline-none focus:border-[#556B2F]",
          label: "block text-xs uppercase tracking-wider text-[#556B2F] mb-1.5 font-bold",
          select: "w-full bg-[#F3F3E7] border border-[#BCBCA6] text-[#3C3C30] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#556B2F]",
          resultBlock: "bg-[#DFDFCB] border border-[#BCBCA6] rounded-2xl p-5",
          accentText: "text-[#556B2F]",
          btnActive: "bg-[#556B2F] text-white font-bold px-4 py-2 rounded-xl transition-all",
          btnInactive: "bg-[#ECECD8] text-[#556B2F] hover:bg-[#E3E3CA] border border-[#BCBCA6] px-4 py-2 rounded-xl transition-all",
        };
      case "cosmic":
        return {
          card: "backdrop-blur-md bg-white/5 border border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] rounded-[32px] p-6 text-white",
          input: "w-full bg-[#05050a]/40 border border-white/10 text-white rounded-xl px-4 py-2.5 font-mono focus:outline-none focus:border-cyan-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]",
          label: "block text-xs uppercase tracking-wider text-slate-400 mb-1.5 font-semibold",
          select: "w-full bg-[#05050a]/40 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-cyan-400",
          resultBlock: "bg-gradient-to-b from-white/10 to-transparent border border-white/10 rounded-[24px] p-5 shadow-[0_8px_20px_0_rgba(0,0,0,0.2)]",
          accentText: "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]",
          btnActive: "bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-[0_10px_20px_rgba(6,182,212,0.3)] border border-cyan-400/30",
          btnInactive: "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl transition-all",
        };
      case "minimalist":
      default:
        return {
          card: "bg-white border border-[#E5E5E5] shadow-sm rounded-3xl p-6 text-gray-800",
          input: "w-full bg-[#F9F9F9] border border-[#E5E5E5] text-gray-800 rounded-xl px-4 py-2.5 font-mono focus:outline-none focus:border-gray-900",
          label: "block text-xs uppercase tracking-wider text-gray-500 mb-1.5 font-semibold",
          select: "w-full bg-[#F9F9F9] border border-[#E5E5E5] text-gray-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-gray-900",
          resultBlock: "bg-[#F5F5F7] border border-[#E5E5E5] rounded-2xl p-5",
          accentText: "text-gray-900",
          btnActive: "bg-gray-900 text-white font-semibold px-4 py-2 rounded-xl transition-all",
          btnInactive: "bg-[#F3F3F3] text-gray-700 hover:bg-[#EAEAEA] px-4 py-2 rounded-xl transition-all",
        };
    }
  };

  const s = getThemeStyles();

  // Calculations:
  // 1. Discount
  const origPrice = parseFloat(discountPrice) || 0;
  const discPct = parseFloat(discountPercent) || 0;
  const dTax = parseFloat(discountTax) || 0;
  const savings = origPrice * (discPct / 100);
  const discountedPrice = origPrice - savings;
  const taxAmount = discountedPrice * (dTax / 100);
  const finalPrice = discountedPrice + taxAmount;

  // 2. GST
  const amt = parseFloat(gstAmount) || 0;
  const rate = parseFloat(gstRate) || 0;
  let gstCalculated = 0;
  let cgstVal = 0;
  let sgstVal = 0;
  let netVal = 0;

  if (gstType === "exclusive") {
    gstCalculated = amt * (rate / 100);
    cgstVal = gstCalculated / 2;
    sgstVal = gstCalculated / 2;
    netVal = amt + gstCalculated;
  } else {
    netVal = amt;
    const baseAmt = amt / (1 + rate / 100);
    gstCalculated = amt - baseAmt;
    cgstVal = gstCalculated / 2;
    sgstVal = gstCalculated / 2;
  }

  // 3. Split-Bill
  const bTotal = parseFloat(billTotal) || 0;
  const bTipPct = parseFloat(billTip) || 0;
  const bPeople = parseFloat(billPeople) || 1;
  const tipAmount = bTotal * (bTipPct / 100);
  const totalWithTip = bTotal + tipAmount;
  const splitAmount = totalWithTip / bPeople;

  // 5. Age
  const getAge = () => {
    try {
      const birth = new Date(birthDate);
      const target = new Date(targetDate);
      if (isNaN(birth.getTime()) || isNaN(target.getTime())) return null;

      let years = target.getFullYear() - birth.getFullYear();
      let months = target.getMonth() - birth.getMonth();
      let days = target.getDate() - birth.getDate();

      if (days < 0) {
        months--;
        const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0);
        days += prevMonth.getDate();
      }
      if (months < 0) {
        years--;
        months += 12;
      }

      // Next Birthday countdown
      const nextBday = new Date(target.getFullYear(), birth.getMonth(), birth.getDate());
      if (nextBday < target) {
        nextBday.setFullYear(target.getFullYear() + 1);
      }
      const diffMs = nextBday.getTime() - target.getTime();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // Check if target day is their birthday (same month and day, and target is on or after birth)
      const isBirthday = birth.getMonth() === target.getMonth() && birth.getDate() === target.getDate() && target >= birth;

      return { years, months, days, daysLeft, isBirthday };
    } catch (e) {
      return null;
    }
  };
  const ageResult = getAge();

  // 6. EMI
  const principal = parseFloat(loanPrincipal) || 0;
  const annualRate = parseFloat(loanRate) || 0;
  const tenureVal = parseFloat(loanTenure) || 0;
  const rEMI = annualRate / (12 * 100);
  const nEMI = loanTenureUnit === "years" ? tenureVal * 12 : tenureVal;

  let emiMonthly = 0;
  let totalInterest = 0;
  let emiSchedule: EmiScheduleItem[] = [];

  if (principal > 0 && annualRate > 0 && nEMI > 0) {
    if (rEMI === 0) {
      emiMonthly = principal / nEMI;
    } else {
      emiMonthly = (principal * rEMI * Math.pow(1 + rEMI, nEMI)) / (Math.pow(1 + rEMI, nEMI) - 1);
    }
    const totalPayment = emiMonthly * nEMI;
    totalInterest = totalPayment - principal;

    // Build standard amortization schedule for first few months / visual display
    let remainingBalance = principal;
    for (let i = 1; i <= Math.min(nEMI, 12); i++) {
      const interestPaid = remainingBalance * rEMI;
      const principalPaid = emiMonthly - interestPaid;
      remainingBalance = Math.max(0, remainingBalance - principalPaid);
      emiSchedule.push({
        month: i,
        payment: emiMonthly,
        principal: principalPaid,
        interest: interestPaid,
        balance: remainingBalance,
      });
    }
  }

  // 7. BMI
  const wBMI = parseFloat(bmiWeight) || 0;
  const hBMI = parseFloat(bmiHeight) || 0;
  let bmiVal = 0;
  let bmiRange = "Unknown";
  let bmiColor = "text-gray-500";
  let bmiGaugeWidth = "0%";

  if (wBMI > 0 && hBMI > 0) {
    if (bmiSystem === "metric") {
      // weight (kg), height (cm)
      bmiVal = wBMI / Math.pow(hBMI / 100, 2);
    } else {
      // weight (lbs), height (inches)
      bmiVal = (wBMI * 703) / Math.pow(hBMI, 2);
    }

    if (bmiVal < 18.5) {
      bmiRange = "Underweight";
      bmiColor = "text-blue-500";
      bmiGaugeWidth = `${Math.min(100, (bmiVal / 18.5) * 40)}%`;
    } else if (bmiVal >= 18.5 && bmiVal < 25) {
      bmiRange = "Normal Weight";
      bmiColor = "text-green-500 font-semibold";
      bmiGaugeWidth = `${40 + ((bmiVal - 18.5) / 6.5) * 30}%`;
    } else if (bmiVal >= 25 && bmiVal < 30) {
      bmiRange = "Overweight";
      bmiColor = "text-yellow-500 font-semibold";
      bmiGaugeWidth = `${70 + ((bmiVal - 25) / 5) * 15}%`;
    } else {
      bmiRange = "Obese";
      bmiColor = "text-red-500 font-bold";
      bmiGaugeWidth = `${Math.min(100, 85 + ((bmiVal - 30) / 10) * 15)}%`;
    }
  }

  return (
    <div className={`w-full ${s.card}`} id={`sub-calculator-${activeSub}`}>
      {copiedText && (
        <div className="fixed bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg z-50">
          Copied: {copiedText}
        </div>
      )}

      {/* RENDER ACTIVE SUB CALCULATOR */}

      {/* 1. DISCOUNT */}
      {activeSub === "discount" && (
        <div id="sub-calculator-discount-container">
          <div className="flex items-center space-x-2.5 mb-5">
            <Percent className={`w-5 h-5 ${s.accentText}`} />
            <h3 className="text-lg font-bold">Discount Optimizer</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div>
              <label className={s.label}>Original Price ($)</label>
              <input
                type="number"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                className={s.input}
                id="discount-original-price"
              />
            </div>
            <div>
              <label className={s.label}>Discount (%)</label>
              <input
                type="number"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className={s.input}
                id="discount-percentage"
              />
            </div>
            <div>
              <label className={s.label}>Sales Tax (%)</label>
              <input
                type="number"
                value={discountTax}
                onChange={(e) => setDiscountTax(e.target.value)}
                className={s.input}
                id="discount-tax-rate"
              />
            </div>
          </div>
          <div className={s.resultBlock}>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-3 opacity-70">Summary Details</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-xs opacity-60">Base Price</span>
                <p className="text-lg font-mono font-bold">${origPrice.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-xs opacity-60">Total Savings</span>
                <p className="text-lg font-mono font-bold text-green-500">-${savings.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-xs opacity-60">Sales Tax</span>
                <p className="text-lg font-mono font-bold">${taxAmount.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-xs opacity-60">Final Price</span>
                <p className={`text-xl font-mono font-extrabold ${s.accentText}`}>${finalPrice.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. GST */}
      {activeSub === "gst" && (
        <div id="sub-calculator-gst-container">
          <div className="flex items-center space-x-2.5 mb-5">
            <Calculator className={`w-5 h-5 ${s.accentText}`} />
            <h3 className="text-lg font-bold">GST & Tax Tier Calculator</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div>
              <label className={s.label}>Transaction Value ($)</label>
              <input
                type="number"
                value={gstAmount}
                onChange={(e) => setGstAmount(e.target.value)}
                className={s.input}
                id="gst-amount"
              />
            </div>
            <div>
              <label className={s.label}>GST Rate (%)</label>
              <input
                type="number"
                value={gstRate}
                onChange={(e) => setGstRate(e.target.value)}
                className={s.input}
                id="gst-rate"
              />
            </div>
            <div>
              <label className={s.label}>Calculation Mode</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setGstType("exclusive")}
                  className={`flex-1 text-xs py-2 rounded-xl border ${
                    gstType === "exclusive" ? s.btnActive : s.btnInactive
                  }`}
                  id="btn-gst-exclusive"
                >
                  Add GST
                </button>
                <button
                  onClick={() => setGstType("inclusive")}
                  className={`flex-1 text-xs py-2 rounded-xl border ${
                    gstType === "inclusive" ? s.btnActive : s.btnInactive
                  }`}
                  id="btn-gst-inclusive"
                >
                  Remove GST
                </button>
              </div>
            </div>
          </div>

          {/* Quick Rates Row */}
          <div className="mb-5">
            <span className={s.label}>Standard Tax Tiers</span>
            <div className="flex flex-wrap gap-2">
              {["5", "12", "18", "28"].map((tier) => (
                <button
                  key={tier}
                  onClick={() => setGstRate(tier)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-mono border ${
                    gstRate === tier ? s.btnActive : s.btnInactive
                  }`}
                  id={`btn-gst-tier-${tier}`}
                >
                  +{tier}%
                </button>
              ))}
            </div>
          </div>

          <div className={s.resultBlock}>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-3 opacity-70">Tax breakdown</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-xs opacity-60">Net Amount</span>
                <p className="text-lg font-mono font-bold">
                  ${(gstType === "exclusive" ? amt : amt - gstCalculated).toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-xs opacity-60">CGST (50%)</span>
                <p className="text-lg font-mono font-bold">${cgstVal.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-xs opacity-60">SGST (50%)</span>
                <p className="text-lg font-mono font-bold">${sgstVal.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-xs opacity-60">Total Bill Value</span>
                <p className={`text-xl font-mono font-extrabold ${s.accentText}`}>
                  ${(gstType === "exclusive" ? netVal : amt).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SPLIT-BILL */}
      {activeSub === "split" && (
        <div id="sub-calculator-split-container">
          <div className="flex items-center space-x-2.5 mb-5">
            <Users className={`w-5 h-5 ${s.accentText}`} />
            <h3 className="text-lg font-bold">Split-Bill & Tip Calculator</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div>
              <label className={s.label}>Total Bill Amount ($)</label>
              <input
                type="number"
                value={billTotal}
                onChange={(e) => setBillTotal(e.target.value)}
                className={s.input}
                id="split-bill-total"
              />
            </div>
            <div>
              <label className={s.label}>Tip Percent ({billTip}%)</label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={billTip}
                  onChange={(e) => setBillTip(e.target.value)}
                  className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                  id="split-tip-slider"
                />
              </div>
            </div>
            <div>
              <label className={s.label}>Number of Friends</label>
              <input
                type="number"
                value={billPeople}
                onChange={(e) => setBillPeople(e.target.value)}
                className={s.input}
                id="split-people-count"
                min="1"
              />
            </div>
          </div>
          <div className={s.resultBlock}>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-3 opacity-70">Payout Breakdown</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-xs opacity-60">Subtotal</span>
                <p className="text-lg font-mono font-bold">${bTotal.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-xs opacity-60">Tip Amount</span>
                <p className="text-lg font-mono font-bold text-indigo-500">${tipAmount.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-xs opacity-60">Grand Total</span>
                <p className="text-lg font-mono font-bold">${totalWithTip.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-xs opacity-60">Per Person Pays</span>
                <p className={`text-xl font-mono font-extrabold ${s.accentText}`}>${splitAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. UNIT CONVERTER */}
      {activeSub === "unit" && (
        <div id="sub-calculator-unit-container">
          <div className="flex items-center space-x-2.5 mb-5">
            <Shuffle className={`w-5 h-5 ${s.accentText}`} />
            <h3 className="text-lg font-bold">Comprehensive Unit Converter</h3>
          </div>
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-5">
            {["Length", "Weight", "Temperature", "Area", "Volume", "Storage"].map((cat) => (
              <button
                key={cat}
                onClick={() => setUnitCategory(cat as any)}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold border ${
                  unitCategory === cat ? s.btnActive : s.btnInactive
                }`}
                id={`btn-unit-category-${cat.toLowerCase()}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div>
              <label className={s.label}>Enter Value</label>
              <input
                type="number"
                value={unitValue}
                onChange={(e) => setUnitValue(e.target.value)}
                className={s.input}
                id="unit-value"
              />
            </div>
            <div>
              <label className={s.label}>From Unit</label>
              <select
                value={unitFrom}
                onChange={(e) => setUnitFrom(e.target.value)}
                className={s.select}
                id="unit-from-select"
              >
                {unitCategory === "Temperature"
                  ? ["C", "F", "K"].map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))
                  : Object.keys(CONVERSIONS[unitCategory] || {}).map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
              </select>
            </div>
            <div>
              <label className={s.label}>To Unit</label>
              <select
                value={unitTo}
                onChange={(e) => setUnitTo(e.target.value)}
                className={s.select}
                id="unit-to-select"
              >
                {unitCategory === "Temperature"
                  ? ["C", "F", "K"].map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))
                  : Object.keys(CONVERSIONS[unitCategory] || {}).map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
              </select>
            </div>
          </div>

          <div className={s.resultBlock}>
            <span className="text-xs opacity-60">Converted output</span>
            <p className={`text-2xl font-mono font-bold ${s.accentText}`}>
              {unitValue} {unitFrom} = {unitResult} {unitTo}
            </p>
          </div>
        </div>
      )}

      {/* 5. AGE CALCULATOR */}
      {activeSub === "age" && (
        <div id="sub-calculator-age-container">
          <div className="flex items-center space-x-2.5 mb-5">
            <Calendar className={`w-5 h-5 ${s.accentText}`} />
            <h3 className="text-lg font-bold">Age & Birthday Chronometer</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className={s.label}>Date of Birth</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className={s.input}
                id="age-birth-date"
              />
            </div>
            <div>
              <label className={s.label}>Target Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className={s.input}
                id="age-target-date"
              />
            </div>
          </div>
          {ageResult ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={s.resultBlock}>
                  <span className="text-xs opacity-60">Exact Age</span>
                  <p className={`text-xl font-mono font-bold mt-1 ${s.accentText}`}>
                    {ageResult.years} Years, {ageResult.months} Months, {ageResult.days} Days
                  </p>
                </div>
                <div className={s.resultBlock}>
                  <span className="text-xs opacity-60">Next Birthday countdown</span>
                  <p className="text-xl font-mono font-bold mt-1 text-purple-500">
                    {ageResult.isBirthday ? "🎂 Happy Birthday! Today is the Day! 🎉" : `${ageResult.daysLeft} Days Remaining`}
                  </p>
                </div>
              </div>

              {/* Special Birthday Celebration Card with the requested images */}
              {ageResult.isBirthday && (
                <BirthdayCard age={ageResult.years} theme={theme} />
              )}
            </div>
          ) : (
            <div className="text-center py-4 font-mono text-xs opacity-50">
              Please choose valid DOB and Target dates.
            </div>
          )}
        </div>
      )}

      {/* 6. EMI & FINANCIAL LOAN TOOL */}
      {activeSub === "emi" && (
        <div id="sub-calculator-emi-container">
          <div className="flex items-center space-x-2.5 mb-5">
            <DollarSign className={`w-5 h-5 ${s.accentText}`} />
            <h3 className="text-lg font-bold">Loan EMI Planner</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
            <div>
              <label className={s.label}>Loan Amount ($)</label>
              <input
                type="number"
                value={loanPrincipal}
                onChange={(e) => setLoanPrincipal(e.target.value)}
                className={s.input}
                id="loan-principal"
              />
            </div>
            <div>
              <label className={s.label}>Interest Rate (% Annual)</label>
              <input
                type="number"
                value={loanRate}
                onChange={(e) => setLoanRate(e.target.value)}
                className={s.input}
                id="loan-rate"
              />
            </div>
            <div>
              <label className={s.label}>Loan Tenure</label>
              <input
                type="number"
                value={loanTenure}
                onChange={(e) => setLoanTenure(e.target.value)}
                className={s.input}
                id="loan-tenure"
              />
            </div>
            <div>
              <label className={s.label}>Tenure Type</label>
              <select
                value={loanTenureUnit}
                onChange={(e) => setLoanTenureUnit(e.target.value as any)}
                className={s.select}
                id="loan-tenure-unit"
              >
                <option value="years">Years</option>
                <option value="months">Months</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div className={s.resultBlock}>
              <h4 className="text-xs uppercase tracking-wider mb-2 opacity-70">Payment Summary</h4>
              <div className="space-y-2.5">
                <div className="flex justify-between border-b border-black/5 pb-1">
                  <span className="text-xs opacity-70">Monthly Payment (EMI)</span>
                  <span className={`font-mono font-bold ${s.accentText}`}>${emiMonthly.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b border-black/5 pb-1">
                  <span className="text-xs opacity-70">Total Interest</span>
                  <span className="font-mono font-bold text-red-500">${totalInterest.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs opacity-70">Total Repayment</span>
                  <span className="font-mono font-bold">${(principal + totalInterest).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className={s.resultBlock}>
              <h4 className="text-xs uppercase tracking-wider mb-2 opacity-70">Visual Principal/Interest ratio</h4>
              <div className="flex h-6 rounded-full overflow-hidden mt-3 shadow-inner">
                <div
                  style={{ width: `${(principal / (principal + totalInterest)) * 100}%` }}
                  className="bg-green-500 h-full flex items-center justify-center text-[10px] text-white font-bold"
                  title="Principal Ratio"
                >
                  Principal
                </div>
                <div
                  style={{ width: `${(totalInterest / (principal + totalInterest)) * 100}%` }}
                  className="bg-red-400 h-full flex items-center justify-center text-[10px] text-white font-bold"
                  title="Interest Ratio"
                >
                  Interest
                </div>
              </div>
              <div className="flex justify-between text-[10px] mt-2 font-mono">
                <span>Principal: {((principal / (principal + totalInterest)) * 100 || 0).toFixed(1)}%</span>
                <span>Interest: {((totalInterest / (principal + totalInterest)) * 100 || 0).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* EMI Schedule */}
          {emiSchedule.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wider mb-2 font-bold opacity-80">
                Amortization Preview (First 12 Months)
              </h4>
              <div className="max-h-48 overflow-y-auto border border-black/5 rounded-xl font-mono text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black/5 sticky top-0">
                      <th className="p-2">Month</th>
                      <th className="p-2">EMI</th>
                      <th className="p-2">Principal Paid</th>
                      <th className="p-2">Interest Paid</th>
                      <th className="p-2">Remaining Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emiSchedule.map((row) => (
                      <tr key={row.month} className="border-b border-black/5 hover:bg-black/5">
                        <td className="p-2">{row.month}</td>
                        <td className="p-2">${row.payment.toFixed(2)}</td>
                        <td className="p-2 text-green-600">${row.principal.toFixed(2)}</td>
                        <td className="p-2 text-red-500">${row.interest.toFixed(2)}</td>
                        <td className="p-2">${row.balance.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. BMI HEALTH */}
      {activeSub === "bmi" && (
        <div id="sub-calculator-bmi-container">
          <div className="flex items-center space-x-2.5 mb-5">
            <Heart className={`w-5 h-5 ${s.accentText}`} />
            <h3 className="text-lg font-bold">BMI Health Analyzer</h3>
          </div>
          <div className="flex space-x-2.5 mb-5">
            <button
              onClick={() => {
                setBmiSystem("metric");
                setBmiWeight("70");
                setBmiHeight("175");
              }}
              className={`flex-1 text-xs py-2 rounded-xl border ${
                bmiSystem === "metric" ? s.btnActive : s.btnInactive
              }`}
              id="btn-bmi-metric"
            >
              Metric (kg, cm)
            </button>
            <button
              onClick={() => {
                setBmiSystem("imperial");
                setBmiWeight("150");
                setBmiHeight("68");
              }}
              className={`flex-1 text-xs py-2 rounded-xl border ${
                bmiSystem === "imperial" ? s.btnActive : s.btnInactive
              }`}
              id="btn-bmi-imperial"
            >
              Imperial (lbs, inches)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className={s.label}>{bmiSystem === "metric" ? "Weight (kg)" : "Weight (lbs)"}</label>
              <input
                type="number"
                value={bmiWeight}
                onChange={(e) => setBmiWeight(e.target.value)}
                className={s.input}
                id="bmi-weight-input"
              />
            </div>
            <div>
              <label className={s.label}>
                {bmiSystem === "metric" ? "Height (cm)" : "Height (inches)"}
              </label>
              <input
                type="number"
                value={bmiHeight}
                onChange={(e) => setBmiHeight(e.target.value)}
                className={s.input}
                id="bmi-height-input"
              />
            </div>
          </div>

          <div className={s.resultBlock}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs opacity-60">BMI Score</span>
                <p className="text-3xl font-mono font-bold mt-1">{bmiVal.toFixed(1)}</p>
                <p className={`text-sm font-semibold mt-1 ${bmiColor}`}>Category: {bmiRange}</p>
              </div>

              {/* Gauge Slider bar */}
              <div className="flex-1 w-full">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 mb-1 block">
                  Interactive Gauge Meter
                </span>
                <div className="relative w-full h-4 bg-gray-200 dark:bg-neutral-800 rounded-full overflow-hidden flex shadow-inner">
                  <div className="bg-blue-300 h-full w-[18.5%]" title="Underweight <18.5" />
                  <div className="bg-green-400 h-full w-[25%]" title="Normal 18.5 - 25" />
                  <div className="bg-yellow-400 h-full w-[20%]" title="Overweight 25 - 30" />
                  <div className="bg-red-400 h-full w-[36.5%]" title="Obese >=30" />

                  {/* Marker Pin */}
                  <div
                    style={{ left: bmiGaugeWidth }}
                    className="absolute top-0 bottom-0 w-1.5 bg-black dark:bg-white shadow-xl transition-all"
                  />
                </div>
                <div className="flex justify-between text-[9px] mt-1 opacity-60 font-mono">
                  <span>15.0</span>
                  <span>18.5</span>
                  <span>25.0</span>
                  <span>30.0</span>
                  <span>40.0+</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. SCIENTIFIC CONSTANTS */}
      {activeSub === "constants" && (
        <div id="sub-calculator-constants-container">
          <div className="flex items-center space-x-2.5 mb-4">
            <Lightbulb className={`w-5 h-5 ${s.accentText}`} />
            <h3 className="text-lg font-bold">Scientific Constants Reference</h3>
          </div>
          <p className="text-xs opacity-60 mb-4 leading-relaxed">
            Click on any physical, chemical, or astronomical constant to automatically copy its precise numerical value to your clipboard.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {SCIENTIFIC_CONSTANTS.map((c) => (
              <div
                key={c.name}
                onClick={() => triggerCopyNotification(c.value)}
                className="flex items-center justify-between p-3 border border-black/5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                id={`constant-item-${c.symbol.toLowerCase()}`}
              >
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold opacity-45 block mb-0.5">
                    {c.category}
                  </span>
                  <span className="text-xs font-semibold">{c.name}</span>
                  <span className="text-[11px] block font-mono opacity-60">
                    Value: {c.value} {c.unit}
                  </span>
                </div>
                <button className="p-1.5 rounded bg-black/5 opacity-0 group-hover:opacity-100 hover:bg-indigo-500 hover:text-white transition-all">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
