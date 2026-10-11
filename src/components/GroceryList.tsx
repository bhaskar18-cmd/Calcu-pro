import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  CheckSquare,
  Square,
  ShoppingBag,
  ShoppingCart,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  Edit3,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  Globe,
  ChevronDown,
  Search,
  Receipt,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { Theme, GroceryItem, DayListModel, ListType, ItemUnit } from "../types";
import { detectGroceryUnit } from "../utils/groceryDetector";
import {
  CountryConfig,
  getStoredCountry,
  saveStoredCountry,
  formatCurrencyAmount,
  formatItemRateWithCountry,
} from "../utils/countryConfig";
import CountryPickerModal from "./CountryPickerModal";
import BillReceiptModal from "./BillReceiptModal";
import { exportCsvFile, buildCsvContent } from "../utils/fileExporter";

interface GroceryListProps {
  theme: Theme;
  country?: CountryConfig;
  onCountryChange?: (c: CountryConfig) => void;
}

// Modern accent colors
const COLOR_ACCENTS = [
  { id: "cyan", label: "Cyan", dot: "bg-cyan-500", badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/25" },
  { id: "emerald", label: "Emerald", dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" },
  { id: "violet", label: "Violet", dot: "bg-violet-500", badge: "bg-violet-500/10 text-violet-400 border-violet-500/25" },
  { id: "amber", label: "Amber", dot: "bg-amber-500", badge: "bg-amber-500/10 text-amber-400 border-amber-500/25" },
  { id: "rose", label: "Rose", dot: "bg-rose-500", badge: "bg-rose-500/10 text-rose-400 border-rose-500/25" },
];

// Helper: Format Date to YYYY-MM-DD
const formatDateKey = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper: Human-friendly date display
const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const todayStr = formatDateKey(new Date());

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateKey(yesterday);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatDateKey(tomorrow);

  if (dateStr === todayStr) return "Today";
  if (dateStr === yesterdayStr) return "Yesterday";
  if (dateStr === tomorrowStr) return "Tomorrow";

  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

// Helper: Calculate item total price and unit price (price per quantity)
export const getItemTotal = (item: GroceryItem): number => {
  if (item.totalPrice != null) return item.totalPrice;
  return (item.price || 0) * (item.quantity || 1);
};

export const getItemUnitPrice = (item: GroceryItem): number => {
  const total = getItemTotal(item);
  return item.quantity > 0 ? total / item.quantity : 0;
};

// Helper: Format price per quantity display based on unit and active country
export const formatItemRate = (item: GroceryItem, countryConfig?: CountryConfig): string => {
  const c = countryConfig || getStoredCountry();
  const total = getItemTotal(item);
  const qty = item.quantity || 1;
  const unit = item.unit || "qty";
  return formatItemRateWithCountry(total, qty, unit, c);
};

// Helper: Format price with country currency symbol
export const formatPrice = (amount: number, countryConfig?: CountryConfig): string => {
  const c = countryConfig || getStoredCountry();
  return formatCurrencyAmount(amount, c);
};

// Helper: Calculate purchasing success stats
export interface ListPurchaseStats {
  totalItems: number;
  purchasedItems: number;
  percentage: number;
  totalCost: number;
  purchasedCost: number;
  costPercentage: number;
}

export const getListPurchaseStats = (items: GroceryItem[]): ListPurchaseStats => {
  const totalItems = items.length;
  const purchasedItems = items.filter((i) => i.checked).length;
  const percentage = totalItems > 0 ? Math.round((purchasedItems / totalItems) * 100) : 0;

  const totalCost = items.reduce((sum, item) => sum + getItemTotal(item), 0);
  const purchasedCost = items
    .filter((i) => i.checked)
    .reduce((sum, item) => sum + getItemTotal(item), 0);
  const costPercentage = totalCost > 0 ? Math.round((purchasedCost / totalCost) * 100) : 0;

  return {
    totalItems,
    purchasedItems,
    percentage,
    totalCost,
    purchasedCost,
    costPercentage,
  };
};

export default function GroceryList({
  theme,
  country: propCountry,
  onCountryChange,
}: GroceryListProps) {
  // Country & Localization State
  const [internalCountry, setInternalCountry] = useState<CountryConfig>(() => propCountry || getStoredCountry());
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);

  useEffect(() => {
    if (propCountry) {
      setInternalCountry(propCountry);
    }
  }, [propCountry]);

  const activeCountry = propCountry || internalCountry;

  const handleSelectCountry = (newCountry: CountryConfig) => {
    setInternalCountry(newCountry);
    saveStoredCountry(newCountry.code);
    onCountryChange?.(newCountry);
  };

  // Master lists
  const [lists, setLists] = useState<DayListModel[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateKey(new Date()));
  const [activeListId, setActiveListId] = useState<string | null>(null);

  // Create List Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<ListType>("grocery");
  const [newDate, setNewDate] = useState(selectedDate);
  const [newColorTag, setNewColorTag] = useState("cyan");

  // Active List Add Item inputs (itemPrice represents user-entered Total Price)
  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState("1");
  const [itemUnit, setItemUnit] = useState<ItemUnit>("qty");
  const [itemPrice, setItemPrice] = useState("");
  const [autoDetectedHint, setAutoDetectedHint] = useState<string | null>(null);
  const [userTouchedUnit, setUserTouchedUnit] = useState(false);

  // Inline List Title Editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editableTitle, setEditableTitle] = useState("");

  // Item Editing State
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemName, setEditItemName] = useState("");
  const [editItemQty, setEditItemQty] = useState("1");
  const [editItemUnit, setEditItemUnit] = useState<ItemUnit>("qty");
  const [editItemTotalPrice, setEditItemTotalPrice] = useState("");

  // Search filter states
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [listSearchQuery, setListSearchQuery] = useState("");

  // Bill / Receipt Modal State
  const [billModalList, setBillModalList] = useState<DayListModel | null>(null);
  const [listExportMessage, setListExportMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleExportActiveListCsv = async () => {
    if (isExporting) return;
    try {
      if (!activeList || activeList.items.length === 0) {
        setListExportMessage("No items in this list to export. Add items before downloading.");
        setTimeout(() => setListExportMessage(null), 3000);
        return;
      }
      setIsExporting(true);
      setListExportMessage("Generating list spreadsheet (.csv)...");
      const headers = ["Item Name", "Quantity", "Unit", "Unit Price", "Total Price", "Purchased / Checked", "Notes"];
      const rows = activeList.items.map((it) => [
        it.name,
        it.quantity,
        it.unit && it.unit !== "qty" ? it.unit : "qty",
        getItemUnitPrice(it).toFixed(2),
        getItemTotal(it).toFixed(2),
        it.checked ? "Yes" : "No",
        it.notes || "",
      ]);
      const csvData = buildCsvContent(headers, rows);
      const safeListName = (activeList.name || "grocery_list").replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `${safeListName}_${activeList.date || Date.now()}.csv`;
      const res = await exportCsvFile(filename, csvData, `${activeList.name} CSV Export`);
      setListExportMessage(res.message);
      setTimeout(() => setListExportMessage(null), 3500);
    } catch (err: any) {
      console.error("List CSV export error:", err);
      setListExportMessage(`Failed to export list: ${err?.message || "Error"}`);
      setTimeout(() => setListExportMessage(null), 4000);
    } finally {
      setIsExporting(false);
    }
  };

  // Initialize and load lists from LocalStorage
  useEffect(() => {
    const savedData = localStorage.getItem("grocery_multilists_data");
    if (savedData) {
      try {
        const parsed: DayListModel[] = JSON.parse(savedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLists(parsed);
          return;
        }
      } catch (e) {
        console.error("Error parsing grocery_multilists_data:", e);
      }
    }

    // Check old single-list storage format for migration
    const oldItems = localStorage.getItem("grocery_items");
    const today = formatDateKey(new Date());

    if (oldItems) {
      try {
        const parsedOld = JSON.parse(oldItems);
        if (Array.isArray(parsedOld) && parsedOld.length > 0) {
          const migrated: DayListModel[] = [
            {
              id: "migrated-" + Date.now(),
              title: "My Grocery List",
              type: "grocery",
              date: today,
              createdAt: new Date().toISOString(),
              items: parsedOld,
              colorTag: "cyan",
            },
          ];
          setLists(migrated);
          localStorage.setItem("grocery_multilists_data", JSON.stringify(migrated));
          return;
        }
      } catch (e) {
        console.error("Migration error:", e);
      }
    }

    // Default starter list
    const defaultList: DayListModel = {
      id: "starter-" + Date.now(),
      title: "Daily Grocery List",
      type: "grocery",
      date: today,
      createdAt: new Date().toISOString(),
      colorTag: "cyan",
      items: [
        { id: "1", name: "Fresh Milk", quantity: 2, unit: "qty", price: 3.5, totalPrice: 7.0, checked: false },
        { id: "2", name: "Whole Wheat Bread", quantity: 1, unit: "qty", price: 2.8, totalPrice: 2.8, checked: true },
        { id: "3", name: "Red Apples", quantity: 1.5, unit: "kg", price: 2.5, totalPrice: 3.75, checked: false },
        { id: "4", name: "Cardamom & Spices", quantity: 100, unit: "gm", price: 0.04, totalPrice: 4.0, checked: false },
      ],
    };
    setLists([defaultList]);
    localStorage.setItem("grocery_multilists_data", JSON.stringify([defaultList]));
  }, []);

  // Save changes to localStorage
  const persistLists = (updated: DayListModel[]) => {
    setLists(updated);
    try {
      localStorage.setItem("grocery_multilists_data", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to persist lists:", e);
    }
  };

  // Currently active list
  const activeList = useMemo(
    () => lists.find((l) => l.id === activeListId) || null,
    [lists, activeListId]
  );

  useEffect(() => {
    if (activeList) {
      setEditableTitle(activeList.title);
    }
  }, [activeListId, activeList?.title]);

  // Update active list helper
  const updateActiveList = (updater: (prev: DayListModel) => DayListModel) => {
    if (!activeListId) return;
    const updated = lists.map((l) => (l.id === activeListId ? updater(l) : l));
    persistLists(updated);
  };

  // Create new list
  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim() || (newType === "grocery" ? "Grocery List" : "Checklist");
    const newList: DayListModel = {
      id: "list-" + Date.now(),
      title,
      type: newType,
      date: newDate || selectedDate,
      createdAt: new Date().toISOString(),
      items: [],
      colorTag: newColorTag,
    };

    persistLists([newList, ...lists]);
    setSelectedDate(newList.date);
    setActiveListId(newList.id);
    setIsCreateModalOpen(false);
    setNewTitle("");
    setItemName("");
    setItemQty("1");
    setItemPrice("");
  };

  // Delete list
  const handleDeleteList = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Are you sure you want to delete this list?")) return;
    persistLists(lists.filter((l) => l.id !== id));
    if (activeListId === id) {
      setActiveListId(null);
    }
  };

  // Rename list title
  const handleSaveTitle = () => {
    if (editableTitle.trim()) {
      updateActiveList((list) => ({ ...list, title: editableTitle.trim() }));
    }
    setIsEditingTitle(false);
  };

  // Select unit in Add Item form
  const handleSelectUnit = (unit: ItemUnit) => {
    setItemUnit(unit);
    setUserTouchedUnit(true);
    if (unit === "gm" && (itemQty === "1" || parseFloat(itemQty) < 10)) {
      setItemQty("250");
    } else if (unit === "kg" && (itemQty === "250" || parseFloat(itemQty) >= 50)) {
      setItemQty("1");
    } else if (unit === "qty" && (itemQty === "250" || itemQty === "500" || parseFloat(itemQty) >= 10)) {
      setItemQty("1");
    }
  };

  // Auto-detect unit and quantity as user types item name
  const handleItemNameChange = (val: string) => {
    setItemName(val);
    if (!val.trim()) {
      setAutoDetectedHint(null);
      return;
    }

    const detected = detectGroceryUnit(val);
    if (detected) {
      if (detected.matchedFromText) {
        setItemUnit(detected.detectedUnit);
        setItemQty(detected.detectedQty.toString());
        setAutoDetectedHint(detected.reason || `Auto-detected: ${detected.detectedQty} ${detected.detectedUnit}`);
      } else if (!userTouchedUnit) {
        setItemUnit(detected.detectedUnit);
        if (detected.detectedUnit === "gm" && (itemQty === "1" || parseFloat(itemQty) < 10)) {
          setItemQty(detected.detectedQty.toString());
        }
        setAutoDetectedHint(detected.reason || `Auto-detected: ${detected.detectedUnit}`);
      }
    } else {
      setAutoDetectedHint(null);
    }
  };

  // Add Item to active list (User inputs total price, system computes unit price)
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !activeList) return;

    let finalName = itemName.trim();
    let finalQty = parseFloat(itemQty) || 1;
    let finalUnit: ItemUnit = itemUnit;

    const detected = detectGroceryUnit(finalName);
    if (detected && detected.matchedFromText && detected.cleanedName) {
      finalName = detected.cleanedName;
      if (!userTouchedUnit) {
        finalQty = detected.detectedQty;
        finalUnit = detected.detectedUnit;
      }
    }

    const totalEntered = activeList.type === "grocery" ? (parseFloat(itemPrice) || 0) : 0;
    const unitPrice = finalQty > 0 ? totalEntered / finalQty : 0;

    const newItem: GroceryItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      name: finalName,
      quantity: finalQty,
      unit: finalUnit,
      totalPrice: totalEntered,
      price: unitPrice,
      checked: false,
    };

    updateActiveList((list) => ({
      ...list,
      items: [newItem, ...list.items],
    }));

    setItemName("");
    setItemQty(itemUnit === "gm" ? "250" : "1");
    setItemPrice("");
    setAutoDetectedHint(null);
    setUserTouchedUnit(false);
  };

  // Toggle item check
  const toggleItem = (itemId: string) => {
    updateActiveList((list) => ({
      ...list,
      items: list.items.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      ),
    }));
  };

  // Update item quantity (preserves price per quantity, recalculates total price)
  const updateItemQty = (itemId: string, direction: "inc" | "dec") => {
    updateActiveList((list) => ({
      ...list,
      items: list.items.map((item) => {
        if (item.id !== itemId) return item;
        const unit = item.unit || "qty";
        let step = 1;
        let minQty = 1;
        if (unit === "kg") {
          step = 0.5;
          minQty = 0.5;
        } else if (unit === "gm") {
          step = 100;
          minQty = 50;
        }

        const currentQty = item.quantity || (unit === "gm" ? 100 : 1);
        const newQty =
          direction === "inc"
            ? Number((currentQty + step).toFixed(2))
            : Number(Math.max(minQty, currentQty - step).toFixed(2));

        if (newQty === currentQty) return item;

        const currentTotal = getItemTotal(item);
        const unitRate = currentQty > 0 ? currentTotal / currentQty : 0;
        const newTotal = Number((unitRate * newQty).toFixed(2));

        return {
          ...item,
          quantity: newQty,
          price: unitRate,
          totalPrice: newTotal,
        };
      }),
    }));
  };

  // Start inline item editing
  const startEditItem = (item: GroceryItem) => {
    setEditingItemId(item.id);
    setEditItemName(item.name);
    setEditItemQty(item.quantity.toString());
    setEditItemUnit(item.unit || "qty");
    const total = getItemTotal(item);
    setEditItemTotalPrice(total > 0 ? total.toFixed(2) : "");
  };

  // Cancel item editing
  const cancelEditItem = () => {
    setEditingItemId(null);
    setEditItemName("");
    setEditItemQty("1");
    setEditItemUnit("qty");
    setEditItemTotalPrice("");
  };

  // Save edited item
  const saveEditItem = (itemId: string) => {
    if (!editItemName.trim()) return;
    const validQty = parseFloat(editItemQty) || 1;
    const newTotal = parseFloat(editItemTotalPrice) || 0;
    const unitPrice = validQty > 0 ? newTotal / validQty : 0;

    updateActiveList((list) => ({
      ...list,
      items: list.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              name: editItemName.trim(),
              quantity: validQty,
              unit: editItemUnit,
              totalPrice: newTotal,
              price: unitPrice,
            }
          : item
      ),
    }));
    setEditingItemId(null);
  };

  // Delete item
  const deleteItem = (itemId: string) => {
    updateActiveList((list) => ({
      ...list,
      items: list.items.filter((item) => item.id !== itemId),
    }));
  };

  // Clear checked items
  const clearCheckedItems = () => {
    updateActiveList((list) => ({
      ...list,
      items: list.items.filter((item) => !item.checked),
    }));
  };

  // Clear all items in active list
  const clearAllItems = () => {
    if (!confirm("Clear all items from this list?")) return;
    updateActiveList((list) => ({
      ...list,
      items: [],
    }));
  };

  // Date strip navigation (last 3 days to next 4 days)
  const dateStrip = useMemo(() => {
    const dates: string[] = [];
    const base = new Date();
    for (let i = -2; i <= 4; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      dates.push(formatDateKey(d));
    }
    if (!dates.includes(selectedDate)) {
      dates.push(selectedDate);
      dates.sort();
    }
    return dates;
  }, [selectedDate]);

  // Lists count on current dates
  const listsCountPerDate = useMemo(() => {
    const counts: Record<string, number> = {};
    lists.forEach((l) => {
      counts[l.date] = (counts[l.date] || 0) + 1;
    });
    return counts;
  }, [lists]);

  // Filtered lists for the selected date (or all lists if searching across lists)
  const dayLists = useMemo(() => {
    if (listSearchQuery.trim()) {
      const q = listSearchQuery.toLowerCase().trim();
      return lists.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.items.some((i) => i.name.toLowerCase().includes(q))
      );
    }
    return lists.filter((l) => l.date === selectedDate);
  }, [lists, selectedDate, listSearchQuery]);

  // Overall stats for the selected date
  const dayStats = useMemo(() => {
    let totalItems = 0;
    let completedItems = 0;
    let totalEst = 0;
    let totalPurchased = 0;

    dayLists.forEach((l) => {
      totalItems += l.items.length;
      completedItems += l.items.filter((i) => i.checked).length;
      totalEst += l.items.reduce((s, i) => s + getItemTotal(i), 0);
      totalPurchased += l.items
        .filter((i) => i.checked)
        .reduce((s, i) => s + getItemTotal(i), 0);
    });

    const percent =
      totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return {
      totalItems,
      completedItems,
      totalEst,
      totalPurchased,
      percent,
    };
  }, [dayLists]);

  // Active list calculations
  const activeItems = activeList?.items || [];
  const displayedItems = useMemo(() => {
    if (!itemSearchQuery.trim()) return activeItems;
    const q = itemSearchQuery.toLowerCase().trim();
    return activeItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.unit?.toLowerCase().includes(q)
    );
  }, [activeItems, itemSearchQuery]);
  const completedCount = activeItems.filter((i) => i.checked).length;
  const totalCost = activeItems.reduce(
    (sum, item) => sum + getItemTotal(item),
    0
  );
  const purchasedCost = activeItems
    .filter((i) => i.checked)
    .reduce((sum, item) => sum + getItemTotal(item), 0);
  const purchasePercentage =
    activeItems.length > 0
      ? Math.round((completedCount / activeItems.length) * 100)
      : 0;
  const costPercentage =
    totalCost > 0 ? Math.round((purchasedCost / totalCost) * 100) : 0;
  // Preview rates for Add Form and Edit Form
  const calculatePreviewRate = () => {
    const total = parseFloat(itemPrice);
    const qty = parseFloat(itemQty);
    if (!total || total <= 0 || !qty || qty <= 0) return null;
    const sym = activeCountry.currencySymbol;
    const spacing = sym.length > 2 ? " " : "";

    if (itemUnit === "kg") {
      return `≈ ${sym}${spacing}${(total / qty).toFixed(2)} / kg`;
    }
    if (itemUnit === "gm") {
      const perKg = (total / qty) * 1000;
      return `≈ ${sym}${spacing}${perKg.toFixed(2)} / kg (${sym}${spacing}${((total / qty) * 100).toFixed(2)} / 100g)`;
    }
    if (itemUnit === "lb") {
      return `≈ ${sym}${spacing}${(total / qty).toFixed(2)} / lb`;
    }
    if (itemUnit === "oz") {
      const perLb = (total / qty) * 16;
      return `≈ ${sym}${spacing}${perLb.toFixed(2)} / lb (${sym}${spacing}${(total / qty).toFixed(2)} / oz)`;
    }
    return `≈ ${sym}${spacing}${(total / qty).toFixed(2)} / ea`;
  };

  const calculateEditPreviewRate = () => {
    const total = parseFloat(editItemTotalPrice);
    const qty = parseFloat(editItemQty);
    if (!total || total <= 0 || !qty || qty <= 0) return null;
    const sym = activeCountry.currencySymbol;
    const spacing = sym.length > 2 ? " " : "";

    if (editItemUnit === "kg") {
      return `≈ ${sym}${spacing}${(total / qty).toFixed(2)} / kg`;
    }
    if (editItemUnit === "gm") {
      return `≈ ${sym}${spacing}${((total / qty) * 1000).toFixed(2)} / kg`;
    }
    if (editItemUnit === "lb") {
      return `≈ ${sym}${spacing}${(total / qty).toFixed(2)} / lb`;
    }
    if (editItemUnit === "oz") {
      return `≈ ${sym}${spacing}${((total / qty) * 16).toFixed(2)} / lb`;
    }
    return `≈ ${sym}${spacing}${(total / qty).toFixed(2)} / ea`;
  };

  // Theme styling
  const getThemeStyles = () => {
    switch (theme) {
      case "cosmic":
        return {
          wrapper: "text-white font-sans space-y-6",
          glassCard: "backdrop-blur-xl bg-slate-950/70 border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.6)] rounded-3xl p-4 sm:p-5 md:p-6 transition-all",
          titleSec: "text-cyan-400 font-black text-xl tracking-tight flex items-center gap-2",
          inputField: "w-full bg-slate-900/90 border border-white/10 text-white placeholder-slate-500 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 transition-all",
          itemRow: (checked: boolean) => `p-3 sm:p-3.5 rounded-2xl border transition-all ${
            checked
              ? "bg-slate-900/40 border-white/5 opacity-60"
              : "bg-slate-900/70 border-white/10 hover:border-cyan-400/30"
          }`,
          listCard: "group relative backdrop-blur-xl bg-slate-900/60 border border-white/10 hover:border-cyan-400/50 shadow-lg hover:shadow-cyan-500/10 rounded-2xl p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-0.5",
          submitBtn: "bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95",
          secondaryBtn: "bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
          qtyStepper: "flex items-center bg-slate-950 border border-white/10 rounded-xl px-1.5 py-0.5 text-xs",
          accentText: "text-cyan-400",
          progressBar: "bg-gradient-to-r from-cyan-500 to-blue-500",
        };
      case "neumorphic":
        return {
          wrapper: "text-zinc-200 font-sans space-y-6",
          glassCard: "bg-[#181818] border border-zinc-800 shadow-[0_12px_30px_rgba(0,0,0,0.7)] rounded-3xl p-4 sm:p-5 md:p-6",
          titleSec: "text-[#00E676] font-black text-xl tracking-tight flex items-center gap-2",
          inputField: "w-full bg-zinc-950 border border-zinc-800 text-zinc-200 placeholder-zinc-700 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#00E676] focus:border-[#00E676] transition-all",
          itemRow: (checked: boolean) => `p-3 sm:p-3.5 rounded-2xl border transition-all ${
            checked
              ? "bg-zinc-950/40 border-zinc-900 opacity-60"
              : "bg-zinc-900/70 border-zinc-800 hover:border-[#00E676]/30"
          }`,
          listCard: "group relative bg-[#1c1c1c] border border-zinc-800 hover:border-[#00E676]/40 shadow-lg rounded-2xl p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-0.5",
          submitBtn: "bg-[#00E676] hover:bg-[#12cf6c] text-black font-black px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95",
          secondaryBtn: "bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
          qtyStepper: "flex items-center bg-zinc-950 border border-zinc-850 rounded-xl px-1.5 py-0.5 text-xs",
          accentText: "text-[#00E676]",
          progressBar: "bg-[#00E676]",
        };
      case "financial":
        return {
          wrapper: "text-[#3C3C30] font-sans space-y-6",
          glassCard: "bg-[#F4F4E2] border border-[#BCBCA6] shadow-md rounded-3xl p-4 sm:p-5 md:p-6",
          titleSec: "text-[#556B2F] font-black text-xl tracking-tight flex items-center gap-2",
          inputField: "w-full bg-[#FCFDF6] border border-[#BCBCA6] text-[#3C3C30] placeholder-[#BCBCA6] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#556B2F] transition-all",
          itemRow: (checked: boolean) => `p-3 sm:p-3.5 rounded-2xl border transition-all ${
            checked
              ? "bg-[#DFDFCB]/40 border-[#BCBCA6]/40 opacity-60"
              : "bg-[#DFDFCB]/80 border-[#BCBCA6] hover:border-[#556B2F]"
          }`,
          listCard: "group relative bg-[#FCFDF6] border border-[#BCBCA6] hover:border-[#556B2F] shadow-sm rounded-2xl p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-0.5",
          submitBtn: "bg-[#556B2F] hover:bg-[#475b24] text-white font-black px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95",
          secondaryBtn: "bg-[#ECECD8] hover:bg-[#E3E3CA] border border-[#BCBCA6] text-[#3C3C30] px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
          qtyStepper: "flex items-center bg-[#F4F4E2] border border-[#BCBCA6] rounded-xl px-1.5 py-0.5 text-xs",
          accentText: "text-[#556B2F]",
          progressBar: "bg-[#556B2F]",
        };
      case "minimalist":
      default:
        return {
          wrapper: "text-gray-900 font-sans space-y-6",
          glassCard: "bg-white border-2 border-gray-900 shadow-sm rounded-3xl p-4 sm:p-5 md:p-6",
          titleSec: "text-gray-900 font-black text-xl tracking-tight flex items-center gap-2",
          inputField: "w-full bg-gray-50 border-2 border-gray-900 text-gray-800 placeholder-gray-400 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:bg-white transition-all",
          itemRow: (checked: boolean) => `p-3 sm:p-3.5 rounded-2xl border-2 transition-all ${
            checked
              ? "bg-gray-50 border-gray-300 opacity-60"
              : "bg-white border-gray-900 hover:border-black"
          }`,
          listCard: "group relative bg-white border-2 border-gray-900 hover:shadow-md rounded-2xl p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-0.5",
          submitBtn: "bg-gray-900 hover:bg-gray-800 text-white font-black px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95",
          secondaryBtn: "bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
          qtyStepper: "flex items-center bg-gray-50 border border-gray-300 rounded-xl px-1.5 py-0.5 text-xs",
          accentText: "text-gray-900",
          progressBar: "bg-gray-900",
        };
    }
  };

  const s = getThemeStyles();

  const getAccentBadge = (tagId?: string) => {
    const found = COLOR_ACCENTS.find((c) => c.id === tagId);
    return found ? found.badge : COLOR_ACCENTS[0].badge;
  };

  // -------------------------------------------------------------
  // VIEW: LIST DETAIL (Inside the selected list)
  // -------------------------------------------------------------
  if (activeList) {
    return (
      <div className={s.wrapper} id="active-list-detail-view">
        {/* Header Strip with Back Button & Rename */}
        <div className={s.glassCard}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <button
                onClick={() => setActiveListId(null)}
                className="p-2 rounded-xl bg-black/10 dark:bg-white/5 hover:bg-black/20 dark:hover:bg-white/10 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase shrink-0"
                id="btn-back-to-all-lists"
              >
                <ArrowLeft className="w-4 h-4 text-cyan-400" />
                <span>All Lists</span>
              </button>

              <div className="min-w-0 flex-1">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      autoFocus
                      value={editableTitle}
                      onChange={(e) => setEditableTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveTitle();
                        if (e.key === "Escape") setIsEditingTitle(false);
                      }}
                      className="text-base sm:text-lg font-black bg-black/20 dark:bg-white/10 px-3 py-1 rounded-xl outline-none border border-cyan-400/50 w-full"
                    />
                    <button
                      onClick={handleSaveTitle}
                      className="p-1.5 rounded-lg bg-emerald-500 text-black font-bold cursor-pointer hover:bg-emerald-400 shrink-0"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 min-w-0">
                    <h2
                      onClick={() => setIsEditingTitle(true)}
                      className="text-lg sm:text-xl font-black tracking-tight break-words cursor-pointer hover:underline decoration-dashed decoration-cyan-400 flex items-center gap-2"
                      title="Click to rename"
                    >
                      <span>{activeList.title}</span>
                      <Edit3 className="w-3.5 h-3.5 opacity-40 hover:opacity-100 transition-opacity shrink-0 inline-block" />
                    </h2>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-1 text-[11px] font-bold flex-wrap">
                  <span className={`px-2 py-0.5 rounded-md border text-[10px] uppercase font-black tracking-wider ${getAccentBadge(activeList.colorTag)}`}>
                    {activeList.type === "grocery" ? "🛒 Grocery List" : "✅ Checklist"}
                  </span>
                  <span className="opacity-60 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-cyan-400" />
                    {formatDisplayDate(activeList.date)}
                  </span>
                  <span className="opacity-40">·</span>
                  <span className="opacity-60">
                    {completedCount} / {activeItems.length} purchased
                  </span>
                  <span className="opacity-40">·</span>
                  <span className={`font-mono font-black ${s.accentText}`}>
                    {purchasePercentage}% Success
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setBillModalList(activeList)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 text-cyan-300 hover:text-white border border-cyan-500/35 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                title="Download or Print itemized Bill / Receipt (Zero Quality Drop)"
                id="btn-download-bill-active"
              >
                <Receipt className="w-3.5 h-3.5 text-cyan-400" />
                <span>Download Bill</span>
              </button>

              <button
                type="button"
                onClick={handleExportActiveListCsv}
                disabled={isExporting}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 hover:text-white border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                title="Quick export grocery items to CSV spreadsheet"
                id="btn-export-list-csv"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCountryModalOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/15 dark:hover:bg-white/15 border border-black/10 dark:border-white/10 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Change Country & Currency (₹, $, £, etc.)"
                id="btn-country-picker-active"
              >
                <span className="text-base">{activeCountry.flag}</span>
                <span className="font-bold text-[11px] hidden sm:inline">{activeCountry.name}</span>
                <span className="font-mono text-[11px] font-black px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
                  {activeCountry.currencySymbol}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                onClick={(e) => handleDeleteList(activeList.id, e)}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-rose-500/20"
                title="Delete this list"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete List</span>
              </button>
            </div>
          </div>

          {listExportMessage && (
            <div className="mt-3 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium flex items-center justify-between animate-in fade-in">
              <span>{listExportMessage}</span>
              <button
                onClick={() => setListExportMessage(null)}
                className="text-xs opacity-60 hover:opacity-100 font-bold ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Purchasing Success Rate Meter Card */}
        <div className={s.glassCard} id="purchase-success-meter-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider opacity-75 flex items-center gap-1.5">
                  <CheckCircle2 className={`w-4 h-4 ${purchasePercentage === 100 ? "text-emerald-500" : s.accentText}`} />
                  <span>Purchasing Success Rate</span>
                </span>
                {purchasePercentage === 100 && activeItems.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                    🎉 100% Completed
                  </span>
                )}
              </div>
              <p className="text-xs opacity-65 mt-1 font-medium">
                {activeItems.length === 0 ? (
                  "Add items below to start tracking your purchase progress."
                ) : (
                  <>
                    <span>{completedCount} of {activeItems.length} {activeItems.length === 1 ? "item" : "items"} purchased</span>
                    {activeList.type === "grocery" && totalCost > 0 && (
                      <span> · {formatCurrencyAmount(purchasedCost, activeCountry)} of {formatCurrencyAmount(totalCost, activeCountry)} spent ({costPercentage}%)</span>
                    )}
                  </>
                )}
              </p>
            </div>

            <div className="flex items-baseline sm:items-center gap-1.5 shrink-0">
              <span className={`text-3xl font-black font-mono tracking-tight ${s.accentText}`}>
                {purchasePercentage}%
              </span>
              <span className="text-[10px] font-extrabold uppercase opacity-60">Success</span>
            </div>
          </div>

          {/* Visual Progress Bar Track */}
          <div className="w-full h-2.5 rounded-full bg-black/10 dark:bg-white/10 mt-3.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                purchasePercentage === 100
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                  : s.progressBar
              }`}
              style={{ width: `${purchasePercentage}%` }}
            />
          </div>
        </div>

        {/* Clean Add Item Card */}
        <div className={s.glassCard}>
          <form onSubmit={handleAddItem} className="flex flex-col md:flex-row items-center gap-3" id="form-add-item">
            {/* Item Name */}
            <div className="flex-1 w-full">
              <input
                type="text"
                required
                placeholder={activeList.type === "grocery" ? "Add item (e.g., 2kg Apples, 500gm Sugar, Milk)..." : "Add task or checklist item..."}
                value={itemName}
                onChange={(e) => handleItemNameChange(e.target.value)}
                className={s.inputField}
                id="input-item-name"
              />
              {autoDetectedHint && (
                <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-cyan-400">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{autoDetectedHint}</span>
                </div>
              )}
            </div>

            {/* Quantity and Unit Selector */}
            <div className="w-full md:w-auto flex flex-col justify-center">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase opacity-60 shrink-0">Qty:</span>
                <input
                  type="number"
                  step={itemUnit === "kg" || itemUnit === "lb" ? "0.1" : itemUnit === "gm" ? "10" : itemUnit === "oz" ? "0.5" : "1"}
                  min={itemUnit === "kg" || itemUnit === "lb" ? "0.1" : itemUnit === "gm" ? "10" : itemUnit === "oz" ? "0.5" : "1"}
                  required
                  value={itemQty}
                  onChange={(e) => setItemQty(e.target.value)}
                  className={`${s.inputField} w-20 text-center font-mono`}
                  id="input-item-qty"
                />

                {/* Unit Switcher: Dynamic per country (e.g. Qty, gm, kg for India) */}
                <div className="flex items-center p-0.5 rounded-xl bg-black/10 dark:bg-white/10 border border-black/5 dark:border-white/10 shrink-0">
                  {activeCountry.weightUnits.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSelectUnit(u.id)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                        itemUnit === u.id
                          ? "bg-cyan-500 text-black shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                      title={u.desc}
                    >
                      {u.shortLabel}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Total Price (Grocery Only) */}
            {activeList.type === "grocery" && (
              <div className="w-full md:w-52 flex flex-col justify-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase opacity-60 shrink-0">
                    Price ({activeCountry.currencySymbol}):
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={`${activeCountry.currencySymbol}0.00 total`}
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    className={`${s.inputField} text-center font-mono`}
                    id="input-item-price"
                  />
                </div>
                {calculatePreviewRate() && (
                  <div className="text-[10px] text-right font-mono text-cyan-400 mt-1 pr-1 font-bold">
                    {calculatePreviewRate()}
                  </div>
                )}
              </div>
            )}

            {/* Add Button */}
            <button
              type="submit"
              className={`${s.submitBtn} w-full md:w-auto shrink-0`}
              id="btn-add-item"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </form>
        </div>

        {/* Items List */}
        <div className={s.glassCard}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-black/5 dark:border-white/5 gap-2.5">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider opacity-70">
                Items ({activeItems.length})
              </h3>
            </div>

            {activeItems.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {/* Search Bar for items with high-contrast text */}
                <div className="relative flex-1 sm:w-52">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 opacity-75 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search items in list..."
                    value={itemSearchQuery}
                    onChange={(e) => setItemSearchQuery(e.target.value)}
                    className={`${s.inputField} pl-8.5 pr-8 py-1.5 text-xs text-white placeholder-slate-400 font-semibold`}
                    id="search-items-in-list"
                  />
                  {itemSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setItemSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Clear item search"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {completedCount > 0 && (
                  <button
                    onClick={clearCheckedItems}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer shrink-0"
                  >
                    Clear Checked
                  </button>
                )}
                <button
                  onClick={clearAllItems}
                  className="text-[11px] font-bold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer ml-2 shrink-0"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {activeItems.length === 0 ? (
            <div className="text-center py-12 bg-black/5 dark:bg-white/5 rounded-2xl border border-dashed border-black/10 dark:border-white/10">
              <ShoppingCart className="w-8 h-8 mx-auto opacity-30 mb-2 text-cyan-400" />
              <p className="font-extrabold text-sm opacity-60">No items in this list yet</p>
              <p className="text-xs text-slate-400 mt-1">Type an item name above and press Add</p>
            </div>
          ) : displayedItems.length === 0 && itemSearchQuery ? (
            <div className="text-center py-8 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10">
              <Search className="w-6 h-6 mx-auto opacity-40 mb-2 text-cyan-400" />
              <p className="font-bold text-xs opacity-80">No items match &ldquo;{itemSearchQuery}&rdquo;</p>
              <button
                type="button"
                onClick={() => setItemSearchQuery("")}
                className="mt-2 text-xs font-bold text-cyan-400 hover:underline cursor-pointer"
              >
                Clear item search
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {displayedItems.map((item) => (
                <div key={item.id}>
                  {editingItemId === item.id ? (
                    <div className="p-3 rounded-2xl bg-black/20 dark:bg-black/40 border border-cyan-500/30 space-y-2.5">
                      <div className="w-full">
                        <input
                          type="text"
                          value={editItemName}
                          onChange={(e) => setEditItemName(e.target.value)}
                          className={`${s.inputField} text-xs w-full`}
                          placeholder="Item name"
                          autoFocus
                        />
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold opacity-60">Qty:</span>
                          <input
                            type="number"
                            step={editItemUnit === "kg" || editItemUnit === "lb" ? "0.1" : editItemUnit === "gm" ? "10" : editItemUnit === "oz" ? "0.5" : "1"}
                            min={editItemUnit === "kg" || editItemUnit === "lb" ? "0.1" : editItemUnit === "gm" ? "10" : editItemUnit === "oz" ? "0.5" : "1"}
                            value={editItemQty}
                            onChange={(e) => setEditItemQty(e.target.value)}
                            className={`${s.inputField} w-16 text-center text-xs font-mono`}
                          />
                        </div>

                        {/* Unit Switcher in Edit mode */}
                        <div className="flex items-center p-0.5 rounded-lg bg-black/20 dark:bg-white/10 border border-white/10">
                          {activeCountry.weightUnits.map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => setEditItemUnit(u.id)}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-colors ${
                                editItemUnit === u.id
                                  ? "bg-cyan-500 text-black font-black"
                                  : "text-slate-400 hover:text-white"
                              }`}
                              title={u.desc}
                            >
                              {u.shortLabel}
                            </button>
                          ))}
                        </div>

                        {activeList.type === "grocery" && (
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-bold opacity-60">
                                Total ({activeCountry.currencySymbol}):
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editItemTotalPrice}
                                onChange={(e) => setEditItemTotalPrice(e.target.value)}
                                className={`${s.inputField} w-20 text-center text-xs font-mono`}
                                placeholder={`${activeCountry.currencySymbol}0.00`}
                              />
                            </div>
                            {calculateEditPreviewRate() && (
                              <span className="text-[9px] text-cyan-400 font-mono text-right mt-0.5 font-bold">
                                {calculateEditPreviewRate()}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => saveEditItem(item.id)}
                            className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                            title="Save changes"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEditItem}
                            className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 transition-colors cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={s.itemRow(item.checked)}>
                      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
                        {/* Top Line (Mobile) / Left Side (Desktop): Checkbox, Item Name & Mobile Actions */}
                        <div className="flex items-center justify-between sm:justify-start gap-2.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <button
                              onClick={() => toggleItem(item.id)}
                              className="cursor-pointer text-slate-400 hover:text-cyan-400 transition-colors shrink-0"
                            >
                              {item.checked ? (
                                <CheckSquare className="w-5 h-5 text-cyan-400" />
                              ) : (
                                <Square className="w-5 h-5" />
                              )}
                            </button>
                            <span
                              className={`text-sm sm:text-base font-bold break-words leading-tight flex-1 min-w-0 ${
                                item.checked ? "line-through opacity-50" : ""
                              }`}
                              title={item.name}
                            >
                              {item.name}
                            </span>
                          </div>

                          {/* Quick Mobile Edit & Delete Buttons */}
                          <div className="flex sm:hidden items-center gap-1 shrink-0 ml-1">
                            <button
                              onClick={() => startEditItem(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors cursor-pointer"
                              title="Edit item"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Bottom Line (Mobile) / Right Side (Desktop): Stepper, Price & Desktop Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-7 sm:pl-0 pt-1.5 sm:pt-0 border-t border-black/5 dark:border-white/5 sm:border-0">
                          {/* Stepper */}
                          <div className={s.qtyStepper}>
                            <button
                              onClick={() => updateItemQty(item.id, "dec")}
                              className="w-5 h-5 flex items-center justify-center font-bold text-slate-400 hover:text-cyan-400 cursor-pointer"
                              title="Decrease quantity"
                            >
                              -
                            </button>
                            <span className="font-mono text-xs font-black px-1.5 whitespace-nowrap">
                              {item.quantity} {item.unit && item.unit !== "qty" ? item.unit : ""}
                            </span>
                            <button
                              onClick={() => updateItemQty(item.id, "inc")}
                              className="w-5 h-5 flex items-center justify-center font-bold text-slate-400 hover:text-cyan-400 cursor-pointer"
                              title="Increase quantity"
                            >
                              +
                            </button>
                          </div>

                          {/* Price calculation (Grocery only): Total Price & Price Per Quantity Rate */}
                          {activeList.type === "grocery" && (
                            <div className="text-right min-w-[70px]">
                              {getItemTotal(item) > 0 ? (
                                <>
                                  <span className="font-mono text-xs font-black text-cyan-400 block" title="Total price for this item">
                                    {formatCurrencyAmount(getItemTotal(item), activeCountry)}
                                  </span>
                                  <span className="font-mono text-[10px] opacity-60 block" title="Price per quantity rate">
                                    {formatItemRate(item, activeCountry)}
                                  </span>
                                </>
                              ) : (
                                <span className="font-mono text-[11px] opacity-30 block">
                                  {activeCountry.currencySymbol}0.00
                                </span>
                              )}
                            </div>
                          )}

                          {/* Desktop Edit & Delete Buttons */}
                          <div className="hidden sm:flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => startEditItem(item)}
                              className="p-1 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors cursor-pointer"
                              title="Edit item & price"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Bottom Summary Bar */}
          {activeItems.length > 0 && (
            <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-medium">
                <span className="opacity-60">
                  {completedCount} of {activeItems.length} items purchased
                </span>
                <span className={`font-mono font-black px-2 py-0.5 rounded text-[11px] ${
                  purchasePercentage === 100
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : `${s.accentText} bg-black/10 dark:bg-white/10`
                }`}>
                  {purchasePercentage}% Success
                </span>
              </div>

              {activeList.type === "grocery" && totalCost > 0 && (
                <div className="flex items-center gap-3 font-mono text-xs">
                  <div className="text-right">
                    <span className="opacity-60 block text-[10px] uppercase font-bold">Purchased / Estimated:</span>
                    <span className="font-bold text-emerald-400">{formatCurrencyAmount(purchasedCost, activeCountry)}</span>
                    <span className="opacity-40 mx-1">/</span>
                    <span className={`font-black ${s.accentText}`}>{formatCurrencyAmount(totalCost, activeCountry)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBillModalList(activeList)}
                    className="px-2.5 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                    title="Download Bill / Receipt"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Bill</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Country & Regional Settings Modal */}
        <CountryPickerModal
          isOpen={isCountryModalOpen}
          onClose={() => setIsCountryModalOpen(false)}
          selectedCountry={activeCountry}
          onSelectCountry={handleSelectCountry}
          theme={theme}
        />

        {/* Bill & Receipt Generator Modal */}
        {billModalList && (
          <BillReceiptModal
            isOpen={!!billModalList}
            onClose={() => setBillModalList(null)}
            list={billModalList}
            country={activeCountry}
            theme={theme}
          />
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: ALL LISTS HUB (Grouped by Date)
  // -------------------------------------------------------------
  return (
    <div className={s.wrapper} id="multiday-grocery-checklist-hub">
      {/* Top Banner & Date Bar */}
      <div className={s.glassCard}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/5">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-cyan-400" />
              Grocery & Checklist
            </h1>
            <p className="text-xs opacity-60 mt-1">
              Create and manage multiple lists for each day.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Country & Currency Switcher Button */}
            <button
              type="button"
              onClick={() => setIsCountryModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/15 dark:hover:bg-white/15 border border-black/10 dark:border-white/10 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              title="Change Country & Currency (₹ Rupees, $ Dollars, etc.)"
              id="btn-country-picker-hub"
            >
              <span className="text-xl">{activeCountry.flag}</span>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold">{activeCountry.name}</span>
                  <span className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                    {activeCountry.currencySymbol} {activeCountry.currencyCode}
                  </span>
                </div>
                <span className="text-[10px] opacity-60 block">Weights: {activeCountry.weightUnits.map((u) => u.shortLabel).join(", ")}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-0.5" />
            </button>

            {/* '+' Button to Create New List */}
            <button
              onClick={() => {
                setNewDate(selectedDate);
                setIsCreateModalOpen(true);
              }}
              className={`${s.submitBtn} text-sm px-4.5 py-2.5`}
              id="btn-create-new-list"
            >
              <Plus className="w-5 h-5" />
              <span>New List</span>
            </button>
          </div>
        </div>

        {/* Date Selector Strip */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {dateStrip.map((dateStr) => {
              const isSelected = dateStr === selectedDate;
              const count = listsCountPerDate[dateStr] || 0;
              const displayLabel = formatDisplayDate(dateStr);
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-cyan-500 text-slate-950 font-black shadow-md scale-105"
                      : "bg-black/10 dark:bg-white/5 hover:bg-black/20 dark:hover:bg-white/10 text-slate-300"
                  }`}
                  id={`btn-date-${dateStr}`}
                >
                  <span>{displayLabel}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        isSelected ? "bg-slate-950 text-cyan-400" : "bg-cyan-400/20 text-cyan-300"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Jump to specific date */}
          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-[10px] font-bold opacity-50 uppercase">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) setSelectedDate(e.target.value);
              }}
              className="bg-black/10 dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-1 text-xs text-slate-300 focus:outline-none cursor-pointer"
              style={{ colorScheme: "dark" }}
            />
          </div>
        </div>
      </div>

      {/* Lists Grid for Selected Date */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 px-1 gap-2.5">
          <h2 className="text-xs font-black uppercase tracking-wider opacity-70">
            {listSearchQuery ? `Search Results (${dayLists.length})` : `Lists for ${formatDisplayDate(selectedDate)} (${dayLists.length})`}
          </h2>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Search Lists Bar with high-contrast text */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 opacity-75 pointer-events-none" />
              <input
                type="text"
                placeholder="Search lists or items..."
                value={listSearchQuery}
                onChange={(e) => setListSearchQuery(e.target.value)}
                className={`${s.inputField} pl-8.5 pr-8 py-1.5 text-xs text-white placeholder-slate-400 font-semibold`}
                id="search-all-lists-input"
              />
              {listSearchQuery && (
                <button
                  type="button"
                  onClick={() => setListSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Clear list search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {dayStats.totalItems > 0 && !listSearchQuery && (
              <div className="flex items-center gap-1.5 text-xs font-bold shrink-0">
                <span className="opacity-60 text-[11px]">Daily Success:</span>
                <span className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-black ${
                  dayStats.percent === 100
                    ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
                    : dayStats.percent > 0
                    ? `${s.accentText} bg-black/10 dark:bg-white/10`
                    : "bg-black/10 dark:bg-white/10 opacity-70"
                }`}>
                  {dayStats.percent}% ({dayStats.completedItems}/{dayStats.totalItems})
                </span>
              </div>
            )}
          </div>
        </div>

        {dayLists.length === 0 ? (
          <div className={`${s.glassCard} text-center py-12`}>
            <ShoppingCart className="w-10 h-10 mx-auto opacity-30 mb-3 text-cyan-400" />
            <h3 className="text-base font-bold">No lists for this day</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Tap the button below to start a new grocery run or task checklist for this date.
            </p>
            <button
              onClick={() => {
                setNewDate(selectedDate);
                setIsCreateModalOpen(true);
              }}
              className={`${s.submitBtn} mx-auto mt-4 text-xs`}
            >
              <Plus className="w-4 h-4" />
              <span>Create First List</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dayLists.map((list) => {
              const stats = getListPurchaseStats(list.items);
              return (
                <div
                  key={list.id}
                  onClick={() => setActiveListId(list.id)}
                  className={s.listCard}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded-md border text-[10px] uppercase font-black tracking-wider ${getAccentBadge(list.colorTag)}`}>
                        {list.type === "grocery" ? "🛒 Grocery" : "✅ Checklist"}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setBillModalList(list);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/25 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                          title="Download Bill / Receipt"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>Bill</span>
                        </button>

                        <button
                          onClick={(e) => handleDeleteList(list.id, e)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete list"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-base font-extrabold tracking-tight group-hover:text-cyan-400 transition-colors break-words">
                      {list.title}
                    </h3>

                    <p className="text-xs opacity-60 mt-1">
                      {list.items.length} {list.items.length === 1 ? "item" : "items"}
                      {list.items.length > 0 && ` · ${stats.purchasedItems} purchased`}
                    </p>

                    {/* Percentage of Success Purchasing Section */}
                    <div className="mt-3.5 p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-[11px] opacity-75 flex items-center gap-1.5">
                          <CheckCircle2 className={`w-3.5 h-3.5 ${stats.percentage === 100 ? "text-emerald-500" : s.accentText}`} />
                          <span>Purchase Success:</span>
                        </span>
                        <span
                          className={`font-mono text-xs font-black px-1.5 py-0.5 rounded ${
                            stats.percentage === 100
                              ? "text-emerald-500 bg-emerald-500/15"
                              : stats.percentage > 0
                              ? `${s.accentText} bg-black/10 dark:bg-white/10`
                              : "opacity-60"
                          }`}
                        >
                          {stats.percentage}%
                        </span>
                      </div>

                      {/* Visual Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            stats.percentage === 100
                              ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                              : s.progressBar
                          }`}
                          style={{ width: `${stats.percentage}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] opacity-65 font-medium">
                        <span>
                          {stats.totalItems === 0
                            ? "0 items in list"
                            : `${stats.purchasedItems} of ${stats.totalItems} bought`}
                        </span>
                        {list.type === "grocery" && stats.totalCost > 0 && (
                          <span className="font-mono font-bold">
                            {formatCurrencyAmount(stats.purchasedCost, activeCountry)} / {formatCurrencyAmount(stats.totalCost, activeCountry)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card bottom info */}
                  <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold text-cyan-400 group-hover:underline flex items-center gap-1">
                      <span>Open List</span>
                      <span>→</span>
                    </span>
                    {list.type === "grocery" && stats.totalCost > 0 && (
                      <span className="font-mono font-bold">
                        {formatCurrencyAmount(stats.totalCost, activeCountry)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE NEW LIST MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`${s.glassCard} w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-150`}>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-black/5 dark:border-white/5">
              <h2 className="text-base font-black tracking-tight flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>Create New List</span>
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 opacity-60 hover:opacity-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateList} className="space-y-4">
              {/* List Title */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider opacity-60 mb-1">
                  List Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Supermarket Haul, Weekend Errands..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className={s.inputField}
                  id="input-new-list-title"
                />
              </div>

              {/* List Type Switch */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider opacity-60 mb-1">
                  List Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType("grocery")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      newType === "grocery"
                        ? "bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-sm"
                        : "bg-black/10 dark:bg-white/5 border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Grocery Shopping</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType("checklist")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      newType === "checklist"
                        ? "bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-sm"
                        : "bg-black/10 dark:bg-white/5 border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>Task Checklist</span>
                  </button>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider opacity-60 mb-1">
                  Assign Date
                </label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className={s.inputField}
                  style={{ colorScheme: "dark" }}
                />
              </div>

              {/* Color Accent */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider opacity-60 mb-1.5">
                  Color Tag
                </label>
                <div className="flex gap-2">
                  {COLOR_ACCENTS.map((accent) => (
                    <button
                      key={accent.id}
                      type="button"
                      onClick={() => setNewColorTag(accent.id)}
                      className={`w-7 h-7 rounded-full ${accent.dot} transition-transform cursor-pointer flex items-center justify-center ${
                        newColorTag === accent.id ? "ring-2 ring-white scale-110" : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      {newColorTag === accent.id && <Check className="w-3.5 h-3.5 text-black font-black" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className={s.secondaryBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={s.submitBtn}
                  id="btn-confirm-create-list"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create & Open List</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Country & Regional Settings Modal */}
      <CountryPickerModal
        isOpen={isCountryModalOpen}
        onClose={() => setIsCountryModalOpen(false)}
        selectedCountry={activeCountry}
        onSelectCountry={handleSelectCountry}
        theme={theme}
      />

      {/* Bill & Receipt Generator Modal */}
      {billModalList && (
        <BillReceiptModal
          isOpen={!!billModalList}
          onClose={() => setBillModalList(null)}
          list={billModalList}
          country={activeCountry}
          theme={theme}
        />
      )}
    </div>
  );
}
