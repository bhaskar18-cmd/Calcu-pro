export type Theme = "minimalist" | "neumorphic" | "financial" | "cosmic";

export type ViewMode = "calculator" | "grocery" | "calendar" | "reminders";

export type ClockPlacement = "subheader" | "header" | "hidden";

export type NotchClearance = "auto" | "dynamic-island" | "tall-notch" | "zero";

export type SubCalculatorType =
  | "discount"
  | "gst"
  | "split"
  | "unit"
  | "age"
  | "emi"
  | "bmi"
  | "constants";

export interface HistoryItem {
  id: string;
  equation: string;
  result: string;
  timestamp: string;
}

export type ListType = "grocery" | "checklist";

export type ItemUnit = "qty" | "gm" | "kg" | "lb" | "oz";

export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit?: ItemUnit;
  price: number;
  totalPrice?: number;
  checked: boolean;
  category?: string;
  isFavorite?: boolean;
}

export interface DayListModel {
  id: string;
  title: string;
  type: ListType;
  date: string; // YYYY-MM-DD
  createdAt: string;
  items: GroceryItem[];
  colorTag?: string;
  discountPct?: string;
  taxPct?: string;
}

export interface TimeZoneOption {
  city: string;
  timezone: string;
  country: string;
}

export interface ScientificConstant {
  name: string;
  symbol: string;
  value: string; // string so it inserts directly into input
  unit: string;
  category: "Physical" | "Chemical" | "Astronomical";
}

export interface EmiScheduleItem {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}
