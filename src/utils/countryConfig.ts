import { ItemUnit } from "../types";

export interface WeightUnitOption {
  id: ItemUnit;
  label: string;
  shortLabel: string;
  step: string;
  min: string;
  desc: string;
}

export interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  currencySymbol: string;
  currencyCode: string;
  currencyName: string;
  weightSystem: "metric" | "imperial";
  defaultWeightUnit: ItemUnit;
  weightUnits: WeightUnitOption[];
  rateFormatExample: string;
}

export const COUNTRIES: CountryConfig[] = [
  {
    code: "IN",
    name: "India",
    flag: "🇮🇳",
    currencySymbol: "₹",
    currencyCode: "INR",
    currencyName: "Indian Rupee",
    weightSystem: "metric",
    defaultWeightUnit: "kg",
    rateFormatExample: "₹120.00 / kg",
    weightUnits: [
      { id: "qty", label: "Quantity", shortLabel: "Qty", step: "1", min: "1", desc: "Count / Pieces / Packets" },
      { id: "gm", label: "Grams", shortLabel: "gm", step: "10", min: "10", desc: "Grams (Spices, Dry Fruits)" },
      { id: "kg", label: "Kilograms", shortLabel: "kg", step: "0.1", min: "0.1", desc: "Kilograms (Veggies, Staples, Dal)" },
    ],
  },
  {
    code: "US",
    name: "United States",
    flag: "🇺🇸",
    currencySymbol: "$",
    currencyCode: "USD",
    currencyName: "US Dollar",
    weightSystem: "imperial",
    defaultWeightUnit: "lb",
    rateFormatExample: "$4.99 / lb",
    weightUnits: [
      { id: "qty", label: "Quantity", shortLabel: "Qty", step: "1", min: "1", desc: "Items / Count / Units" },
      { id: "lb", label: "Pounds", shortLabel: "lb", step: "0.1", min: "0.1", desc: "Pounds (Produce, Meats)" },
      { id: "oz", label: "Ounces", shortLabel: "oz", step: "0.5", min: "0.5", desc: "Ounces (Cheeses, Herbs)" },
      { id: "kg", label: "Kilograms", shortLabel: "kg", step: "0.1", min: "0.1", desc: "Kilograms (Metric)" },
      { id: "gm", label: "Grams", shortLabel: "gm", step: "10", min: "10", desc: "Grams (Metric)" },
    ],
  },
  {
    code: "GB",
    name: "United Kingdom",
    flag: "🇬🇧",
    currencySymbol: "£",
    currencyCode: "GBP",
    currencyName: "British Pound",
    weightSystem: "metric",
    defaultWeightUnit: "kg",
    rateFormatExample: "£3.50 / kg",
    weightUnits: [
      { id: "qty", label: "Quantity", shortLabel: "Qty", step: "1", min: "1", desc: "Items / Count / Packs" },
      { id: "gm", label: "Grams", shortLabel: "gm", step: "10", min: "10", desc: "Grams" },
      { id: "kg", label: "Kilograms", shortLabel: "kg", step: "0.1", min: "0.1", desc: "Kilograms" },
    ],
  },
  {
    code: "EU",
    name: "Eurozone (Europe)",
    flag: "🇪🇺",
    currencySymbol: "€",
    currencyCode: "EUR",
    currencyName: "Euro",
    weightSystem: "metric",
    defaultWeightUnit: "kg",
    rateFormatExample: "€3.20 / kg",
    weightUnits: [
      { id: "qty", label: "Quantity", shortLabel: "Qty", step: "1", min: "1", desc: "Items / Count" },
      { id: "gm", label: "Grams", shortLabel: "gm", step: "10", min: "10", desc: "Grams" },
      { id: "kg", label: "Kilograms", shortLabel: "kg", step: "0.1", min: "0.1", desc: "Kilograms" },
    ],
  },
  {
    code: "CA",
    name: "Canada",
    flag: "🇨🇦",
    currencySymbol: "CA$",
    currencyCode: "CAD",
    currencyName: "Canadian Dollar",
    weightSystem: "metric",
    defaultWeightUnit: "kg",
    rateFormatExample: "CA$4.50 / kg",
    weightUnits: [
      { id: "qty", label: "Quantity", shortLabel: "Qty", step: "1", min: "1", desc: "Items / Count" },
      { id: "kg", label: "Kilograms", shortLabel: "kg", step: "0.1", min: "0.1", desc: "Kilograms" },
      { id: "gm", label: "Grams", shortLabel: "gm", step: "10", min: "10", desc: "Grams" },
      { id: "lb", label: "Pounds", shortLabel: "lb", step: "0.1", min: "0.1", desc: "Pounds" },
    ],
  },
  {
    code: "AU",
    name: "Australia",
    flag: "🇦🇺",
    currencySymbol: "A$",
    currencyCode: "AUD",
    currencyName: "Australian Dollar",
    weightSystem: "metric",
    defaultWeightUnit: "kg",
    rateFormatExample: "A$5.00 / kg",
    weightUnits: [
      { id: "qty", label: "Quantity", shortLabel: "Qty", step: "1", min: "1", desc: "Items / Count" },
      { id: "gm", label: "Grams", shortLabel: "gm", step: "10", min: "10", desc: "Grams" },
      { id: "kg", label: "Kilograms", shortLabel: "kg", step: "0.1", min: "0.1", desc: "Kilograms" },
    ],
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    flag: "🇦🇪",
    currencySymbol: "AED",
    currencyCode: "AED",
    currencyName: "UAE Dirham",
    weightSystem: "metric",
    defaultWeightUnit: "kg",
    rateFormatExample: "AED 15.00 / kg",
    weightUnits: [
      { id: "qty", label: "Quantity", shortLabel: "Qty", step: "1", min: "1", desc: "Items / Count" },
      { id: "gm", label: "Grams", shortLabel: "gm", step: "10", min: "10", desc: "Grams" },
      { id: "kg", label: "Kilograms", shortLabel: "kg", step: "0.1", min: "0.1", desc: "Kilograms" },
    ],
  },
  {
    code: "BD",
    name: "Bangladesh",
    flag: "🇧🇩",
    currencySymbol: "৳",
    currencyCode: "BDT",
    currencyName: "Bangladeshi Taka",
    weightSystem: "metric",
    defaultWeightUnit: "kg",
    rateFormatExample: "৳150.00 / kg",
    weightUnits: [
      { id: "qty", label: "Quantity", shortLabel: "Qty", step: "1", min: "1", desc: "Count / Pieces" },
      { id: "gm", label: "Grams", shortLabel: "gm", step: "10", min: "10", desc: "Grams" },
      { id: "kg", label: "Kilograms", shortLabel: "kg", step: "0.1", min: "0.1", desc: "Kilograms" },
    ],
  },
  {
    code: "PK",
    name: "Pakistan",
    flag: "🇵🇰",
    currencySymbol: "₨",
    currencyCode: "PKR",
    currencyName: "Pakistani Rupee",
    weightSystem: "metric",
    defaultWeightUnit: "kg",
    rateFormatExample: "₨300.00 / kg",
    weightUnits: [
      { id: "qty", label: "Quantity", shortLabel: "Qty", step: "1", min: "1", desc: "Count / Pieces" },
      { id: "gm", label: "Grams", shortLabel: "gm", step: "10", min: "10", desc: "Grams" },
      { id: "kg", label: "Kilograms", shortLabel: "kg", step: "0.1", min: "0.1", desc: "Kilograms" },
    ],
  },
  {
    code: "NP",
    name: "Nepal",
    flag: "🇳🇵",
    currencySymbol: "रू",
    currencyCode: "NPR",
    currencyName: "Nepalese Rupee",
    weightSystem: "metric",
    defaultWeightUnit: "kg",
    rateFormatExample: "रू250.00 / kg",
    weightUnits: [
      { id: "qty", label: "Quantity", shortLabel: "Qty", step: "1", min: "1", desc: "Count / Pieces" },
      { id: "gm", label: "Grams", shortLabel: "gm", step: "10", min: "10", desc: "Grams" },
      { id: "kg", label: "Kilograms", shortLabel: "kg", step: "0.1", min: "0.1", desc: "Kilograms" },
    ],
  },
  {
    code: "SA",
    name: "Saudi Arabia",
    flag: "🇸🇦",
    currencySymbol: "SAR",
    currencyCode: "SAR",
    currencyName: "Saudi Riyal",
    weightSystem: "metric",
    defaultWeightUnit: "kg",
    rateFormatExample: "SAR 12.00 / kg",
    weightUnits: [
      { id: "qty", label: "Quantity", shortLabel: "Qty", step: "1", min: "1", desc: "Count / Pieces" },
      { id: "gm", label: "Grams", shortLabel: "gm", step: "10", min: "10", desc: "Grams" },
      { id: "kg", label: "Kilograms", shortLabel: "kg", step: "0.1", min: "0.1", desc: "Kilograms" },
    ],
  },
  {
    code: "SG",
    name: "Singapore",
    flag: "🇸🇬",
    currencySymbol: "S$",
    currencyCode: "SGD",
    currencyName: "Singapore Dollar",
    weightSystem: "metric",
    defaultWeightUnit: "kg",
    rateFormatExample: "S$4.00 / kg",
    weightUnits: [
      { id: "qty", label: "Quantity", shortLabel: "Qty", step: "1", min: "1", desc: "Count / Pieces" },
      { id: "gm", label: "Grams", shortLabel: "gm", step: "10", min: "10", desc: "Grams" },
      { id: "kg", label: "Kilograms", shortLabel: "kg", step: "0.1", min: "0.1", desc: "Kilograms" },
    ],
  },
  {
    code: "JP",
    name: "Japan",
    flag: "🇯🇵",
    currencySymbol: "¥",
    currencyCode: "JPY",
    currencyName: "Japanese Yen",
    weightSystem: "metric",
    defaultWeightUnit: "kg",
    rateFormatExample: "¥450 / kg",
    weightUnits: [
      { id: "qty", label: "Quantity", shortLabel: "Qty", step: "1", min: "1", desc: "Items / Count" },
      { id: "gm", label: "Grams", shortLabel: "gm", step: "10", min: "10", desc: "Grams" },
      { id: "kg", label: "Kilograms", shortLabel: "kg", step: "0.1", min: "0.1", desc: "Kilograms" },
    ],
  },
];

