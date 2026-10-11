import { ItemUnit } from "../types";

export interface DetectionResult {
  detectedUnit: ItemUnit;
  detectedQty: number;
  cleanedName?: string;
  matchedFromText: boolean; // True if parsed from explicit "2kg", "500gm", etc.
  reason?: string; // Reason to show the user (e.g. "Auto-detected: 2 kg")
}

// Known items typically sold by KG (bulk staples, vegetables, meats)
const KG_KEYWORDS = [
  "rice",
  "sugar",
  "flour",
  "wheat",
  "atta",
  "maida",
  "suji",
  "potato",
  "potatoes",
  "onion",
  "onions",
  "tomato",
  "tomatoes",
  "apple",
  "apples",
  "orange",
  "oranges",
  "banana",
  "bananas",
  "chicken",
  "mutton",
  "meat",
  "beef",
  "pork",
  "fish",
  "dal",
  "lentil",
  "lentils",
  "salt",
  "mango",
  "mangoes",
  "grapes",
  "watermelon",
  "cabbage",
  "cauliflower",
  "carrot",
  "carrots",
  "cucumber",
  "cucumbers",
  "beans",
  "peas",
  "prawns",
  "shrimp",
  "grains",
  "grain",
  "oil",
  "vegetable",
  "vegetables",
];

// Known items typically sold in Grams (spices, dry fruits, bakery essentials)
const GM_KEYWORDS = [
  "turmeric",
  "cardamom",
  "pepper",
  "black pepper",
  "ginger",
  "garlic",
  "chilli",
  "chili",
  "chilli powder",
  "chili powder",
  "tea",
  "tea powder",
  "coffee",
  "coriander",
  "cumin",
  "jeera",
  "clove",
  "cloves",
  "cinnamon",
  "yeast",
  "baking powder",
  "baking soda",
  "saffron",
  "butter",
  "cheese",
  "paneer",
  "almond",
  "almonds",
  "badam",
  "cashew",
  "cashews",
  "kaju",
  "walnut",
  "walnuts",
  "raisin",
  "raisins",
  "kishmish",
  "dry fruit",
  "dry fruits",
  "dates",
  "spices",
  "spice",
  "masala",
  "garam masala",
  "oregano",
  "mustard",
  "mustard seeds",
  "fenugreek",
  "asafoetida",
  "hing",
  "sesame",
  "sesame seeds",
  "herbs",
  "nutmeg",
];

// Known items typically sold by count / quantity
const QTY_KEYWORDS = [
  "egg",
  "eggs",
  "bread",
  "bun",
  "buns",
  "soap",
  "soaps",
  "shampoo",
  "biscuit",
  "biscuits",
  "cookie",
  "cookies",
  "chips",
  "milk",
  "juice",
  "can",
  "cans",
  "bottle",
  "bottles",
  "chocolate",
  "chocolates",
  "pen",
  "pens",
  "toothpaste",
  "brush",
  "toothbrush",
  "sponge",
  "towel",
  "foil",
  "tissue",
  "tissues",
  "detergent",
  "battery",
  "batteries",
  "packet",
  "pack",
  "box",
  "boxes",
];

/**
 * Detects unit and quantity automatically from the input string.
 * First checks explicit mentions like "2kg", "500gm", "3 pcs".
 * If not found, checks item catalog keywords to suggest the most natural unit.
 */
