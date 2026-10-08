import React, { useState, useEffect, useRef } from "react";
import { evaluate } from "mathjs";
import { 
  Trash2, 
  History, 
  Copy, 
  Download, 
  CornerDownLeft, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Percent,
  CheckCircle2
} from "lucide-react";
import { Theme, HistoryItem } from "../types";

interface CoreCalculatorProps {
  theme: Theme;
  history: HistoryItem[];
  onAddHistory: (item: HistoryItem) => void;
  onClearHistory: () => void;
}

export default function CoreCalculator({
  theme,
  history,
  onAddHistory,
  onClearHistory,
}: CoreCalculatorProps) {
  const [expression, setExpression] = useState<string>("");
  const [result, setResult] = useState<string>("0");
  const [memory, setMemory] = useState<number>(0);
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [isDegreeMode, setIsDegreeMode] = useState<boolean>(true);
  
  // Overflow and scrolling detection states
  const [isExprOverflowing, setIsExprOverflowing] = useState<boolean>(false);
  const [isResultOverflowing, setIsResultOverflowing] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Result sliding & scrolling tracking states
  const [resultScrollLeft, setResultScrollLeft] = useState<number>(0);
  const [resultMaxScroll, setResultMaxScroll] = useState<number>(0);

  const [activeFocus, setActiveFocus] = useState<"expression" | "result">("expression");

  const [isAdvancedExpanded, setIsAdvancedExpanded] = useState<boolean>(() => {
    const saved = localStorage.getItem("calc_show_advanced");
    return saved ? saved === "true" : false;
  });

  const focusExpression = () => {
    setActiveFocus("expression");
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        scrollInputToCursor();
      }
    }, 0);
  };

  const focusResult = () => {
    setActiveFocus("result");
    setTimeout(() => {
      if (resultRef.current) {
        resultRef.current.focus();
      }
    }, 0);
  };

  const handleLeftArrowClick = () => {
    if (activeFocus === "expression") {
      moveCursorLeft();
    } else {
      scrollResultLeft();
    }
  };

  const handleRightArrowClick = () => {
    if (activeFocus === "expression") {
      moveCursorRight();
    } else {
      scrollResultRight();
    }
  };

  const handleResultScroll = () => {
    if (resultRef.current) {
      setResultScrollLeft(resultRef.current.scrollLeft);
      setResultMaxScroll(resultRef.current.scrollWidth - resultRef.current.clientWidth);
    }
  };

  useEffect(() => {
    const el = resultRef.current;
    if (el) {
      el.addEventListener("scroll", handleResultScroll);
      // Perform initial check
      setResultMaxScroll(el.scrollWidth - el.clientWidth);
      return () => {
        el.removeEventListener("scroll", handleResultScroll);
      };
    }
  }, [result]);

  const handleResultSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pct = parseFloat(e.target.value);
    if (resultRef.current) {
      const targetScroll = (pct / 100) * (resultRef.current.scrollWidth - resultRef.current.clientWidth);
      resultRef.current.scrollLeft = targetScroll;
      setResultScrollLeft(targetScroll);
    }
  };

  const scrollResultLeft = () => {
    if (resultRef.current) {
      resultRef.current.scrollBy({ left: -80, behavior: "smooth" });
    }
  };

  const scrollResultRight = () => {
    if (resultRef.current) {
      resultRef.current.scrollBy({ left: 80, behavior: "smooth" });
    }
  };

  const slideAnswerToExpression = () => {
    if (result && result !== "0" && result !== "Error") {
      insertAtCursor(result);
    }
  };

  // Load memory from localStorage if available
  useEffect(() => {
    const savedMemory = localStorage.getItem("calc_memory");
    if (savedMemory) {
      setMemory(parseFloat(savedMemory));
    }
  }, []);

  // Monitor expression and result changes to check for overflow
  useEffect(() => {
    checkOverflow();
  }, [expression, result]);

  const checkOverflow = () => {
    if (inputRef.current) {
      const el = inputRef.current;
      setIsExprOverflowing(el.scrollWidth > el.clientWidth);
    }
    if (resultRef.current) {
      const el = resultRef.current;
      setIsResultOverflowing(el.scrollWidth > el.clientWidth);
    }
  };

  const saveMemoryState = (val: number) => {
    setMemory(val);
    localStorage.setItem("calc_memory", val.toString());
  };

  // Helper to scroll input element horizontally to current cursor position
  const scrollInputToCursor = () => {
    if (inputRef.current) {
      const el = inputRef.current;
      const charWidth = 11; // approximate pixels per character
      const cursorPos = el.selectionStart ?? 0;
      const scrollTarget = Math.max(0, cursorPos * charWidth - el.clientWidth / 1.5);
      el.scrollLeft = scrollTarget;
    }
  };

  // Programmatically handles inserting text at exact cursor position
  const insertAtCursor = (text: string) => {
    if (inputRef.current) {
      const start = inputRef.current.selectionStart ?? expression.length;
      const end = inputRef.current.selectionEnd ?? expression.length;

      const newExpression = expression.slice(0, start) + text + expression.slice(end);
      setExpression(newExpression);

      const newCursorPos = start + text.length;
      setCursorPosition(newCursorPos);

      // Focus and scroll into view
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
          scrollInputToCursor();
        }
      }, 0);
    } else {
      // Fallback
      setExpression((prev) => prev + text);
      setCursorPosition((prev) => prev + text.length);
    }
  };

  const handleKeyPress = (val: string) => {
    insertAtCursor(val);
  };

  const handleClear = () => {
    setExpression("");
    setResult("0");
    setCursorPosition(0);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(0, 0);
      }
    }, 0);
  };

  const handleFractionTemplate = () => {
    if (inputRef.current) {
      const start = inputRef.current.selectionStart ?? expression.length;
      const end = inputRef.current.selectionEnd ?? expression.length;
      
      if (start !== end) {
        // Wrap selection in (selection)/( )
        const selection = expression.slice(start, end);
        const wrapped = `(${selection})/( )`;
        const newExpression = expression.slice(0, start) + wrapped + expression.slice(end);
        setExpression(newExpression);
        
        const newCursorPos = start + selection.length + 4;
        setCursorPosition(newCursorPos);
        
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
            scrollInputToCursor();
          }
        }, 0);
      } else {
        // No selection. Check left side of cursor for any sequence of numbers or decimals
        let leftIndex = start - 1;
        while (leftIndex >= 0) {
          const char = expression[leftIndex];
          if (/[\d\.]/.test(char) || char === "π" || char === "e") {
            leftIndex--;
          } else {
            break;
          }
        }
        const numLength = start - 1 - leftIndex;
        if (numLength > 0) {
          // Wrap number in (number)/( )
          const numToWrap = expression.slice(leftIndex + 1, start);
          const wrapped = `(${numToWrap})/( )`;
          const newExpression = expression.slice(0, leftIndex + 1) + wrapped + expression.slice(start);
          setExpression(newExpression);
          
          const newCursorPos = leftIndex + 1 + numToWrap.length + 4;
          setCursorPosition(newCursorPos);
          
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.focus();
              inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
              scrollInputToCursor();
            }
          }, 0);
        } else {
          // Just insert ( )/( ) and place cursor in numerator
          const template = "( )/( )";
          const newExpression = expression.slice(0, start) + template + expression.slice(end);
          setExpression(newExpression);
          
          const newCursorPos = start + 1;
          setCursorPosition(newCursorPos);
          
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.focus();
              inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
              scrollInputToCursor();
            }
          }, 0);
        }
      }
    } else {
      setExpression((prev) => prev + "( )/( )");
      setCursorPosition((prev) => prev + 1);
    }
  };

  const handleBackspace = () => {
    if (inputRef.current) {
      const start = inputRef.current.selectionStart ?? expression.length;
      const end = inputRef.current.selectionEnd ?? expression.length;

      if (start !== end) {
        // Delete selection
        const newExpression = expression.slice(0, start) + expression.slice(end);
        setExpression(newExpression);
        setCursorPosition(start);
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.setSelectionRange(start, start);
            scrollInputToCursor();
          }
        }, 0);
      } else if (start > 0) {
        // Delete preceding character
        const newExpression = expression.slice(0, start - 1) + expression.slice(start);
        setExpression(newExpression);
        const newCursorPos = start - 1;
        setCursorPosition(newCursorPos);
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
            scrollInputToCursor();
          }
        }, 0);
      }
    } else {
      // Fallback
      setExpression((prev) => prev.slice(0, -1));
    }
  };

  const handleEvaluate = () => {
    if (!expression.trim()) return;

    try {
      let formattedExpr = expression
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/π/g, "pi")
        .replace(/\(\s*\)/g, "1");

      // Custom evaluation scope for Degrees Mode vs Radians Mode
      const scope = isDegreeMode ? {
        sin: (x: any) => {
          const val = typeof x === "number" ? x : parseFloat(x.toString());
          return Math.sin(val * Math.PI / 180);
        },
        cos: (x: any) => {
          const val = typeof x === "number" ? x : parseFloat(x.toString());
          return Math.cos(val * Math.PI / 180);
        },
        tan: (x: any) => {
          const val = typeof x === "number" ? x : parseFloat(x.toString());
          return Math.tan(val * Math.PI / 180);
        },
        asin: (x: any) => {
          const val = typeof x === "number" ? x : parseFloat(x.toString());
          return Math.asin(val) * 180 / Math.PI;
        },
        acos: (x: any) => {
          const val = typeof x === "number" ? x : parseFloat(x.toString());
          return Math.acos(val) * 180 / Math.PI;
        },
        atan: (x: any) => {
          const val = typeof x === "number" ? x : parseFloat(x.toString());
          return Math.atan(val) * 180 / Math.PI;
        }
      } : {};

      // evaluate with mathjs using scope
      const evalResult = evaluate(formattedExpr, scope);
      let finalResult = "";

      if (typeof evalResult === "number") {
        // limit floating point precision issues
        finalResult = Number(evalResult.toFixed(10)).toString();
      } else if (evalResult && typeof evalResult === "object" && "entries" in evalResult) {
        finalResult = evalResult.toString();
      } else {
        finalResult = String(evalResult);
      }

      setResult(finalResult);

      // Save to history log
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        equation: expression,
        result: finalResult,
        timestamp: new Date().toLocaleTimeString(),
      };
      onAddHistory(newItem);
    } catch (error) {
      setResult("Error");
    }
  };

  const handleMemory = (op: string) => {
    const currentVal = parseFloat(result) || 0;
    switch (op) {
      case "MC":
        saveMemoryState(0);
        break;
      case "MR":
        insertAtCursor(memory.toString());
        break;
      case "M+":
        saveMemoryState(memory + currentVal);
        break;
      case "M-":
        saveMemoryState(memory - currentVal);
        break;
      default:
        break;
    }
  };

  // Cursor Arrow movements
  const moveCursorLeft = () => {
    if (inputRef.current) {
      const currentPos = inputRef.current.selectionStart ?? expression.length;
      const newPos = Math.max(0, currentPos - 1);
      setCursorPosition(newPos);
      inputRef.current.focus();
      inputRef.current.setSelectionRange(newPos, newPos);
      scrollInputToCursor();
    }
  };

  const moveCursorRight = () => {
    if (inputRef.current) {
      const currentPos = inputRef.current.selectionStart ?? expression.length;
      const newPos = Math.min(expression.length, currentPos + 1);
      setCursorPosition(newPos);
      inputRef.current.focus();
      inputRef.current.setSelectionRange(newPos, newPos);
      scrollInputToCursor();
    }
  };

  const moveCursorToHome = () => {
    if (inputRef.current) {
      setCursorPosition(0);
      inputRef.current.focus();
      inputRef.current.setSelectionRange(0, 0);
      scrollInputToCursor();
    }
  };

  const moveCursorToEnd = () => {
    if (inputRef.current) {
      const len = expression.length;
      setCursorPosition(len);
      inputRef.current.focus();
      inputRef.current.setSelectionRange(len, len);
      scrollInputToCursor();
    }
  };

  const handleSelectionChange = (e: React.SyntheticEvent<HTMLInputElement>) => {
    setCursorPosition(e.currentTarget.selectionStart ?? 0);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleEvaluate();
    } else if (e.key === "Escape") {
      handleClear();
    } else if (e.key === "ArrowDown") {
      focusResult();
      e.preventDefault();
    }
  };

  // Unclosed brackets checker
  const getUnbalancedBrackets = (expr: string): number => {
    let openCount = 0;
    for (const char of expr) {
      if (char === "(") openCount++;
      else if (char === ")") openCount--;
    }
    return openCount >= 0 ? openCount : 0;
  };

  const autoCloseParentheses = () => {
    const count = getUnbalancedBrackets(expression);
    if (count > 0) {
      const closed = ")".repeat(count);
      insertAtCursor(closed);
    }
  };

  // Dynamic Font Sizing for long numbers
  const getExprFontSizeClass = (expr: string) => {
    const len = expr.length;
    if (len < 14) return "text-2xl md:text-3xl";
    if (len < 22) return "text-xl md:text-2xl";
    if (len < 32) return "text-lg md:text-xl";
    return "text-sm md:text-base";
  };

  const getResultFontSizeClass = (res: string) => {
    const len = res.length;
    if (len < 9) return "text-3xl md:text-4xl";
    if (len < 15) return "text-2xl md:text-3xl";
    if (len < 22) return "text-xl md:text-2xl";
    return "text-lg md:text-xl";
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadHistory = () => {
    const content = history
      .map((item) => `[${item.timestamp}] ${item.equation} = ${item.result}`)
      .join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `calculator-history-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // UI Theme Configs
  const getThemeStyles = () => {
    switch (theme) {
      case "neumorphic":
        return {
          wrapper: "bg-[#1A1A1A] border border-[#2A2A2A] shadow-[inset_1px_1px_5px_rgba(0,0,0,0.8)] rounded-3xl p-5 md:p-6",
          display: "bg-[#141414] shadow-[inset_4px_4px_10px_rgba(0,0,0,0.9),_inset_-2px_-2px_5px_rgba(255,255,255,0.05)] rounded-2xl p-4 md:p-5 text-right",
          btnMem: "bg-[#1E1E1E] text-[#00E676] hover:bg-[#252525] shadow-[2px_2px_5px_rgba(0,0,0,0.9)] border border-[#2d2d2d] rounded-lg text-[10px] py-1 font-bold transition-all cursor-pointer",
          btnOp: "bg-[#222] text-amber-400 hover:bg-[#2A2A2A] shadow-[2px_2px_5px_rgba(0,0,0,0.9)] border border-[#333] rounded-xl py-1.5 sm:py-2 font-bold text-base transition-all cursor-pointer",
          btnNum: "bg-[#1A1A1A] text-gray-200 hover:bg-[#222] shadow-[3px_3px_6px_rgba(0,0,0,0.9),_-1px_-1px_3px_rgba(255,255,255,0.02)] border border-[#262626] rounded-xl py-1.5 sm:py-2 text-base font-medium transition-all cursor-pointer",
          btnFn: "bg-[#1E1E1E] text-cyan-400 hover:bg-[#262626] shadow-[2px_2px_5px_rgba(0,0,0,0.9)] border border-[#2d2d2d] rounded-xl py-1 sm:py-1.5 text-[11px] font-mono tracking-tight transition-all cursor-pointer",
          btnEqual: "bg-[#00E676] text-black hover:bg-[#00c853] shadow-[2px_2px_8px_rgba(0,230,118,0.3)] rounded-xl py-1.5 sm:py-2 text-base font-bold transition-all cursor-pointer",
        };
      case "financial":
        return {
          wrapper: "bg-[#E6E6D4] border border-[#C5C5B2] shadow-md rounded-3xl p-5 md:p-6",
          display: "bg-[#F3F3E7] border border-[#BCBCA6] rounded-2xl p-4 md:p-5 text-right shadow-[inset_1px_1px_3px_rgba(0,0,0,0.1)]",
          btnMem: "bg-[#D9D9C0] text-[#556B2F] hover:bg-[#CFCFA8] border border-[#BCBCA6] rounded-lg text-[10px] py-1 font-bold transition-all cursor-pointer",
          btnOp: "bg-[#D0D0B5] text-[#556B2F] hover:bg-[#C5C59C] border border-[#BCBCA6] rounded-xl py-1.5 sm:py-2 font-bold text-base transition-all cursor-pointer",
          btnNum: "bg-[#ECECD8] text-[#3C3C30] hover:bg-[#E3E3CA] border border-[#BCBCA6] rounded-xl py-1.5 sm:py-2 text-base font-medium transition-all cursor-pointer",
          btnFn: "bg-[#DFDFCB] text-[#556B2F] hover:bg-[#D4D4B6] border border-[#BCBCA6] rounded-xl py-1 sm:py-1.5 text-[11px] font-mono tracking-tight transition-all cursor-pointer",
          btnEqual: "bg-[#556B2F] text-white hover:bg-[#475b24] border border-[#3f5022] rounded-xl py-1.5 sm:py-2 text-base font-bold transition-all cursor-pointer",
        };
      case "cosmic":
        return {
          wrapper: "backdrop-blur-md bg-white/5 border border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] rounded-[32px] p-5 md:p-6",
          display: "bg-slate-950/75 border border-white/10 rounded-[24px] p-5 text-right relative overflow-hidden flex flex-col justify-end min-h-[120px] shadow-inner",
          btnMem: "bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] py-1 font-bold transition-all cursor-pointer",
          btnOp: "bg-cyan-500/20 text-cyan-400 font-bold hover:bg-cyan-500/30 border border-cyan-500/30 rounded-2xl py-1.5 sm:py-2 text-base transition-all cursor-pointer",
          btnNum: "bg-white/5 text-white font-bold hover:bg-white/10 border border-white/10 rounded-2xl py-1.5 sm:py-2 text-base transition-all cursor-pointer",
          btnFn: "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5 rounded-2xl py-1 sm:py-1.5 text-[11px] font-mono tracking-tight transition-all cursor-pointer",
          btnEqual: "bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:from-cyan-400 hover:to-blue-500 shadow-[0_10px_20px_rgba(6,182,212,0.3)] rounded-2xl py-1.5 sm:py-2 text-base transition-all cursor-pointer",
        };
      case "minimalist":
      default:
        return {
          wrapper: "bg-white border border-[#E5E5E5] shadow-sm rounded-3xl p-5 md:p-6",
          display: "bg-[#F9F9F9] border border-[#E5E5E5] rounded-2xl p-4 md:p-5 text-right",
          btnMem: "bg-[#F3F3F3] text-gray-700 hover:bg-[#EAEAEA] rounded-lg text-[10px] py-1 font-bold transition-all cursor-pointer",
          btnOp: "bg-[#F9F9F9] text-gray-800 hover:bg-[#F3F3F3] border border-[#E5E5E5] rounded-xl py-1.5 sm:py-2 font-semibold text-base transition-all cursor-pointer",
          btnNum: "bg-white text-gray-800 hover:bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl py-1.5 sm:py-2 text-base font-medium transition-all cursor-pointer",
          btnFn: "bg-[#F5F5F7] text-gray-600 hover:bg-[#EDEDF0] rounded-xl py-1 sm:py-1.5 text-[11px] font-mono tracking-tight transition-all cursor-pointer",
          btnEqual: "bg-gray-900 text-white hover:bg-gray-800 rounded-xl py-1.5 sm:py-2 text-base font-semibold transition-all cursor-pointer",
        };
    }
  };

  const s = getThemeStyles();
  const unbalancedBrackets = getUnbalancedBrackets(expression);

  return (
    <div className="relative flex flex-col md:flex-row w-full gap-6" id="core-calculator-panel">
      {/* Main Calculator */}
      <div className={`flex-1 ${s.wrapper}`}>
        {/* Memory Indicator */}
        {memory !== 0 && (
          <div className="flex justify-start mb-2">
            <span className="text-[10px] px-2 py-0.5 font-bold uppercase rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-mono">
              Memory Hold: {memory}
            </span>
          </div>
        )}

        {/* Display Panel */}
        <div className={`mb-4 relative overflow-hidden transition-all ${s.display}`} id="calc-display-section">
          {/* Degree/Radian & Status Indicators inside display */}
          <div className="absolute top-2.5 left-4 right-4 flex justify-between items-center z-20 pointer-events-auto">
            <div className="flex items-center space-x-1.5">
              <button 
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setIsDegreeMode(!isDegreeMode)}
                className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest transition-all cursor-pointer ${
                  theme === "neumorphic"
                    ? isDegreeMode 
                      ? "bg-[#00E676] text-black shadow-sm shadow-[#00E676]/20" 
                      : "bg-transparent text-gray-500 hover:text-gray-300 border border-[#333]/40"
                    : theme === "financial"
                    ? isDegreeMode 
                      ? "bg-[#556B2F] text-white shadow-sm" 
                      : "bg-transparent text-[#556B2F]/60 hover:text-[#556B2F] border border-[#BCBCA6]/40"
                    : theme === "cosmic"
                    ? isDegreeMode 
                      ? "bg-cyan-500 text-black shadow-sm shadow-cyan-500/20" 
                      : "bg-transparent text-slate-400 hover:text-white border border-white/10"
                    : isDegreeMode 
                    ? "bg-gray-900 text-white shadow-sm" 
                    : "bg-transparent text-gray-500 hover:text-gray-900 border border-gray-300/40"
                }`}
                title="Click to toggle DEG / RAD mode"
              >
                {isDegreeMode ? "DEG" : "RAD"}
              </button>
              
              {/* Unbalanced bracket feedback */}
              {unbalancedBrackets > 0 && (
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={autoCloseParentheses}
                  className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 border border-amber-500/20 text-[9px] font-bold flex items-center space-x-1 cursor-pointer animate-pulse"
                  title="Unclosed parentheses! Click to auto-close"
                >
                  <span>( ) +{unbalancedBrackets} Auto-Close</span>
                </button>
              )}
            </div>
            
            <div className="text-[9px] opacity-40 font-mono flex items-center space-x-1">
              <span>Pos: {cursorPosition} / {expression.length}</span>
            </div>
          </div>

          {/* Left/Right Scroll/Swipe Overflows */}
          {isExprOverflowing && (
            <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center text-cyan-400/60 pointer-events-none animate-pulse">
              <ChevronLeft className="w-3.5 h-3.5" />
            </div>
          )}
          {isExprOverflowing && (
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center text-cyan-400/60 pointer-events-none animate-pulse">
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          )}

          {/* Expression Input with activeFocus styling */}
          <div className={`mt-6 mb-1 relative flex items-center w-full rounded-xl px-1.5 py-1.5 transition-all ${
            activeFocus === "expression"
              ? theme === "cosmic" ? "bg-white/5 ring-1 ring-cyan-500/20"
                : theme === "neumorphic" ? "bg-[#00E676]/5 ring-1 ring-[#00E676]/20"
                : theme === "financial" ? "bg-[#556B2F]/5 ring-1 ring-[#556B2F]/20"
                : "bg-gray-100/50 ring-1 ring-gray-900/10"
              : "hover:bg-black/5 dark:hover:bg-white/5"
          }`}>
            <input
              ref={inputRef}
              type="text"
              value={expression}
              onChange={(e) => {
                setExpression(e.target.value);
                setCursorPosition(e.target.selectionStart ?? e.target.value.length);
              }}
              onFocus={() => setActiveFocus("expression")}
              onKeyDown={handleInputKeyDown}
              onKeyUp={handleSelectionChange}
              onMouseUp={handleSelectionChange}
              inputMode="none" // disables virtual mobile keyboard to prevent blockages
              className={`w-full bg-transparent text-right outline-none focus:outline-none focus:ring-0 border-none font-mono tracking-wider transition-all select-text cursor-text scroll-smooth p-0 ${getExprFontSizeClass(expression)} ${
                theme === "cosmic" ? "text-white selection:bg-cyan-500/30" : 
                theme === "neumorphic" ? "text-[#00E676]" :
                theme === "financial" ? "text-[#3C3C30]" : "text-gray-900"
              }`}
              placeholder="0"
              style={{ caretColor: theme === "cosmic" ? "#22d3ee" : theme === "neumorphic" ? "#00E676" : theme === "financial" ? "#556B2F" : "#111827" }}
            />
          </div>

          {/* Result Display Container with slide/scroll activeFocus styling */}
          <div 
            tabIndex={0}
            onFocus={() => setActiveFocus("result")}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp") {
                focusExpression();
                e.preventDefault();
              } else if (e.key === "ArrowLeft") {
                scrollResultLeft();
                e.preventDefault();
              } else if (e.key === "ArrowRight") {
                scrollResultRight();
                e.preventDefault();
              }
            }}
            className={`relative flex items-center justify-between mt-2 group/result rounded-xl p-1.5 transition-all focus:outline-none ${
              activeFocus === "result"
                ? theme === "cosmic" ? "bg-white/5 ring-1 ring-cyan-500/20"
                  : theme === "neumorphic" ? "bg-[#00E676]/5 ring-1 ring-[#00E676]/20"
                  : theme === "financial" ? "bg-[#556B2F]/5 ring-1 ring-[#556B2F]/20"
                  : "bg-gray-100/50 ring-1 ring-gray-900/10"
                : "hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            {/* Scroll/Slide Overflows for Answer text */}
            {resultMaxScroll > 0 && (
              <div className="flex items-center space-x-1 absolute left-1 z-10 opacity-60 hover:opacity-100 transition-opacity bg-black/50 backdrop-blur-md rounded-md p-1">
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={scrollResultLeft}
                  className="p-1 hover:bg-white/20 rounded text-white transition-colors cursor-pointer"
                  title="Slide answer left"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={scrollResultRight}
                  className="p-1 hover:bg-white/20 rounded text-white transition-colors cursor-pointer"
                  title="Slide answer right"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}

            <div 
              ref={resultRef}
              className={`w-full text-right font-mono font-bold overflow-x-auto whitespace-nowrap scrollbar-none select-all transition-all py-1 pr-1 ${getResultFontSizeClass(result)} ${
                theme === "cosmic" ? "text-cyan-400" : 
                theme === "neumorphic" ? "text-[#00E676]" :
                theme === "financial" ? "text-[#556B2F]" : "text-gray-900"
              }`}
            >
              {result}
            </div>
          </div>
        </div>

        {/* Navigation & Slider Control Strip (Always Visible) */}
        <div className="flex flex-col space-y-2.5 mb-4 p-3 bg-black/10 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5" id="nexus-editing-console">
          {/* Arrows & Jumps */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-widest opacity-60">
              Editing Console
            </span>
            
            <div className="flex items-center space-x-1.5">
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={moveCursorToHome}
                className="px-2 py-1.5 rounded-lg bg-black/15 dark:bg-white/10 hover:bg-black/30 dark:hover:bg-white/20 text-[10px] font-black font-mono transition-all cursor-pointer"
                title="Move cursor to beginning"
              >
                Home
              </button>
              
              {/* Up Arrow - Focus Expression Input */}
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={focusExpression}
                className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center border ${
                  activeFocus === "expression"
                    ? theme === "cosmic" ? "bg-cyan-500 text-black shadow-sm shadow-cyan-500/20 border-cyan-500/30"
                      : theme === "neumorphic" ? "bg-[#00E676] text-black shadow-sm shadow-[#00E676]/20 border-[#00E676]/30"
                      : theme === "financial" ? "bg-[#556B2F] text-white shadow-sm border-[#556B2F]/30"
                      : "bg-gray-900 text-white shadow-sm border-gray-900"
                    : "bg-black/15 dark:bg-white/10 hover:bg-black/30 dark:hover:bg-white/20 border-transparent text-current"
                }`}
                title="Focus Expression (Up)"
              >
                <ChevronUp className="w-4 h-4" />
              </button>

              {/* Down Arrow - Focus Result */}
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={focusResult}
                className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center border ${
                  activeFocus === "result"
                    ? theme === "cosmic" ? "bg-cyan-500 text-black shadow-sm shadow-cyan-500/20 border-cyan-500/30"
                      : theme === "neumorphic" ? "bg-[#00E676] text-black shadow-sm shadow-[#00E676]/20 border-[#00E676]/30"
                      : theme === "financial" ? "bg-[#556B2F] text-white shadow-sm border-[#556B2F]/30"
                      : "bg-gray-900 text-white shadow-sm border-gray-900"
                    : "bg-black/15 dark:bg-white/10 hover:bg-black/30 dark:hover:bg-white/20 border-transparent text-current"
                }`}
                title="Focus Answer (Down)"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {/* Left Arrow */}
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleLeftArrowClick}
                className="p-1.5 rounded-lg bg-black/15 dark:bg-white/10 hover:bg-black/30 dark:hover:bg-white/20 transition-all cursor-pointer flex items-center"
                title={activeFocus === "expression" ? "Move cursor 1 space left" : "Slide answer left"}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {/* Right Arrow */}
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleRightArrowClick}
                className="p-1.5 rounded-lg bg-black/15 dark:bg-white/10 hover:bg-black/30 dark:hover:bg-white/20 transition-all cursor-pointer flex items-center"
                title={activeFocus === "expression" ? "Move cursor 1 space right" : "Slide answer right"}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={moveCursorToEnd}
                className="px-2 py-1.5 rounded-lg bg-black/15 dark:bg-white/10 hover:bg-black/30 dark:hover:bg-white/20 text-[10px] font-black font-mono transition-all cursor-pointer"
                title="Move cursor to end"
              >
                End
              </button>
            </div>
          </div>

          {/* Tactical Slide Scrub bar */}
          <div className="flex items-center space-x-2.5 pt-2 border-t border-black/5 dark:border-white/5">
            <span className="text-[9px] uppercase font-bold opacity-50 select-none">
              Slide Cursor:
            </span>
            <input
              type="range"
              min={0}
              max={expression.length || 1}
              value={cursorPosition}
              disabled={expression.length === 0}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setCursorPosition(val);
                if (inputRef.current) {
                  inputRef.current.focus();
                  inputRef.current.setSelectionRange(val, val);
                  scrollInputToCursor();
                }
              }}
              className={`flex-1 h-1.5 rounded-lg appearance-none outline-none ${expression.length === 0 ? "cursor-not-allowed bg-black/10 dark:bg-white/5 opacity-50" : "cursor-pointer bg-black/20 dark:bg-white/15"}`}
              style={{
                accentColor: theme === "cosmic" ? "#22d3ee" : theme === "neumorphic" ? "#00E676" : theme === "financial" ? "#556B2F" : "#111827"
              }}
            />
            <span className="text-[10px] font-mono opacity-60 font-bold bg-black/20 dark:bg-white/10 px-1.5 py-0.5 rounded-md min-w-[32px] text-center">
              {cursorPosition} / {expression.length}
            </span>
          </div>

          {/* Tactical Slide Result/Answer bar (for big numbers) */}
          {resultMaxScroll > 0 && (
            <div className="flex items-center space-x-2.5 pt-2 border-t border-black/5 dark:border-white/5">
              <span className="text-[9px] uppercase font-bold opacity-50 select-none">
                Slide Answer:
              </span>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={scrollResultLeft}
                className="p-1 rounded bg-black/10 dark:bg-white/5 hover:bg-black/20 dark:hover:bg-white/10 transition-all cursor-pointer text-xs"
                title="Slide left"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={resultMaxScroll > 0 ? Math.round((resultScrollLeft / resultMaxScroll) * 100) : 0}
                onChange={handleResultSliderChange}
                className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer bg-black/20 dark:bg-white/15 outline-none"
                style={{
                  accentColor: theme === "cosmic" ? "#22d3ee" : theme === "neumorphic" ? "#00E676" : theme === "financial" ? "#556B2F" : "#111827"
                }}
              />
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={scrollResultRight}
                className="p-1 rounded bg-black/10 dark:bg-white/5 hover:bg-black/20 dark:hover:bg-white/10 transition-all cursor-pointer text-xs"
                title="Slide right"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono opacity-60 font-bold bg-black/20 dark:bg-white/10 px-1.5 py-0.5 rounded-md text-center">
                {Math.round(resultScrollLeft)}px
              </span>
            </div>
          )}
        </div>

        {/* Advanced & Edit Tools Collapsible Toggle Bar */}
        <div className="flex items-center justify-between mb-4 mt-1 px-1" id="advanced-toggle-wrapper">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              const newVal = !isAdvancedExpanded;
              setIsAdvancedExpanded(newVal);
              localStorage.setItem("calc_show_advanced", String(newVal));
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer shadow-sm ${
              theme === "cosmic"
                ? "bg-white/5 border-white/10 hover:bg-white/10 text-cyan-400 active:bg-white/15"
                : theme === "neumorphic"
                ? "bg-zinc-900 border-zinc-800 hover:border-[#00E676]/30 text-[#00E676] active:bg-zinc-850"
                : theme === "financial"
                ? "bg-[#DFDFCB]/80 border-[#C5C5B2] hover:bg-[#D4D4B6] text-[#556B2F] active:bg-[#C9C9B4]"
                : "bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700 active:bg-gray-200"
            }`}
            id="toggle-advanced-calculator-tools"
          >
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-500 dark:text-cyan-400" />
              {isAdvancedExpanded ? "Hide Advanced Scientific Keys" : "Show Advanced Scientific Keys"}
            </span>
            <div className="flex items-center">
              {isAdvancedExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </button>
        </div>

        {isAdvancedExpanded && (
          /* Memory Buttons Row */
          <div className="grid grid-cols-4 gap-2 mb-4 animate-fadeIn">
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleMemory("MC")} className={s.btnMem} id="btn-mc">MC</button>
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleMemory("MR")} className={s.btnMem} id="btn-mr">MR</button>
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleMemory("M+")} className={s.btnMem} id="btn-mplus">M+</button>
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleMemory("M-")} className={s.btnMem} id="btn-mminus">M-</button>
          </div>
        )}

        {/* Buttons Grid */}
        <div className="grid grid-cols-4 gap-2.5">
          {isAdvancedExpanded ? (
            <>
              {/* Fn Row 1 */}
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleKeyPress("sin(")} className={s.btnFn} id="btn-sin">sin</button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleKeyPress("cos(")} className={s.btnFn} id="btn-cos">cos</button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleKeyPress("tan(")} className={s.btnFn} id="btn-tan">tan</button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => setIsDegreeMode(!isDegreeMode)} className={s.btnFn} id="btn-deg">
                {isDegreeMode ? "DEG ⇋" : "RAD ⇋"}
              </button>

              {/* Fn Row 2 */}
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleKeyPress("sqrt(")} className={s.btnFn} id="btn-sqrt">√</button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleKeyPress("^")} className={s.btnFn} id="btn-power">^</button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleKeyPress("log10(")} className={s.btnFn} id="btn-log">log</button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleKeyPress("ln(")} className={s.btnFn} id="btn-ln">ln</button>

              {/* Operations & numbers */}
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleKeyPress("(")} className={s.btnFn} id="btn-paren-open">(</button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleKeyPress(")")} className={s.btnFn} id="btn-paren-close">)</button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={handleFractionTemplate} className={`${s.btnFn} text-indigo-500 dark:text-cyan-400 font-extrabold text-xs sm:text-sm`} id="btn-fraction-adv">x/y</button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={handleBackspace} className={`${s.btnFn} text-red-500 font-bold`} id="btn-backspace">⌫</button>

              <button onMouseDown={(e) => e.preventDefault()} onClick={handleClear} className={`${s.btnOp} text-red-500`} id="btn-clear">C</button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleKeyPress("π")} className={s.btnOp} id="btn-pi">π</button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleKeyPress("%")} className={s.btnOp} id="btn-percent">%</button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleKeyPress("/")} className={s.btnOp} id="btn-div">÷</button>
            </>
          ) : (
            <>
              {/* Essential top row for basic calculator view */}
              <button onMouseDown={(e) => e.preventDefault()} onClick={handleClear} className={`${s.btnOp} text-red-500`} id="btn-clear-basic">C</button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={handleBackspace} className={`${s.btnOp} text-red-500 font-bold`} id="btn-backspace-basic">⌫</button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleKeyPress("%")} className={s.btnOp} id="btn-percent-basic">%</button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleKeyPress("/")} className={s.btnOp} id="btn-div-basic">÷</button>
            </>
          )}

          <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleKeyPress("7")} className={s.btnNum} id="btn-7">7</button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleKeyPress("8")} className={s.btnNum} id="btn-8">8</button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleKeyPress("9")} className={s.btnNum} id="btn-9">9</button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleKeyPress("*")} className={s.btnOp} id="btn-mul">×</button>

          <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleKeyPress("4")} className={s.btnNum} id="btn-4">4</button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleKeyPress("5")} className={s.btnNum} id="btn-5">5</button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleKeyPress("6")} className={s.btnNum} id="btn-6">6</button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleKeyPress("-")} className={s.btnOp} id="btn-minus">-</button>

          <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleKeyPress("1")} className={s.btnNum} id="btn-1">1</button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleKeyPress("2")} className={s.btnNum} id="btn-2">2</button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleKeyPress("3")} className={s.btnNum} id="btn-3">3</button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleKeyPress("+")} className={s.btnOp} id="btn-plus">+</button>

          {isAdvancedExpanded ? (
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleKeyPress("e")} className={s.btnNum} id="btn-e">e</button>
          ) : (
            <button onMouseDown={(e) => e.preventDefault()} onClick={handleFractionTemplate} className={`${s.btnOp} text-indigo-500 dark:text-cyan-400 font-extrabold text-base`} id="btn-fraction-basic">x/y</button>
          )}
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleKeyPress("0")} className={s.btnNum} id="btn-0">0</button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleKeyPress(".")} className={s.btnNum} id="btn-dot">.</button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={handleEvaluate} className={s.btnEqual} id="btn-equal">
            <CornerDownLeft className="w-5 h-5 mx-auto" />
          </button>
        </div>
      </div>

      {/* History Sidebar/Drawer */}
      <div className="flex flex-col w-full md:w-64 max-h-[520px]" id="calc-history-drawer">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 opacity-70 animate-pulse text-indigo-500" />
            <span className="text-xs font-black uppercase tracking-wider">Suite Logs</span>
          </div>
          {history.length > 0 && (
            <div className="flex space-x-1.5">
              <button
                onClick={downloadHistory}
                title="Download log history"
                className="p-1 text-gray-500 hover:text-indigo-600 transition-colors cursor-pointer"
                id="btn-download-history"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={onClearHistory}
                title="Clear all calculator history logs"
                className="p-1 text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
                id="btn-clear-history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className={`flex-1 rounded-2xl overflow-y-auto max-h-[480px] p-4 bg-black/15 dark:bg-black/40 border border-black/5 dark:border-white/5`}>
          {history.length === 0 ? (
            <div className="text-center text-xs opacity-50 py-12 font-mono flex flex-col items-center justify-center space-y-1">
              <span>No logs recorded yet.</span>
              <span className="text-[10px] opacity-75">Click "=" to save a calculation</span>
            </div>
          ) : (
            <div className="space-y-3.5">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="text-right pb-2.5 border-b border-black/5 dark:border-white/5 last:border-0 p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors group relative"
                  id={`history-item-${item.id}`}
                >
                  <div className="text-[10px] opacity-45 font-mono mb-0.5">{item.timestamp}</div>
                  
                  {/* Clickable Equation */}
                  <div 
                    onClick={() => insertAtCursor(item.equation)}
                    className="text-xs opacity-70 hover:opacity-100 font-mono cursor-pointer hover:text-indigo-500 dark:hover:text-cyan-400 transition-all truncate pr-1"
                    title="Click to paste equation at current cursor"
                  >
                    {item.equation}
                  </div>
                  
                  {/* Clickable Result */}
                  <div className="text-sm font-bold font-mono flex items-center justify-end space-x-1.5 mt-0.5">
                    <span 
                      onClick={() => insertAtCursor(item.result)}
                      className="text-indigo-500 dark:text-cyan-400 hover:scale-105 cursor-pointer transition-transform"
                      title="Click to paste result at current cursor"
                    >
                      = {item.result}
                    </span>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(item.result);
                      }}
                      className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-gray-400 hover:text-indigo-500 dark:hover:text-cyan-400 transition-colors"
                      title="Copy result to clipboard"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
