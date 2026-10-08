import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, Trash2, CheckSquare, Square, Download, FileText, 
  ImageIcon, DollarSign, Sparkles, Layers, ListPlus, Sliders,
  HelpCircle, Trash, Check, ArrowUpDown, ChevronDown, ShoppingBag,
  RotateCcw, Info, ShoppingCart
} from "lucide-react";
import { jsPDF } from "jspdf";
import domToImage from "dom-to-image-more";
import { Theme, GroceryItem } from "../types";

// Extends GroceryItem with optional category & tier
interface FuturisticGroceryItem extends GroceryItem {
  category?: string;
  isFavorite?: boolean;
}

interface GroceryListProps {
  theme: Theme;
}

export default function GroceryList({ theme }: GroceryListProps) {
  const [items, setItems] = useState<FuturisticGroceryItem[]>([]);
  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState("1");
  const [itemPrice, setItemPrice] = useState("4.99");
  const [itemCategory, setItemCategory] = useState("produce");
  
  // Bulk Input Mode state
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkError, setBulkError] = useState("");

  const [discountPct, setDiscountPct] = useState("10"); // percent
  const [taxPct, setTaxPct] = useState("8.25"); // percent
  
  // Filtering & Sorting
  const [activeCategoryFilter, setActiveCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "price" | "status" | "recent">("recent");

  const invoiceRef = useRef<HTMLDivElement>(null);

  // Default preset quick-add items
  const presets = [
    { name: "Organic Avocado", category: "produce", price: 1.89 },
    { name: "Fresh Blueberries", category: "produce", price: 3.49 },
    { name: "Premium Milk (1G)", category: "dairy", price: 3.99 },
    { name: "Greek Yogurt", category: "dairy", price: 1.25 },
    { name: "Artisan Bread", category: "bakery", price: 4.50 },
    { name: "Farmhouse Eggs (Dozen)", category: "dairy", price: 4.29 },
    { name: "Premium Salmon Fillet", category: "protein", price: 12.99 },
    { name: "Almond Butter", category: "pantry", price: 6.99 },
    { name: "Sparkling Water (6pk)", category: "beverages", price: 5.49 },
  ];

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem("grocery_items");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing local storage grocery items:", e);
      }
    } else {
      // Default placeholder futuristic list
      setItems([
        { id: "1", name: "Premium Salmon Fillet", quantity: 1, price: 12.99, checked: true, category: "protein" },
        { id: "2", name: "Organic Avocados (Pack)", quantity: 2, price: 4.50, checked: true, category: "produce" },
        { id: "3", name: "Almond Milk (Unsweetened)", quantity: 1, price: 3.29, checked: true, category: "dairy" },
        { id: "4", name: "Whole Wheat Sourdough", quantity: 1, price: 4.99, checked: false, category: "bakery" },
      ]);
    }
  }, []);

  const saveItems = (newItems: FuturisticGroceryItem[]) => {
    setItems(newItems);
    localStorage.setItem("grocery_items", JSON.stringify(newItems));
  };

  // Add standard single item
  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    const qty = parseInt(itemQty, 10) || 1;
    const price = parseFloat(itemPrice) || 0;

    const newItem: FuturisticGroceryItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      name: itemName.trim(),
      quantity: qty,
      price: price,
      checked: true,
      category: itemCategory,
    };

    saveItems([newItem, ...items]);
    setItemName("");
    setItemQty("1");
    setItemPrice("4.99");
  };

  // Smart multi-line parser for Bulk Input Mode
  const handleBulkAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    const lines = bulkText.split("\n");
    const parsedItems: FuturisticGroceryItem[] = [];
    let errorCount = 0;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Regular expressions to extract quantity, price, and item name
      // Supported formats:
      // - 2 Milk at 3.99
      // - Apple, 1.50
      // - Bread
      // - 3 Bananas
      let qty = 1;
      let price = 4.99;
      let name = trimmed;

      // Match pattern like "3 Milk @ 2.50" or "3 Milk at 2.50"
      const ratePattern = /^(\d+)\s+([\w\s\-]+?)\s+(?:@|at|\$)\s*([\d\.]+)/i;
      const rateMatch = trimmed.match(ratePattern);

      if (rateMatch) {
        qty = parseInt(rateMatch[1], 10) || 1;
        name = rateMatch[2].trim();
        price = parseFloat(rateMatch[3]) || 4.99;
      } else {
        // Match pattern like "3 Milk" or "3x Milk"
        const qtyPattern = /^(\d+)\s*x?\s+(.+)/i;
        const qtyMatch = trimmed.match(qtyPattern);

        if (qtyMatch) {
          qty = parseInt(qtyMatch[1], 10) || 1;
          name = qtyMatch[2].trim();
        } else {
          // Check for ending price e.g. "Bread $3.50" or "Bread 3.50"
          const pricePattern = /(.+?)\s+(?:\$)?([\d\.]+)$/;
          const priceMatch = trimmed.match(pricePattern);
          if (priceMatch && !isNaN(Number(priceMatch[2]))) {
            name = priceMatch[1].trim();
            price = parseFloat(priceMatch[2]) || 4.99;
          }
        }
      }

      // Auto assign simple category based on key phrases
      let category = "other";
      const nameLower = name.toLowerCase();
      if (["milk", "cheese", "yogurt", "butter", "cream"].some(k => nameLower.includes(k))) {
        category = "dairy";
      } else if (["apple", "banana", "avocado", "berry", "fruit", "lemon", "vegetable", "tomato", "salad", "spinach", "garlic", "onion"].some(k => nameLower.includes(k))) {
        category = "produce";
      } else if (["bread", "bagel", "sourdough", "croissant", "toast", "bun"].some(k => nameLower.includes(k))) {
        category = "bakery";
      } else if (["salmon", "beef", "chicken", "meat", "pork", "steak", "egg", "fish", "tuna"].some(k => nameLower.includes(k))) {
        category = "protein";
      } else if (["juice", "water", "soda", "coffee", "tea", "drink"].some(k => nameLower.includes(k))) {
        category = "beverages";
      } else if (["almond", "pantry", "rice", "pasta", "sauce", "oil", "sugar", "salt", "snack", "chip"].some(k => nameLower.includes(k))) {
        category = "pantry";
      }

      parsedItems.push({
        id: (Date.now() + Math.random() * 1000).toString(),
        name: name,
        quantity: qty,
        price: price,
        checked: true,
        category: category,
      });
    });

    if (parsedItems.length > 0) {
      saveItems([...parsedItems, ...items]);
      setBulkText("");
      setIsBulkMode(false);
      setBulkError("");
    } else {
      setBulkError("Could not parse any valid items. Try entering one per line.");
    }
  };

  const handleQuickAddPreset = (preset: typeof presets[0]) => {
    const existing = items.find(i => i.name.toLowerCase() === preset.name.toLowerCase() && i.category === preset.category);
    if (existing) {
      updateItemQty(existing.id, existing.quantity + 1);
    } else {
      const newItem: FuturisticGroceryItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        name: preset.name,
        quantity: 1,
        price: preset.price,
        checked: true,
        category: preset.category,
      };
      saveItems([newItem, ...items]);
    }
  };

  const deleteItem = (id: string) => {
    saveItems(items.filter((item) => item.id !== id));
  };

  const toggleItem = (id: string) => {
    saveItems(
      items.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const updateItemQty = (id: string, qty: number) => {
    saveItems(
      items.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, qty) } : item))
    );
  };

  const updateItemPrice = (id: string, price: number) => {
    saveItems(
      items.map((item) => (item.id === id ? { ...item, price: Math.max(0, price) } : item))
    );
  };

  const clearCheckedItems = () => {
    saveItems(items.filter(i => !i.checked));
  };

  const clearAll = () => {
    if (confirm("Are you sure you want to reset the entire database checklist?")) {
      saveItems([]);
    }
  };

  // Calculations
  const checkedItems = items.filter((item) => item.checked);
  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const checkedItemsCount = checkedItems.reduce((acc, item) => acc + item.quantity, 0);
  const completionPercentage = totalItemsCount > 0 ? Math.round((checkedItemsCount / totalItemsCount) * 100) : 0;

  const subtotal = checkedItems.reduce((acc, item) => acc + item.quantity * item.price, 0);
  const discAmt = subtotal * ((parseFloat(discountPct) || 0) / 100);
  const taxableAmount = Math.max(0, subtotal - discAmt);
  const taxAmt = taxableAmount * ((parseFloat(taxPct) || 0) / 100);
  const totalAmount = taxableAmount + taxAmt;

  // Filtered & Sorted items
  const filteredItems = items.filter((item) => {
    if (activeCategoryFilter === "all") return true;
    if (activeCategoryFilter === "checked") return item.checked;
    if (activeCategoryFilter === "pending") return !item.checked;
    return item.category === activeCategoryFilter;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "price") return (b.price * b.quantity) - (a.price * a.quantity);
    if (sortBy === "status") return (a.checked ? 1 : 0) - (b.checked ? 1 : 0);
    return 0; // default to recent (order added/unsorted)
  });

  // PDF Export
  const exportToPdf = () => {
    const doc = new jsPDF();
    
    // PDF Styling
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(30, 30, 30);
    doc.text("QUANTUM SHOPPING LEDGER", 14, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(110, 110, 110);
    doc.text(`Digital Verification Hash: ${Math.random().toString(36).substr(2, 10).toUpperCase()}`, 14, 26);
    doc.text(`Timestamp: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 31);
    
    doc.setDrawColor(220, 220, 220);
    doc.line(14, 35, 196, 35);

    // Table Headers
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(70, 70, 70);
    doc.text("Item Description", 14, 45);
    doc.text("Category", 100, 45);
    doc.text("Qty", 130, 45);
    doc.text("Unit Price", 150, 45);
    doc.text("Extended", 175, 45);

    doc.line(14, 49, 196, 49);

    // Table Content
    let currentY = 57;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);

    checkedItems.forEach((item) => {
      doc.text(item.name, 14, currentY);
      doc.text((item.category || "other").toUpperCase(), 100, currentY);
      doc.text(item.quantity.toString(), 130, currentY);
      doc.text(`$${item.price.toFixed(2)}`, 150, currentY);
      doc.text(`$${(item.quantity * item.price).toFixed(2)}`, 175, currentY);
      currentY += 8;

      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
      }
    });

    currentY += 4;
    doc.line(14, currentY, 196, currentY);
    currentY += 10;

    // Totals Section
    doc.setFont("helvetica", "normal");
    doc.text("Pre-tax Subtotal:", 135, currentY);
    doc.text(`$${subtotal.toFixed(2)}`, 175, currentY);
    
    currentY += 6;
    doc.text(`Applied Discount (${discountPct}%):`, 135, currentY);
    doc.text(`-$${discAmt.toFixed(2)}`, 175, currentY);

    currentY += 6;
    doc.text(`Projected Tax (${taxPct}%):`, 135, currentY);
    doc.text(`$${taxAmt.toFixed(2)}`, 175, currentY);

    currentY += 8;
    doc.line(135, currentY - 2, 196, currentY - 2);
    doc.setFont("helvetica", "bold");
    doc.text("Cart Grand Total:", 135, currentY);
    doc.text(`$${totalAmount.toFixed(2)}`, 175, currentY);

    doc.save(`quantum-invoice-${Date.now()}.pdf`);
  };

  // PNG Export
  const exportToPng = () => {
    if (!invoiceRef.current) return;

    domToImage
      .toPng(invoiceRef.current, { 
        bgcolor: theme === "cosmic" || theme === "neumorphic" ? "#0a0a0c" : "#FDFDFD" 
      })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `quantum-invoice-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((error) => {
        console.error("Oops, PNG export failed!", error);
      });
  };

  // Dynamic Theme Styling Mapping
  const getThemeStyles = () => {
    switch (theme) {
      case "cosmic":
        return {
          wrapper: "grid grid-cols-1 lg:grid-cols-12 gap-6 text-white font-sans",
          glassCard: "backdrop-blur-xl bg-slate-950/40 border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.6)] rounded-3xl p-5.5 transition-all",
          titleSec: "text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)] font-black text-lg uppercase tracking-wider flex items-center gap-2",
          inputField: "w-full bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 transition-all",
          tabBtn: (active: boolean) => `px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all uppercase tracking-widest cursor-pointer ${
            active 
              ? "bg-cyan-500 text-slate-950 font-black shadow-[0_0_12px_rgba(6,182,212,0.3)] scale-105" 
              : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5"
          }`,
          presetChip: "px-2.5 py-1 bg-white/5 hover:bg-cyan-500/10 border border-white/5 text-slate-300 hover:text-cyan-400 rounded-xl text-xs font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center gap-1",
          itemRow: (checked: boolean) => `flex flex-col md:flex-row md:items-center justify-between gap-3.5 p-3.5 rounded-2xl border transition-all ${
            checked 
              ? "bg-slate-900/30 border-white/5 opacity-80" 
              : "bg-gradient-to-r from-slate-900/60 to-slate-950/60 border-cyan-500/10 hover:border-cyan-500/35 hover:translate-x-0.5"
          }`,
          qtyStepper: "w-24 flex items-center justify-between bg-slate-900/80 border border-white/5 rounded-xl px-2 py-1 text-xs",
          interactiveBtn: "p-1 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-white/5 transition-all cursor-pointer",
          submitBtn: "bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-black px-4.5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-1.5",
          accentText: "text-cyan-400 font-extrabold",
          receiptPanel: "bg-slate-955 border border-white/10 rounded-3xl p-5 shadow-2xl relative overflow-hidden",
          actionBtn: "flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer text-slate-300"
        };
      case "neumorphic":
        return {
          wrapper: "grid grid-cols-1 lg:grid-cols-12 gap-6 text-zinc-200 font-sans",
          glassCard: "bg-[#181818] border border-zinc-800 shadow-[inset_1px_1px_5px_rgba(255,255,255,0.02),_0_12px_30px_rgba(0,0,0,0.7)] rounded-3xl p-5.5",
          titleSec: "text-[#00E676] font-black text-lg uppercase tracking-wider flex items-center gap-2",
          inputField: "w-full bg-zinc-950 border border-zinc-800 text-zinc-200 placeholder-zinc-700 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#00E676] focus:border-[#00E676] transition-all",
          tabBtn: (active: boolean) => `px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all uppercase tracking-widest cursor-pointer ${
            active 
              ? "bg-[#00E676] text-black font-black shadow-[0_0_12px_rgba(0,230,118,0.3)] scale-105" 
              : "bg-zinc-900 hover:bg-zinc-850 text-zinc-400 border border-zinc-800"
          }`,
          presetChip: "px-2.5 py-1 bg-zinc-900 hover:border-[#00E676]/30 border border-zinc-800 text-zinc-400 hover:text-[#00E676] rounded-xl text-xs font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center gap-1",
          itemRow: (checked: boolean) => `flex flex-col md:flex-row md:items-center justify-between gap-3.5 p-3.5 rounded-2xl border transition-all ${
            checked 
              ? "bg-zinc-950/40 border-zinc-900 opacity-60" 
              : "bg-zinc-900/60 border-zinc-800 hover:border-[#00E676]/25 hover:translate-x-0.5"
          }`,
          qtyStepper: "w-24 flex items-center justify-between bg-zinc-950 border border-zinc-850 rounded-xl px-2 py-1 text-xs",
          interactiveBtn: "p-1 rounded-lg text-zinc-400 hover:text-[#00E676] hover:bg-zinc-800 transition-all cursor-pointer",
          submitBtn: "bg-[#00E676] hover:bg-[#12cf6c] text-black font-black px-4.5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-1.5",
          accentText: "text-[#00E676] font-extrabold",
          receiptPanel: "bg-zinc-950 border border-zinc-900 rounded-3xl p-5 shadow-2xl relative overflow-hidden",
          actionBtn: "flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3.5 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer text-zinc-300"
        };
      case "financial":
        return {
          wrapper: "grid grid-cols-1 lg:grid-cols-12 gap-6 text-[#3C3C30] font-sans",
          glassCard: "bg-[#F4F4E2] border border-[#BCBCA6] shadow-md rounded-3xl p-5.5",
          titleSec: "text-[#556B2F] font-black text-lg uppercase tracking-wider flex items-center gap-2",
          inputField: "w-full bg-[#FCFDF6] border border-[#BCBCA6] text-[#3C3C30] placeholder-[#BCBCA6] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#556B2F] transition-all",
          tabBtn: (active: boolean) => `px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all uppercase tracking-widest cursor-pointer ${
            active 
              ? "bg-[#556B2F] text-white font-black scale-105" 
              : "bg-[#ECECD8] hover:bg-[#E3E3CA] text-[#3C3C30] border border-[#BCBCA6]"
          }`,
          presetChip: "px-2.5 py-1 bg-[#ECECD8] hover:border-[#556B2F] border border-[#BCBCA6] text-[#556B2F] rounded-xl text-xs font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center gap-1",
          itemRow: (checked: boolean) => `flex flex-col md:flex-row md:items-center justify-between gap-3.5 p-3.5 rounded-2xl border transition-all ${
            checked 
              ? "bg-[#DFDFCB]/40 border-[#BCBCA6]/40 opacity-60" 
              : "bg-[#DFDFCB]/70 border-[#BCBCA6] hover:border-[#556B2F] hover:translate-x-0.5"
          }`,
          qtyStepper: "w-24 flex items-center justify-between bg-[#F4F4E2] border border-[#BCBCA6] rounded-xl px-2 py-1 text-xs",
          interactiveBtn: "p-1 rounded-lg text-[#556B2F] hover:bg-[#ECECD8] transition-all cursor-pointer",
          submitBtn: "bg-[#556B2F] hover:bg-[#475b24] text-white font-black px-4.5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-1.5",
          accentText: "text-[#556B2F] font-extrabold",
          receiptPanel: "bg-[#FCFDF6] border border-[#BCBCA6] rounded-3xl p-5 shadow-sm relative overflow-hidden",
          actionBtn: "flex items-center justify-center gap-1.5 bg-[#E2E2CE] hover:bg-[#D4D4BC] border border-[#BCBCA6] px-3.5 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer text-[#556B2F]"
        };
      case "minimalist":
      default:
        return {
          wrapper: "grid grid-cols-1 lg:grid-cols-12 gap-6 text-gray-800 font-sans",
          glassCard: "bg-white border-2 border-gray-900 shadow-sm rounded-3xl p-5.5",
          titleSec: "text-gray-900 font-black text-lg uppercase tracking-wider flex items-center gap-2",
          inputField: "w-full bg-gray-50 border-2 border-gray-900 text-gray-800 placeholder-gray-400 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:bg-white transition-all",
          tabBtn: (active: boolean) => `px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all uppercase tracking-widest cursor-pointer ${
            active 
              ? "bg-gray-900 text-white font-black scale-105" 
              : "bg-gray-100 hover:bg-gray-250 text-gray-600 border border-gray-200"
          }`,
          presetChip: "px-2.5 py-1 bg-gray-100 hover:border-gray-900 border border-gray-200 text-gray-600 hover:text-gray-900 rounded-xl text-xs font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center gap-1",
          itemRow: (checked: boolean) => `flex flex-col md:flex-row md:items-center justify-between gap-3.5 p-3.5 rounded-2xl border-2 transition-all ${
            checked 
              ? "bg-gray-50 border-gray-200 opacity-60" 
              : "bg-white border-gray-900 hover:translate-x-0.5"
          }`,
          qtyStepper: "w-24 flex items-center justify-between bg-gray-50 border border-gray-300 rounded-xl px-2 py-1 text-xs",
          interactiveBtn: "p-1 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all cursor-pointer",
          submitBtn: "bg-gray-900 hover:bg-gray-800 text-white font-black px-4.5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-1.5",
          accentText: "text-gray-900 font-black",
          receiptPanel: "bg-white border-2 border-gray-900 rounded-3xl p-5 shadow-sm relative overflow-hidden",
          actionBtn: "flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 px-3.5 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer text-gray-700"
        };
    }
  };

  const s = getThemeStyles();

  // Helper category tags with colored icons
  const getCategoryColor = (cat?: string) => {
    switch (cat) {
      case "produce":
        return {
          dot: "bg-emerald-500",
          text: "text-emerald-400",
          bg: "bg-emerald-500/10 border-emerald-500/20",
          icon: "🍏",
        };
      case "dairy":
        return {
          dot: "bg-sky-500",
          text: "text-sky-400",
          bg: "bg-sky-500/10 border-sky-500/20",
          icon: "🥛",
        };
      case "bakery":
        return {
          dot: "bg-amber-500",
          text: "text-amber-400",
          bg: "bg-amber-500/10 border-amber-500/20",
          icon: "🍞",
        };
      case "protein":
        return {
          dot: "bg-rose-500",
          text: "text-rose-400",
          bg: "bg-rose-500/10 border-rose-500/20",
          icon: "🥩",
        };
      case "beverages":
        return {
          dot: "bg-indigo-500",
          text: "text-indigo-400",
          bg: "bg-indigo-500/10 border-indigo-500/20",
          icon: "☕",
        };
      case "pantry":
        return {
          dot: "bg-orange-500",
          text: "text-orange-400",
          bg: "bg-orange-500/10 border-orange-500/20",
          icon: "🥫",
        };
      default:
        return {
          dot: "bg-slate-400",
          text: "text-slate-400",
          bg: "bg-slate-500/10 border-slate-500/20",
          icon: "📦",
        };
    }
  };

  return (
    <div className={s.wrapper} id="futuristic-grocery-and-checklist-suite">
      
      {/* LEFT COLUMN: Controls & Smart Checklist List (Takes up 8/12 grid on desktop) */}
      <div className="lg:col-span-8 flex flex-col space-y-6">
        
        {/* Futuristic Dashboard Summary Widget */}
        <div className={s.glassCard}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <span className="text-[10px] uppercase font-black opacity-55 tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                Hyper-Calculated Suite
              </span>
              <h2 className="text-xl font-black tracking-tight mt-0.5 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-500" />
                Autonomous Checklist
              </h2>
            </div>
            
            {/* Elegant Circular/Ring Progress Tracker Panel */}
            <div className="flex items-center space-x-4 bg-black/10 dark:bg-white/5 p-3 rounded-2xl border border-black/5 dark:border-white/5">
              <div className="relative w-12 h-12 flex items-center justify-center select-none">
                {/* SVG Progress Circle */}
                <svg className="absolute w-full h-full transform -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    className="stroke-black/10 dark:stroke-white/10"
                    strokeWidth="3"
                    fill="transparent"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    className="stroke-indigo-500 dark:stroke-cyan-400 transition-all duration-500 ease-out"
                    strokeWidth="3"
                    fill="transparent"
                    strokeDasharray={125.6}
                    strokeDashoffset={125.6 - (125.6 * completionPercentage) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-[10px] font-black text-indigo-500 dark:text-cyan-400">{completionPercentage}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-black tracking-widest opacity-60">Status Scan</span>
                <span className="text-xs font-extrabold mt-0.5">
                  {checkedItemsCount} / {totalItemsCount} Products Loaded
                </span>
              </div>
            </div>
          </div>

          {/* Quick preset chips to fast track cart formulation */}
          <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5">
            <span className="text-[9px] uppercase font-black opacity-60 tracking-wider block mb-2">Fast Curation Presets</span>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handleQuickAddPreset(preset)}
                  className={s.presetChip}
                >
                  <span>{getCategoryColor(preset.category).icon}</span>
                  <span>{preset.name}</span>
                  <span className="opacity-50 text-[10px]">${preset.price.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Multi-Mode Input Panel (Single vs Multi-Pasting) */}
        <div className={s.glassCard}>
          <div className="flex items-center justify-between mb-4 border-b border-black/5 dark:border-white/5 pb-3">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-wider">Formulation Input Core</h3>
            </div>
            
            {/* Segmented Control Mode Toggle */}
            <div className="flex bg-black/10 dark:bg-white/5 p-1 rounded-xl border border-black/5 dark:border-white/5">
              <button
                onClick={() => setIsBulkMode(false)}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  !isBulkMode 
                    ? "bg-indigo-500 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-md" 
                    : "opacity-60 text-slate-400"
                }`}
              >
                Single Item
              </button>
              <button
                onClick={() => setIsBulkMode(true)}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  isBulkMode 
                    ? "bg-indigo-500 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-md" 
                    : "opacity-60 text-slate-400"
                }`}
                id="btn-bulk-mode-toggle"
              >
                Bulk Import
              </button>
            </div>
          </div>

          {/* Normal Mode Form */}
          {!isBulkMode ? (
            <form onSubmit={addItem} className="grid grid-cols-1 md:grid-cols-12 gap-3" id="grocery-add-form">
              <div className="md:col-span-5">
                <label className="block text-[9px] uppercase font-black opacity-55 tracking-wider mb-1">Product Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Cold Brew Coffee..."
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className={s.inputField}
                  id="add-item-name"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[9px] uppercase font-black opacity-55 tracking-wider mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={itemQty}
                  onChange={(e) => setItemQty(e.target.value)}
                  className={s.inputField}
                  id="add-item-qty"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[9px] uppercase font-black opacity-55 tracking-wider mb-1">Rate ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  className={s.inputField}
                  id="add-item-price"
                />
              </div>

              <div className="md:col-span-3 flex flex-col justify-end">
                <label className="block text-[9px] uppercase font-black opacity-55 tracking-wider mb-1">Category</label>
                <div className="flex gap-1.5">
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="flex-1 bg-slate-900 border border-white/10 text-white rounded-xl px-2 py-2 text-xs focus:outline-none dark:bg-zinc-950 dark:text-zinc-300"
                    style={{ colorScheme: "dark" }}
                  >
                    <option value="produce">🍎 Produce</option>
                    <option value="dairy">🥛 Dairy</option>
                    <option value="bakery">🍞 Bakery</option>
                    <option value="protein">🥩 Protein</option>
                    <option value="beverages">☕ Beverages</option>
                    <option value="pantry">🥫 Pantry</option>
                    <option value="other">📦 Other</option>
                  </select>
                  <button type="submit" className={s.submitBtn} id="btn-add-item">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
          ) : (
            // Bulk / Paste Mode
            <form onSubmit={handleBulkAdd} className="space-y-3.5">
              <div className="bg-blue-500/5 border border-blue-500/15 p-3 rounded-xl flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed opacity-85">
                  <p className="font-extrabold uppercase text-blue-400 tracking-wider">Hyper-Parser Guidance</p>
                  <p className="mt-0.5">Paste multiple items, one per line. We will auto-extract quantities, pricing, and category tagging instantly!</p>
                  <p className="font-mono text-[10px] mt-1 text-slate-500 dark:text-slate-400">Examples: "2 Fresh Berries at 3.99" | "Yogurt 1.25" | "3 Loaf of Bread"</p>
                </div>
              </div>

              <textarea
                rows={4}
                required
                placeholder="Type or paste items here (one item per line)..."
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                className="w-full bg-slate-900/80 border border-white/10 text-white placeholder-slate-600 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 font-mono transition-all dark:bg-zinc-950 dark:text-zinc-300"
              />

              {bulkError && <p className="text-rose-500 text-xs font-semibold">{bulkError}</p>}

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsBulkMode(false);
                    setBulkText("");
                    setBulkError("");
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={s.submitBtn}
                >
                  <ListPlus className="w-4 h-4" />
                  <span>Execute Bulk Load</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Smart Checklist Feed (Filters + Sorting + Items Feed) */}
        <div className={s.glassCard}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-3 border-b border-black/5 dark:border-white/5">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "all", label: "All Items" },
                { id: "produce", label: "🍎 Produce" },
                { id: "dairy", label: "🥛 Dairy" },
                { id: "bakery", label: "🍞 Bakery" },
                { id: "protein", label: "🥩 Protein" },
                { id: "pantry", label: "🥫 Pantry" },
                { id: "checked", label: "✅ Checked" },
                { id: "pending", label: "⏳ Pending" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategoryFilter(tab.id)}
                  className={s.tabBtn(activeCategoryFilter === tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-[10px] font-black uppercase opacity-65 tracking-wider flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3" />
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-black/10 dark:bg-slate-900 border border-black/10 dark:border-white/10 text-xs rounded-xl px-2.5 py-1 text-slate-300 focus:outline-none"
              >
                <option value="recent">🕒 Loaded Order</option>
                <option value="name">🔤 Alphabetical</option>
                <option value="price">💵 Price Metric</option>
                <option value="status">🔳 Progress Status</option>
              </select>
            </div>
          </div>

          {/* Action Row for multi-curation */}
          {items.length > 0 && (
            <div className="flex items-center justify-between mb-3 px-1 text-[11px]">
              <span className="opacity-55 font-semibold">
                Showing {sortedItems.length} of {items.length} items
              </span>
              <div className="flex items-center space-x-2.5">
                <button
                  onClick={clearCheckedItems}
                  className="text-amber-500 hover:text-amber-600 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1 cursor-pointer"
                  title="Purge checked items from list"
                >
                  <CheckSquare className="w-3 h-3" />
                  Purge Checked
                </button>
                <button
                  onClick={clearAll}
                  className="text-rose-500 hover:text-rose-600 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1 cursor-pointer"
                  title="Wipe database checklist"
                >
                  <Trash2 className="w-3 h-3" />
                  Reset Core
                </button>
              </div>
            </div>
          )}

          {/* Core Items Scroller */}
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin" id="grocery-items-scroller">
            {sortedItems.length === 0 ? (
              <div className="text-center py-12 bg-black/10 dark:bg-white/5 rounded-2xl border border-dashed border-black/10 dark:border-white/10">
                <ShoppingCart className="w-8 h-8 mx-auto opacity-30 mb-2.5 text-indigo-500" />
                <p className="font-extrabold uppercase tracking-widest text-[10px] opacity-60">Database Standby</p>
                <p className="text-xs text-slate-500 mt-1 max-w-[280px] mx-auto">No items match the selected filters. Formulate products or load presets above.</p>
              </div>
            ) : (
              sortedItems.map((item) => {
                const catInfo = getCategoryColor(item.category);
                return (
                  <div
                    key={item.id}
                    className={s.itemRow(item.checked)}
                    id={`grocery-item-${item.id}`}
                  >
                    {/* Checkbox and Name description */}
                    <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                      <button
                        onClick={() => toggleItem(item.id)}
                        className="text-slate-400 hover:text-indigo-500 dark:hover:text-cyan-400 transition-colors cursor-pointer shrink-0"
                        id={`btn-toggle-item-${item.id}`}
                      >
                        {item.checked ? (
                          <CheckSquare className="w-5 h-5 text-indigo-500 dark:text-cyan-400" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-extrabold truncate ${item.checked ? "line-through opacity-45" : ""}`}>
                          {item.name}
                        </p>
                        <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md mt-1 border ${catInfo.bg} ${catInfo.text}`}>
                          <span>{catInfo.icon}</span>
                          <span>{item.category || "other"}</span>
                        </span>
                      </div>
                    </div>

                    {/* Steppers & Numerical Modifiers */}
                    <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 border-black/5 dark:border-white/5 pt-2 md:pt-0">
                      
                      {/* Stepper Quantity control */}
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] opacity-45 font-bold uppercase">Qty:</span>
                        <div className={s.qtyStepper}>
                          <button
                            onClick={() => updateItemQty(item.id, item.quantity - 1)}
                            className="w-5 h-5 flex items-center justify-center font-bold text-slate-400 hover:text-indigo-400 hover:bg-black/15 rounded-lg"
                          >
                            -
                          </button>
                          <span className="font-mono text-xs font-black">{item.quantity}</span>
                          <button
                            onClick={() => updateItemQty(item.id, item.quantity + 1)}
                            className="w-5 h-5 flex items-center justify-center font-bold text-slate-400 hover:text-indigo-400 hover:bg-black/15 rounded-lg"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Item unit price */}
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] opacity-45 font-bold uppercase">Rate:</span>
                        <div className="relative">
                          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-60">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.price}
                            onChange={(e) => updateItemPrice(item.id, parseFloat(e.target.value) || 0)}
                            className="w-16 bg-black/15 border border-black/15 dark:border-white/5 rounded-lg font-mono text-xs pl-4.5 pr-1 py-1 text-center font-bold"
                          />
                        </div>
                      </div>

                      {/* Extended total */}
                      <span className="w-16 text-right font-mono text-xs font-black tracking-tight text-indigo-500 dark:text-cyan-400">
                        ${(item.quantity * item.price).toFixed(2)}
                      </span>

                      {/* Trash action */}
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                        id={`btn-delete-item-${item.id}`}
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Receipt, Ledger & Invoice Projections (Takes up 4/12 grid) */}
      <div className="lg:col-span-4 flex flex-col justify-between">
        <div className={s.receiptPanel} id="grocery-invoice-summary-container">
          
          {/* Aesthetic design overlay for receipt tape */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400" />
          
          <div ref={invoiceRef} className="flex flex-col h-full" id="grocery-invoice-element">
            {/* Holographic Header */}
            <div className="border-b border-dashed border-black/15 dark:border-white/10 pb-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className={`w-5 h-5 ${s.accentText}`} />
                  <h3 className="text-xs font-black uppercase tracking-widest font-mono">Quantum Ledger</h3>
                </div>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-mono px-2 py-0.5 rounded-md uppercase font-black tracking-wider">
                  Live Verify
                </span>
              </div>
              <div className="flex items-center justify-between text-[9px] font-mono opacity-50 mt-2">
                <span>TX: #8909-CS</span>
                <span>SECURE CHECKOUT</span>
              </div>
            </div>

            {/* Micro receipt description list */}
            <div className="space-y-2 mb-6 max-h-52 overflow-y-auto scrollbar-thin pr-0.5 border-b border-dashed border-black/15 dark:border-white/10 pb-4">
              {checkedItems.length === 0 ? (
                <div className="text-center py-6 font-mono text-[10px] opacity-40">
                  ⚠️ Ledger Standby<br />Check items on left to generate instant calculations.
                </div>
              ) : (
                checkedItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs font-mono">
                    <span className="truncate max-w-[140px] opacity-80">
                      {item.name} <span className="opacity-50">x{item.quantity}</span>
                    </span>
                    <span className="opacity-50 flex-1 border-b border-dotted border-black/10 dark:border-white/5 mx-2" />
                    <span className="font-bold shrink-0">${(item.quantity * item.price).toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>

            {/* Calculations & Modifiers sliders */}
            <div className="space-y-3 pt-1 mb-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-[9px] font-black uppercase tracking-wider opacity-60 mb-1">Discount Coupon %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPct}
                    onChange={(e) => setDiscountPct(e.target.value)}
                    className="w-full bg-black/10 border border-black/10 dark:bg-slate-900 dark:border-white/10 rounded-lg px-2 py-1 text-xs font-mono text-center font-bold"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[9px] font-black uppercase tracking-wider opacity-60 mb-1">Projected Sales Tax %</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={taxPct}
                    onChange={(e) => setTaxPct(e.target.value)}
                    className="w-full bg-black/10 border border-black/10 dark:bg-slate-900 dark:border-white/10 rounded-lg px-2 py-1 text-xs font-mono text-center font-bold"
                  />
                </div>
              </div>

              {/* Subtotal metrics */}
              <div className="space-y-2 bg-black/5 dark:bg-white/5 p-3.5 rounded-2xl border border-black/5 dark:border-white/5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="opacity-60">Subtotal:</span>
                  <span className="font-bold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-mono text-green-500">
                  <span className="opacity-70">Discounts ({discountPct}%):</span>
                  <span className="font-bold">-${discAmt.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="opacity-60">Sales Tax ({taxPct}%):</span>
                  <span className="font-bold">${taxAmt.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-dashed border-black/15 dark:border-white/10 pt-2.5 font-mono">
                  <span className="text-xs font-black uppercase opacity-85">Invoice Total:</span>
                  <span className={`text-lg font-black tracking-tight ${s.accentText}`}>
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Pure CSS Futuristic Barcode for design value */}
            <div className="flex flex-col items-center justify-center pt-2 mb-2 select-none border-t border-dashed border-black/15 dark:border-white/10">
              <div className="h-8 flex items-end justify-center space-x-[1.5px] opacity-40 dark:opacity-60 max-w-full">
                <div className="w-1.5 h-full bg-current" />
                <div className="w-[1px] h-full bg-current" />
                <div className="w-[1px] h-full bg-current" />
                <div className="w-1 h-full bg-current" />
                <div className="w-[1px] h-full bg-current" />
                <div className="w-1.5 h-full bg-current" />
                <div className="w-[1px] h-full bg-current" />
                <div className="w-2 h-full bg-current" />
                <div className="w-[1px] h-full bg-current" />
                <div className="w-1 h-full bg-current" />
                <div className="w-1.5 h-full bg-current" />
                <div className="w-[1px] h-full bg-current" />
                <div className="w-2 h-full bg-current" />
                <div className="w-1 h-full bg-current" />
              </div>
              <span className="text-[8px] font-mono opacity-50 uppercase tracking-widest mt-1">
                *SUITE-{totalAmount.toFixed(2).replace(".", "")}*
              </span>
            </div>

          </div>

          {/* Action trigger exports */}
          <div className="grid grid-cols-2 gap-2.5 mt-4" id="grocery-invoice-actions">
            <button
              onClick={exportToPdf}
              className={s.actionBtn}
              title="Download clean PDF format"
              id="btn-invoice-pdf"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>PDF Render</span>
            </button>
            <button
              onClick={exportToPng}
              className={s.actionBtn}
              title="Save beautiful transparent PNG image"
              id="btn-invoice-png"
            >
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>PNG Snapshot</span>
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
