export type Theme = "minimalist" | "neumorphic" | "financial" | "cosmic";

export type ViewMode = "calculator" | "grocery";

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

export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  checked: boolean;
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