export const DEFAULT_COUNTRY_CODE = "IN"; // Defaults to India with ₹ Rupees as requested

export const getCountryByCode = (code: string): CountryConfig => {
  const found = COUNTRIES.find((c) => c.code.toUpperCase() === code.toUpperCase());
  return found || COUNTRIES[0]; // defaults to India (₹)
};

export const getStoredCountry = (): CountryConfig => {
  try {
    const savedCode =
      localStorage.getItem("app_country_setting") ||
      localStorage.getItem("user_country_code") ||
      localStorage.getItem("country_type");
    if (savedCode) {
      return getCountryByCode(savedCode);
    }
  } catch (e) {
    console.error("Failed to read country from localStorage:", e);
  }
  return COUNTRIES[0]; // India (₹) by default
};

export const saveStoredCountry = (code: string): void => {
  try {
    localStorage.setItem("app_country_setting", code);
    localStorage.setItem("user_country_code", code);
    localStorage.setItem("country_type", code);
  } catch (e) {
    console.error("Failed to save country to localStorage:", e);
  }
};

/**
 * Format a monetary amount according to the country's currency symbol.
 */
export const formatCurrencyAmount = (
  amount: number,
  country: CountryConfig,
  decimals: number = 2
): string => {
  const sym = country.currencySymbol;
  // If currency code is text-based like AED or SAR, add space
  const spacing = sym.length > 2 ? " " : "";
  const formattedNumber = amount.toLocaleString("en-US", {
    minimumFractionDigits: country.code === "JP" ? 0 : decimals,
    maximumFractionDigits: country.code === "JP" ? 0 : decimals,
  });
  return `${sym}${spacing}${formattedNumber}`;
};

/**
 * Format price per unit/quantity rate based on the country's currency and item unit.
 */
export const formatItemRateWithCountry = (
  totalPrice: number,
  qty: number,
  unit: ItemUnit | undefined,
  country: CountryConfig
): string => {
  if (totalPrice <= 0 || qty <= 0) return "";
  const sym = country.currencySymbol;
  const spacing = sym.length > 2 ? " " : "";

  if (unit === "kg") {
    const ratePerKg = totalPrice / qty;
    return `${sym}${spacing}${ratePerKg.toFixed(2)} / kg`;
  }

  if (unit === "gm") {
    const ratePerKg = (totalPrice / qty) * 1000;
    return `≈ ${sym}${spacing}${ratePerKg.toFixed(2)} / kg`;
  }

  if (unit === "lb") {
    const ratePerLb = totalPrice / qty;
    return `${sym}${spacing}${ratePerLb.toFixed(2)} / lb`;
  }

  if (unit === "oz") {
    const ratePerLb = (totalPrice / qty) * 16;
    return `≈ ${sym}${spacing}${ratePerLb.toFixed(2)} / lb`;
  }

  // Default quantity/pieces
  return `${sym}${spacing}${(totalPrice / qty).toFixed(2)} / ea`;
};