export function detectGroceryUnit(input: string): DetectionResult | null {
  if (!input || !input.trim()) return null;

  const raw = input.trim();
  const lower = raw.toLowerCase();

  // 1. Check for KG patterns: e.g. "2.5kg", "2 kg", "1.5 kgs", "0.5 kilo"
  // Suffix pattern: "Apples 2kg" or "Apples 2.5 kg"
  const kgSuffixRegex = /(.*?)(?:^|\s+)(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilo|kilos|kilogram|kilograms)\b(.*)/i;
  const kgMatch = raw.match(kgSuffixRegex);
  if (kgMatch) {
    const qty = parseFloat(kgMatch[2]);
    const cleaned = `${kgMatch[1] || ""} ${kgMatch[3] || ""}`.replace(/\s+/g, " ").trim();
    if (qty > 0) {
      return {
        detectedUnit: "kg",
        detectedQty: qty,
        cleanedName: cleaned || raw,
        matchedFromText: true,
        reason: `Auto-detected: ${qty} kg`,
      };
    }
  }

  // Prefix pattern: "2kg apples" or "2.5 kg apples"
  const kgPrefixRegex = /^(?:(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilo|kilos|kilogram|kilograms))\s+(.*)$/i;
  const kgPrefixMatch = raw.match(kgPrefixRegex);
  if (kgPrefixMatch) {
    const qty = parseFloat(kgPrefixMatch[1]);
    const cleaned = kgPrefixMatch[2].trim();
    if (qty > 0) {
      return {
        detectedUnit: "kg",
        detectedQty: qty,
        cleanedName: cleaned || raw,
        matchedFromText: true,
        reason: `Auto-detected: ${qty} kg`,
      };
    }
  }

  // 2. Check for Grams (gm) patterns: e.g. "500gm", "250g", "100 grams"
  // Suffix pattern: "Sugar 500gm", "Cashews 250 g"
  const gmSuffixRegex = /(.*?)(?:^|\s+)(\d+(?:\.\d+)?)\s*(?:gm|gms|g|gram|grams)\b(.*)/i;
  const gmMatch = raw.match(gmSuffixRegex);
  if (gmMatch) {
    const qty = parseFloat(gmMatch[2]);
    const cleaned = `${gmMatch[1] || ""} ${gmMatch[3] || ""}`.replace(/\s+/g, " ").trim();
    if (qty > 0) {
      return {
        detectedUnit: "gm",
        detectedQty: qty,
        cleanedName: cleaned || raw,
        matchedFromText: true,
        reason: `Auto-detected: ${qty} gm`,
      };
    }
  }

  // Prefix pattern: "500gm sugar" or "250g cashews"
  const gmPrefixRegex = /^(?:(\d+(?:\.\d+)?)\s*(?:gm|gms|g|gram|grams))\s+(.*)$/i;
  const gmPrefixMatch = raw.match(gmPrefixRegex);
  if (gmPrefixMatch) {
    const qty = parseFloat(gmPrefixMatch[1]);
    const cleaned = gmPrefixMatch[2].trim();
    if (qty > 0) {
      return {
        detectedUnit: "gm",
        detectedQty: qty,
        cleanedName: cleaned || raw,
        matchedFromText: true,
        reason: `Auto-detected: ${qty} gm`,
      };
    }
  }

  // 2b. Check for Pound (lb) and Ounce (oz) patterns
  const lbSuffixRegex = /(.*?)(?:^|\s+)(\d+(?:\.\d+)?)\s*(?:lb|lbs|pound|pounds)\b(.*)/i;
  const lbMatch = raw.match(lbSuffixRegex);
  if (lbMatch) {
    const qty = parseFloat(lbMatch[2]);
    const cleaned = `${lbMatch[1] || ""} ${lbMatch[3] || ""}`.replace(/\s+/g, " ").trim();
    if (qty > 0) {
      return {
        detectedUnit: "lb",
        detectedQty: qty,
        cleanedName: cleaned || raw,
        matchedFromText: true,
        reason: `Auto-detected: ${qty} lb`,
      };
    }
  }

  const ozSuffixRegex = /(.*?)(?:^|\s+)(\d+(?:\.\d+)?)\s*(?:oz|ounce|ounces)\b(.*)/i;
  const ozMatch = raw.match(ozSuffixRegex);
  if (ozMatch) {
    const qty = parseFloat(ozMatch[2]);
    const cleaned = `${ozMatch[1] || ""} ${ozMatch[3] || ""}`.replace(/\s+/g, " ").trim();
    if (qty > 0) {
      return {
        detectedUnit: "oz",
        detectedQty: qty,
        cleanedName: cleaned || raw,
        matchedFromText: true,
        reason: `Auto-detected: ${qty} oz`,
      };
    }
  }

  // 3. Check for Count / Pieces patterns: e.g. "6 pcs", "2 packets", "3 boxes"
  const qtySuffixRegex = /(.*?)(?:^|\s+)(\d+)\s*(?:pcs|pc|packet|packets|pkt|packs|pack|bottles|bottle|cans|can|boxes|box|pieces|piece|items|item|units|unit|nos|count)\b(.*)/i;
  const qtyMatch = raw.match(qtySuffixRegex);
  if (qtyMatch) {
    const qty = parseInt(qtyMatch[2], 10);
    const cleaned = `${qtyMatch[1] || ""} ${qtyMatch[3] || ""}`.replace(/\s+/g, " ").trim();
    if (qty > 0) {
      return {
        detectedUnit: "qty",
        detectedQty: qty,
        cleanedName: cleaned || raw,
        matchedFromText: true,
        reason: `Auto-detected: ${qty} pcs`,
      };
    }
  }

  // Leading number pattern: e.g. "3 apples", "12 eggs", "2 breads"
  const leadingNumRegex = /^(\d+)\s+([a-zA-Z].*)$/;
  const leadingNumMatch = raw.match(leadingNumRegex);
  if (leadingNumMatch) {
    const qty = parseInt(leadingNumMatch[1], 10);
    const cleaned = leadingNumMatch[2].trim();
    if (qty > 0 && cleaned.length > 1) {
      return {
        detectedUnit: "qty",
        detectedQty: qty,
        cleanedName: cleaned,
        matchedFromText: true,
        reason: `Auto-detected: ${qty} items`,
      };
    }
  }

  // 4. Catalog keyword matching if no explicit quantity was specified in text
  // Check GM keywords (spices, dry fruits)
  const isGm = GM_KEYWORDS.some((kw) => {
    const regex = new RegExp(`\\b${kw}\\b`, "i");
    return regex.test(lower);
  });
  if (isGm) {
    return {
      detectedUnit: "gm",
      detectedQty: 250, // default good standard spice/condiment size
      cleanedName: raw,
      matchedFromText: false,
      reason: `Auto-detected: gm (spice/dry fruit)`,
    };
  }

  // Check KG keywords (grains, veggies, staples, meats)
  const isKg = KG_KEYWORDS.some((kw) => {
    const regex = new RegExp(`\\b${kw}\\b`, "i");
    return regex.test(lower);
  });
  if (isKg) {
    return {
      detectedUnit: "kg",
      detectedQty: 1,
      cleanedName: raw,
      matchedFromText: false,
      reason: `Auto-detected: kg (staple/produce)`,
    };
  }

  // Check QTY keywords
  const isQty = QTY_KEYWORDS.some((kw) => {
    const regex = new RegExp(`\\b${kw}\\b`, "i");
    return regex.test(lower);
  });
  if (isQty) {
    return {
      detectedUnit: "qty",
      detectedQty: 1,
      cleanedName: raw,
      matchedFromText: false,
      reason: `Auto-detected: qty (packaged/item)`,
    };
  }

  return null;
}
