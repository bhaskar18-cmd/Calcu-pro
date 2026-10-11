import React, { useState, useRef } from "react";
import {
  X,
  Download,
  Printer,
  Copy,
  Check,
  Upload,
  Settings2,
  FileText,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Store,
  Calendar,
  User,
  Hash,
  Percent,
  Receipt,
  Image as ImageIcon,
  FileSpreadsheet,
} from "lucide-react";
import domtoimage from "dom-to-image-more";
import jsPDF from "jspdf";
import { DayListModel, GroceryItem, Theme } from "../types";
import { CountryConfig, formatCurrencyAmount } from "../utils/countryConfig";
import { getItemTotal, getItemUnitPrice } from "./GroceryList";
import {
  exportPdfFile,
  exportImageFile,
  exportCsvFile,
  exportTextFile,
  buildCsvContent,
  isNativePlatform,
} from "../utils/fileExporter";

export type ReceiptTemplate = "bhk-official" | "thermal-pos" | "modern-invoice";

interface BillReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  list: DayListModel;
  country: CountryConfig;
  theme: Theme;
}

export const BillReceiptModal: React.FC<BillReceiptModalProps> = ({
  isOpen,
  onClose,
  list,
  country,
  theme,
}) => {
  // Receipt Configuration State
  const [template, setTemplate] = useState<ReceiptTemplate>("bhk-official");
  const [storeName, setStoreName] = useState("BHK Grocery App");
  const [storeTagline, setStoreTagline] = useState("Smart Shopping & Inventory System");
  const [storeContact, setStoreContact] = useState("support@bhkgrocery.local | Ph: +91 98000 12345");
  const [customerName, setCustomerName] = useState("Self");
  const [invoiceNumber, setInvoiceNumber] = useState(
    () => `BHK-${list.date.replace(/-/g, "")}-${list.id.slice(0, 4).toUpperCase()}`
  );
  const [billDate, setBillDate] = useState(list.date || new Date().toISOString().split("T")[0]);
  const [includeOnlyChecked, setIncludeOnlyChecked] = useState(false);
  const [taxPct, setTaxPct] = useState<number>(() => (list.taxPct ? parseFloat(list.taxPct) || 0 : 0));
  const [discountPct, setDiscountPct] = useState<number>(
    () => (list.discountPct ? parseFloat(list.discountPct) || 0 : 0)
  );
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
  const [footerMessage, setFooterMessage] = useState("THANK YOU FOR SHOPPING WITH US! VISIT AGAIN");

  // UI state
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [previewFit, setPreviewFit] = useState<"fit" | "full">("fit");

  const receiptRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Filter items based on user choice
  const billItems: GroceryItem[] = includeOnlyChecked
    ? list.items.filter((item) => item.checked)
    : list.items;

  // Calculations
  const subtotal = billItems.reduce((acc, item) => acc + getItemTotal(item), 0);
  const discountAmount = (subtotal * discountPct) / 100;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableAmount * taxPct) / 100;
  const grandTotal = taxableAmount + taxAmount;
  const totalItemCount = billItems.reduce((acc, item) => acc + (item.quantity || 1), 0);

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be smaller than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomLogoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // High-Resolution Lossless Capture Engine (Browser-Native Engine with Isolated Sandbox)
  const captureReceiptImage = async (): Promise<{ dataUrl: string; width: number; height: number } | null> => {
    if (!receiptRef.current) return null;
    const element = receiptRef.current;

    // Fixed canonical document widths to ensure mobile and desktop exports are 100% identical
    const targetWidth = template === "thermal-pos" ? 400 : 680;

    // Create an isolated staging sandbox directly on document.body.
    // This completely removes all ancestor transforms (such as previewFit scale(0.44)),
    // mobile viewport squishing, and container clipping, guaranteeing 100% identical
    // desktop-grade rendering whether the browser is on desktop or mobile.
    const sandbox = document.createElement("div");
    sandbox.setAttribute("id", "receipt-capture-sandbox");
    sandbox.style.position = "fixed";
    sandbox.style.left = "-10000px";
    sandbox.style.top = "0";
    sandbox.style.width = `${targetWidth}px`;
    sandbox.style.minWidth = `${targetWidth}px`;
    sandbox.style.maxWidth = `${targetWidth}px`;
    sandbox.style.margin = "0";
    sandbox.style.padding = "0";
    sandbox.style.border = "none";
    sandbox.style.background = "#ffffff";
    sandbox.style.zIndex = "-99999";
    sandbox.style.pointerEvents = "none";
    sandbox.style.transform = "none";
    sandbox.style.webkitTextSizeAdjust = "100%";
    (sandbox.style as any).textSizeAdjust = "100%";

    // Deep clone the receipt element into the sandbox
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.width = `${targetWidth}px`;
    clone.style.minWidth = `${targetWidth}px`;
    clone.style.maxWidth = `${targetWidth}px`;
    clone.style.transform = "none";
    (clone.style as any).zoom = "1";
    clone.style.margin = "0";
    clone.style.boxShadow = "none";
    clone.style.webkitTextSizeAdjust = "100%";
    (clone.style as any).textSizeAdjust = "100%";

    sandbox.appendChild(clone);
    document.body.appendChild(sandbox);

    try {
      // Ensure all images in clone are fully loaded and decoded
      const images = Array.from(clone.querySelectorAll("img"));
      await Promise.all(
        images.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete && img.naturalWidth > 0) return resolve();
              img.onload = () => resolve();
              img.onerror = () => resolve();
            })
        )
      );

      // Measure true natural rendered height
      const measuredHeight = Math.max(
        clone.scrollHeight,
        clone.offsetHeight,
        template === "thermal-pos" ? 420 : 560
      );

      // 2.5x retina scaling for crisp 300 DPI equivalent rendering
      const dataUrl = await domtoimage.toPng(clone, {
        scale: 2.5,
        bgcolor: "#ffffff",
        width: targetWidth,
        height: measuredHeight,
        style: {
          transform: "none",
          zoom: "1",
          margin: "0px",
          boxShadow: "none",
          width: `${targetWidth}px`,
          minWidth: `${targetWidth}px`,
          maxWidth: `${targetWidth}px`,
          webkitTextSizeAdjust: "100%",
        } as any,
      });

      // Measure dimensions
      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Unable to decode generated image"));
      });

      return {
        dataUrl,
        width: img.naturalWidth || targetWidth * 2.5,
        height: img.naturalHeight || measuredHeight * 2.5,
      };
    } catch (primaryErr) {
      console.warn("Retina capture in sandbox failed, attempting standard 1x scale capture:", primaryErr);
      const measuredHeight = Math.max(
        clone.scrollHeight,
        clone.offsetHeight,
        template === "thermal-pos" ? 420 : 560
      );

      const dataUrl = await domtoimage.toPng(clone, {
        bgcolor: "#ffffff",
        width: targetWidth,
        height: measuredHeight,
        style: {
          transform: "none",
          zoom: "1",
          margin: "0px",
          boxShadow: "none",
          width: `${targetWidth}px`,
          minWidth: `${targetWidth}px`,
          maxWidth: `${targetWidth}px`,
          webkitTextSizeAdjust: "100%",
        } as any,
      });

      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });

      return {
        dataUrl,
        width: img.naturalWidth || targetWidth,
        height: img.naturalHeight || measuredHeight,
      };
    } finally {
      if (sandbox.parentNode) {
        sandbox.parentNode.removeChild(sandbox);
      }
    }
  };

  // 1. Download Ultra-Crisp PDF
  const handleDownloadPDF = async () => {
    try {
      if (!billItems || billItems.length === 0) {
        setExportMessage("Cannot export empty bill. There are no items to generate a PDF.");
        setTimeout(() => setExportMessage(null), 3500);
        return;
      }
      setIsExporting(true);
      setExportMessage("Generating Ultra-HD PDF (Zero Quality Drop)...");

      const capture = await captureReceiptImage();
      if (!capture) throw new Error("Could not capture receipt content");

      const { dataUrl, width: imgWidthPx, height: imgHeightPx } = capture;

      // Calculate PDF page size based on receipt dimensions
      // For thermal roll: 80mm roll width
      // For standard invoice: A4 width is 210mm
      const isThermal = template === "thermal-pos";
      const pdfWidth = isThermal ? 80 : 210;
      const pdfHeight = (imgHeightPx * pdfWidth) / imgWidthPx;

      const pdf = new jsPDF({
        orientation: !isThermal && pdfHeight < pdfWidth ? "landscape" : "portrait",
        unit: "mm",
        format: [pdfWidth, Math.max(pdfHeight + (isThermal ? 6 : 10), isThermal ? 80 : 150)],
      });

      pdf.addImage(dataUrl, "PNG", 0, isThermal ? 3 : 5, pdfWidth, pdfHeight, undefined, "FAST");
      const safeFilename = `${storeName.replace(/[^a-zA-Z0-9]/g, "_")}_Bill_${invoiceNumber}.pdf`;

      // Export using universal handler (direct download on Web, native save/share on Capacitor Android)
      const pdfBlob = pdf.output("blob");
      const res = await exportPdfFile(
        safeFilename,
        pdfBlob,
        `${storeName} Bill #${invoiceNumber}`
      );

      setExportMessage(res.message);
      setTimeout(() => setExportMessage(null), 3500);
    } catch (err: any) {
      console.error("PDF generation failed:", err);
      setExportMessage(`Failed to generate PDF: ${err?.message || "Error"}. You can also use 'Print Receipt'.`);
      setTimeout(() => setExportMessage(null), 4000);
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Download High-Definition PNG Image (300 DPI Lossless)
  const handleDownloadHDImage = async () => {
    try {
      if (!billItems || billItems.length === 0) {
        setExportMessage("Cannot export empty bill. There are no items to generate an image.");
        setTimeout(() => setExportMessage(null), 3500);
        return;
      }
      setIsExporting(true);
      setExportMessage("Rendering 300 DPI HD Image (Zero Quality Drop)...");

      const capture = await captureReceiptImage();
      if (!capture) throw new Error("Could not capture receipt content");

      const safeFilename = `${storeName.replace(/[^a-zA-Z0-9]/g, "_")}_Bill_${invoiceNumber}.png`;
      const res = await exportImageFile(
        safeFilename,
        capture.dataUrl,
        "image/png",
        `${storeName} Bill #${invoiceNumber}`
      );

      setExportMessage(res.message);
      setTimeout(() => setExportMessage(null), 3500);
    } catch (err: any) {
      console.error("Image export failed:", err);
      setExportMessage(`Failed to export image: ${err?.message || "Error"}`);
      setTimeout(() => setExportMessage(null), 3500);
    } finally {
      setIsExporting(false);
    }
  };

  // 3. Download CSV Spreadsheet (Excel / Google Sheets)
  const handleDownloadCSV = async () => {
    try {
      if (!billItems || billItems.length === 0) {
        setExportMessage("Cannot export empty bill. There are no items to generate a CSV spreadsheet.");
        setTimeout(() => setExportMessage(null), 3500);
        return;
      }
      setIsExporting(true);
      setExportMessage("Generating CSV Spreadsheet...");

      const headers = [
        "Item Name",
        "Quantity",
        "Unit",
        "Unit Price",
        "Total Price"
      ];

      const rows = billItems.map((item) => [
        item.name,
        item.quantity,
        item.unit && item.unit !== "qty" ? item.unit : "qty",
        getItemUnitPrice(item).toFixed(2),
        getItemTotal(item).toFixed(2),
      ]);

      rows.push(["", "", "", "", ""]);
      rows.push(["SUBTOTAL", "", "", "", subtotal.toFixed(2)]);
      if (discountPct > 0) {
        rows.push([`DISCOUNT (${discountPct}%)`, "", "", "", `-${discountAmount.toFixed(2)}`]);
      }
      if (taxPct > 0) {
        rows.push([`TAX (${taxPct}%)`, "", "", "", `+${taxAmount.toFixed(2)}`]);
      }
      rows.push(["GRAND TOTAL", "", "", "", grandTotal.toFixed(2)]);

      const csvContent = buildCsvContent(headers, rows);
      const safeFilename = `${storeName.replace(/[^a-zA-Z0-9]/g, "_")}_Bill_${invoiceNumber}.csv`;

      const res = await exportCsvFile(
        safeFilename,
        csvContent,
        `${storeName} Bill #${invoiceNumber} CSV`
      );

      setExportMessage(res.message);
      setTimeout(() => setExportMessage(null), 3500);
    } catch (err: any) {
      console.error("CSV export failed:", err);
      setExportMessage(`Failed to export CSV: ${err?.message || "Error"}`);
      setTimeout(() => setExportMessage(null), 4000);
    } finally {
      setIsExporting(false);
    }
  };

  // 4. Print / Native Browser PDF (100% Vector Crisp)
  const handlePrint = () => {
    if (isNativePlatform()) {
      setExportMessage("On Android, use 'Download PDF' to print via Android's native print manager.");
      setTimeout(() => setExportMessage(null), 4000);
      return;
    }
    window.print();
  };

  // 4. Copy Text Receipt
  const handleCopyText = async () => {
    const dateFormatted = new Date(billDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    let text = `==============================\n`;
    text += `  ${storeName.toUpperCase()}\n`;
    text += `  ${storeTagline}\n`;
    text += `==============================\n`;
    text += `Invoice: ${invoiceNumber}\n`;
    text += `Date:    ${dateFormatted}\n`;
    text += `Customer: ${customerName}\n`;
    text += `------------------------------\n`;
    text += `ITEM                QTY   TOTAL\n`;
    text += `------------------------------\n`;

    billItems.forEach((item) => {
      const name = item.name.padEnd(18).slice(0, 18);
      const qty = `${item.quantity} ${item.unit && item.unit !== "qty" ? item.unit : ""}`.padStart(5);
      const tot = formatCurrencyAmount(getItemTotal(item), country).padStart(7);
      text += `${name} ${qty} ${tot}\n`;
    });

    text += `------------------------------\n`;
    text += `Total Items: ${totalItemCount}\n`;
    text += `Subtotal:    ${formatCurrencyAmount(subtotal, country)}\n`;
    if (discountPct > 0) {
      text += `Discount (${discountPct}%): -${formatCurrencyAmount(discountAmount, country)}\n`;
    }
    if (taxPct > 0) {
      text += `Tax (${taxPct}%):      +${formatCurrencyAmount(taxAmount, country)}\n`;
    }
    text += `GRAND TOTAL: ${formatCurrencyAmount(grandTotal, country)}\n`;
    text += `==============================\n`;
    text += `${footerMessage}\n`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Clipboard copy failed:", e);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150"
      id="bill-receipt-modal"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[96vh] flex flex-col text-slate-100 overflow-hidden my-auto">
        {/* Modal Top Control Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Download Bill & Receipt
                </h2>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  Zero Quality Drop
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Itemized breakdown for &ldquo;{list.title}&rdquo; ({billItems.length} items)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            <button
              onClick={() => setIsCustomizing(!isCustomizing)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                isCustomizing
                  ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                  : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
              }`}
              title="Customize store name, customer, tax & logo"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>{isCustomizing ? "Close Settings" : "Customize Bill"}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Settings drawer & Live Receipt Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin">
          {/* Notification status banner */}
          {exportMessage && (
            <div className="p-3 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center justify-between animate-in fade-in duration-200">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                {exportMessage}
              </span>
              <button onClick={() => setExportMessage(null)} className="text-cyan-400 hover:text-white">
                ✕
              </button>
            </div>
          )}

          {/* Quick Format & Template Selector Strip */}
          <div className="bg-slate-950/60 p-3 sm:p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                Receipt Template:
              </span>
              <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 gap-1 flex-wrap">
                <button
                  onClick={() => setTemplate("bhk-official")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    template === "bhk-official"
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>BHK Official Store</span>
                </button>

                <button
                  onClick={() => setTemplate("thermal-pos")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    template === "thermal-pos"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Supermarket Thermal Slip</span>
                </button>

                <button
                  onClick={() => setTemplate("modern-invoice")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    template === "modern-invoice"
                      ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Modern Minimal Invoice</span>
                </button>
              </div>
            </div>

            {/* Checked items filter toggle */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeOnlyChecked}
                  onChange={(e) => setIncludeOnlyChecked(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                />
                <span>Include purchased items only ({list.items.filter((i) => i.checked).length})</span>
              </label>
            </div>
          </div>

          {/* CUSTOMIZATION DRAWER */}
          {isCustomizing && (
            <div className="bg-slate-950/80 p-4 sm:p-5 rounded-2xl border border-cyan-500/30 space-y-4 animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  <span>Custom Bill & Branding Settings</span>
                </h3>
                <button
                  onClick={() => {
                    setStoreName("BHK Grocery App");
                    setStoreTagline("Smart Shopping & Inventory System");
                    setStoreContact("support@bhkgrocery.local | Ph: +91 98000 12345");
                    setCustomerName("Self");
                    setTaxPct(0);
                    setDiscountPct(0);
                    setCustomLogoUrl(null);
                  }}
                  className="text-[11px] font-bold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Defaults</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {/* Store Name */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Store / App Title
                  </label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                    placeholder="BHK Grocery App"
                  />
                </div>

                {/* Tagline */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Store Tagline
                  </label>
                  <input
                    type="text"
                    value={storeTagline}
                    onChange={(e) => setStoreTagline(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                    placeholder="Smart Shopping & Inventory System"
                  />
                </div>

                {/* Customer Name */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                    placeholder="Customer Name / Self"
                  />
                </div>

                {/* Invoice Number */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Invoice / Bill #
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                    placeholder="BHK-INV-2026-0042"
                  />
                </div>

                {/* Bill Date */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Discount % */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Discount Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={discountPct}
                    onChange={(e) => setDiscountPct(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Tax / GST % */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Tax / GST Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={taxPct}
                    onChange={(e) => setTaxPct(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Custom Store Logo / Bill Format Upload */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Upload Custom Store Logo / Header Graphic
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{customLogoUrl ? "Change Logo" : "Upload Logo Image"}</span>
                    </button>
                    {customLogoUrl && (
                      <button
                        type="button"
                        onClick={() => setCustomLogoUrl(null)}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-bold transition-all cursor-pointer"
                      >
                        Remove Logo
                      </button>
                    )}
                    <span className="text-[11px] text-slate-400">
                      {customLogoUrl ? "Custom logo active" : "PNG, JPG, or SVG (Max 5MB)"}
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* LIVE BILL / RECEIPT CANVAS (PRINTABLE / EXPORTABLE) */}
          {/* -------------------------------------------------------- */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1 text-xs text-slate-400">
              <span className="font-semibold flex items-center gap-1.5">
                <span>Print Document Preview</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 font-mono font-bold">
                  {template === "thermal-pos" ? "400px · 80mm Roll" : "680px · Standard A4"}
                </span>
              </span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPreviewFit("fit")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    previewFit === "fit" ? "bg-cyan-500 text-white shadow-sm" : "text-slate-400 hover:text-white"
                  }`}
                  title="Fit preview to screen on mobile"
                >
                  Fit Mobile
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFit("full")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    previewFit === "full" ? "bg-cyan-500 text-white shadow-sm" : "text-slate-400 hover:text-white"
                  }`}
                  title="View at 100% full scale"
                >
                  100% Size
                </button>
              </div>
            </div>

            <div className="flex justify-center p-2 sm:p-4 bg-slate-950/40 rounded-2xl border border-slate-800/80 overflow-x-auto">
              <div
                className="transition-all duration-200 origin-top flex justify-center"
                style={
                  previewFit === "fit"
                    ? {
                        transform: `scale(clamp(0.42, calc((100vw - 48px) / ${template === "thermal-pos" ? 420 : 700}), 1))`,
                        transformOrigin: "top center",
                        marginBottom: `calc((clamp(0.42, calc((100vw - 48px) / ${template === "thermal-pos" ? 420 : 700}), 1) - 1) * 720px)`,
                      }
                    : undefined
                }
              >
                <div
                  ref={receiptRef}
                  id="printable-bill-receipt-content"
                  className={`bg-white text-slate-900 shadow-2xl transition-all duration-150 ${
                    template === "thermal-pos"
                      ? "w-[400px] min-w-[400px] max-w-[400px] font-mono border-dashed border-2 border-slate-400 p-6 text-xs shrink-0"
                      : template === "modern-invoice"
                      ? "w-[680px] min-w-[680px] max-w-[680px] font-sans border border-slate-200 rounded-xl p-8 shrink-0"
                      : "w-[680px] min-w-[680px] max-w-[680px] font-sans border-2 border-slate-300 rounded-2xl shadow-xl p-8 shrink-0"
                  }`}
                  style={{
                    minHeight: template === "thermal-pos" ? "420px" : "560px",
                    WebkitTextSizeAdjust: "100%",
                    textSizeAdjust: "100%",
                  }}
                >
              {/* ======================================================== */}
              {/* TEMPLATE 1: BHK GROCERY APP (OFFICIAL FORMAT MATCHING UPLOAD) */}
              {/* ======================================================== */}
              {template === "bhk-official" && (
                <div className="space-y-6">
                  {/* Top Header Row */}
                  <div className="flex items-start justify-between pb-5 border-b-2 border-slate-900 gap-4">
                    <div className="flex items-center gap-3">
                      {customLogoUrl ? (
                        <img
                          src={customLogoUrl}
                          alt="Store Logo"
                          className="w-14 h-14 object-contain rounded-xl border border-slate-200 shadow-sm"
                        />
                      ) : (
                        <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-cyan-600/30">
                          <ShoppingBag className="w-7 h-7" />
                        </div>
                      )}

                      <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase leading-none">
                          {storeName}
                        </h1>
                        <p className="text-xs font-bold text-cyan-700 mt-1">
                          {storeTagline}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                          {storeContact}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="inline-block px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-700 to-cyan-600 text-white font-black text-xs tracking-wider uppercase shadow-sm">
                        BILL / INVOICE
                      </div>
                      <div className="text-[11px] font-mono text-slate-600 mt-2 font-bold">
                        ORIGINAL COPY
                      </div>
                    </div>
                  </div>

                  {/* Metadata Grid (Always 4 neat columns in canonical invoice width) */}
                  <div className="grid grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-black text-slate-500 block">
                        Date:
                      </span>
                      <span className="font-bold text-slate-900">{billDate}</span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-black text-slate-500 block">
                        Customer:
                      </span>
                      <span className="font-bold text-slate-900 truncate block">
                        {customerName}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-black text-slate-500 block">
                        Bill No:
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {invoiceNumber}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-black text-slate-500 block">
                        Total Items:
                      </span>
                      <span className="font-bold text-cyan-700">
                        {billItems.length} ({totalItemCount} Units)
                      </span>
                    </div>
                  </div>

                  {/* Table: Item, Price, Qty, Total (Locked column widths to prevent overlapping) */}
                  <div className="overflow-hidden rounded-xl border-2 border-slate-900">
                    <table className="w-full text-left text-xs border-collapse table-fixed">
                      <thead>
                        <tr className="bg-slate-900 text-white font-black uppercase tracking-wider text-[11px]">
                          <th className="py-2.5 px-3 w-10 text-center">#</th>
                          <th className="py-2.5 px-3">Item Name</th>
                          <th className="py-2.5 px-3 w-28 text-right whitespace-nowrap">Price</th>
                          <th className="py-2.5 px-3 w-24 text-center whitespace-nowrap">Qty</th>
                          <th className="py-2.5 px-3 w-28 text-right whitespace-nowrap">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-medium">
                        {billItems.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                              No items selected for this bill.
                            </td>
                          </tr>
                        ) : (
                          billItems.map((item, idx) => {
                            const unitPrice = getItemUnitPrice(item);
                            const total = getItemTotal(item);
                            return (
                              <tr
                                key={item.id}
                                className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/70"}
                              >
                                <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px] text-center">
                                  {idx + 1}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-slate-900 truncate">
                                  <span>{item.name}</span>
                                  {item.unit && item.unit !== "qty" && (
                                    <span className="ml-1.5 text-[10px] font-semibold text-slate-500 px-1 py-0.2 rounded bg-slate-200">
                                      {item.unit}
                                    </span>
                                  )}
                                  {item.checked && (
                                    <span className="ml-1 text-[10px] text-emerald-600 font-bold">
                                      ✓
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-700 whitespace-nowrap">
                                  {formatCurrencyAmount(unitPrice, country)}
                                </td>
                                <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900 whitespace-nowrap">
                                  {item.quantity}{" "}
                                  <span className="text-[10px] text-slate-500">
                                    {item.unit && item.unit !== "qty" ? item.unit : "pcs"}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-black text-slate-950 whitespace-nowrap">
                                  {formatCurrencyAmount(total, country)}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary & Totals Box (Always row-aligned in canonical invoice width) */}
                  <div className="flex flex-row justify-between items-start gap-4 pt-3">
                    <div className="text-xs text-slate-500 space-y-1 max-w-xs">
                      <p className="font-bold text-slate-700">Payment Summary & Notes:</p>
                      <p className="text-[11px]">
                        Prices inclusive of standard taxes where applicable. Save this receipt for
                        your personal grocery records or budget tracking.
                      </p>
                      <div className="pt-2 font-mono text-[10px] text-slate-400">
                        Verification Code: BHK-{Date.now().toString().slice(-8)}
                      </div>
                    </div>

                    <div className="w-64 space-y-1.5 text-xs shrink-0">
                      <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                        <span>Items Subtotal:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {formatCurrencyAmount(subtotal, country)}
                        </span>
                      </div>

                      {discountPct > 0 && (
                        <div className="flex justify-between py-1 border-b border-slate-200 text-emerald-600">
                          <span>Discount ({discountPct}%):</span>
                          <span className="font-mono font-bold">
                            -{formatCurrencyAmount(discountAmount, country)}
                          </span>
                        </div>
                      )}

                      {taxPct > 0 && (
                        <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                          <span>Tax / GST ({taxPct}%):</span>
                          <span className="font-mono font-bold text-slate-900">
                            +{formatCurrencyAmount(taxAmount, country)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between py-2.5 px-3 rounded-xl bg-slate-900 text-white font-black text-sm items-center shadow-md">
                        <span className="uppercase tracking-wider text-xs">Total Amount:</span>
                        <span className="font-mono text-base font-black text-cyan-300">
                          {formatCurrencyAmount(grandTotal, country)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Bar */}
                  <div className="pt-6 border-t-2 border-slate-900 text-center space-y-2">
                    <p className="text-xs font-black tracking-wider text-slate-900 uppercase">
                      {footerMessage}
                    </p>
                    {/* Decorative Barcode */}
                    <div className="flex flex-col items-center justify-center gap-1 opacity-80 pt-1">
                      <div className="flex items-center gap-0.5 h-7">
                        {[4, 2, 6, 1, 3, 5, 2, 4, 1, 6, 3, 2, 5, 1, 4, 2, 6, 3, 1, 5, 2, 4, 1].map(
                          (w, i) => (
                            <div
                              key={i}
                              className="bg-slate-900 h-full"
                              style={{ width: `${w * 1.5}px` }}
                            />
                          )
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-slate-500 tracking-widest font-bold">
                        *{invoiceNumber}*
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TEMPLATE 2: SUPERMARKET THERMAL POS ROLL SLIP */}
              {/* ======================================================== */}
              {template === "thermal-pos" && (
                <div className="space-y-4 font-mono text-xs">
                  {/* Store Header */}
                  <div className="text-center space-y-1 pb-3 border-b-2 border-dashed border-slate-400">
                    <p className="text-base font-black tracking-tight">{storeName.toUpperCase()}</p>
                    <p className="text-[10px]">{storeTagline}</p>
                    <p className="text-[9px] text-slate-600">{storeContact}</p>
                    <div className="pt-1 text-[11px] font-bold">*** CASH RECEIPT ***</div>
                  </div>

                  {/* Meta strip */}
                  <div className="text-[11px] space-y-0.5 pb-2 border-b border-dashed border-slate-400">
                    <div className="flex justify-between">
                      <span>Date: {billDate}</span>
                      <span>Rcpt: #{invoiceNumber.slice(-6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Customer: {customerName}</span>
                      <span>Cashier: POS-01</span>
                    </div>
                  </div>

                  {/* Items list (Fixed table prevents any text squishing or overlapping) */}
                  <div className="py-1">
                    <table className="w-full table-fixed border-collapse text-[11px]">
                      <thead>
                        <tr className="font-bold border-b border-slate-300 text-[10px]">
                          <th className="w-[50%] pb-1 text-left font-bold">ITEM</th>
                          <th className="w-[22%] pb-1 text-center font-bold">QTY</th>
                          <th className="w-[28%] pb-1 text-right font-bold">AMT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dotted divide-slate-200">
                        {billItems.map((item) => (
                          <tr key={item.id} className="py-1">
                            <td className="py-1 pr-1 font-bold truncate max-w-0 text-left align-middle">
                              {item.name}
                            </td>
                            <td className="py-1 text-center whitespace-nowrap text-slate-700 align-middle">
                              {item.quantity} {item.unit && item.unit !== "qty" ? item.unit : "x"}
                            </td>
                            <td className="py-1 text-right font-bold whitespace-nowrap align-middle">
                              {formatCurrencyAmount(getItemTotal(item), country)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="pt-2 border-t-2 border-dashed border-slate-400 space-y-1 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span>Total Items:</span>
                      <span className="font-bold">{totalItemCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Subtotal:</span>
                      <span className="font-bold">{formatCurrencyAmount(subtotal, country)}</span>
                    </div>
                    {discountPct > 0 && (
                      <div className="flex justify-between items-center text-emerald-700">
                        <span>Discount ({discountPct}%):</span>
                        <span className="font-bold">-{formatCurrencyAmount(discountAmount, country)}</span>
                      </div>
                    )}
                    {taxPct > 0 && (
                      <div className="flex justify-between items-center">
                        <span>Tax / GST ({taxPct}%):</span>
                        <span className="font-bold">+{formatCurrencyAmount(taxAmount, country)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center font-black text-sm pt-1 border-t border-slate-900">
                      <span>TOTAL:</span>
                      <span className="font-bold">{formatCurrencyAmount(grandTotal, country)}</span>
                    </div>
                  </div>

                  {/* Thermal Footer */}
                  <div className="text-center pt-3 border-t border-dashed border-slate-400 space-y-1">
                    <p className="font-bold text-[10px]">{footerMessage}</p>
                    <div className="font-mono text-[9px] text-slate-500">
                      INV #{invoiceNumber} · GST NO: 19AAACB2211C1ZO
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TEMPLATE 3: MODERN MINIMAL INVOICE */}
              {/* ======================================================== */}
              {template === "modern-invoice" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-start pb-6 border-b border-slate-200">
                    <div>
                      <h1 className="text-xl font-black text-slate-900 tracking-tight">
                        {storeName}
                      </h1>
                      <p className="text-xs text-slate-500 mt-0.5">{storeTagline}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-slate-400 block uppercase">
                        Invoice
                      </span>
                      <span className="text-sm font-mono font-bold text-slate-900">
                        #{invoiceNumber}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-slate-600">
                    <div>
                      <span className="font-bold text-slate-900 block">Billed To:</span>
                      <span>{customerName}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 block">Date:</span>
                      <span>{billDate}</span>
                    </div>
                  </div>

                  {/* Table */}
                  <table className="w-full text-left text-xs table-fixed border-collapse">
                    <thead>
                      <tr className="border-b border-slate-300 text-slate-400 uppercase text-[10px] font-bold">
                        <th className="py-2">Description</th>
                        <th className="py-2 w-28 text-right whitespace-nowrap">Unit Price</th>
                        <th className="py-2 w-20 text-center whitespace-nowrap">Qty</th>
                        <th className="py-2 w-28 text-right whitespace-nowrap">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {billItems.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2.5 font-bold text-slate-800 truncate max-w-0">
                            {item.name}
                            {item.unit && item.unit !== "qty" && (
                              <span className="ml-1 text-[10px] text-slate-500 font-normal">
                                ({item.unit})
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 text-right font-mono text-slate-600 whitespace-nowrap">
                            {formatCurrencyAmount(getItemUnitPrice(item), country)}
                          </td>
                          <td className="py-2.5 text-center font-mono text-slate-700 whitespace-nowrap">
                            {item.quantity}
                          </td>
                          <td className="py-2.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            {formatCurrencyAmount(getItemTotal(item), country)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Summary */}
                  <div className="flex justify-end pt-4 border-t border-slate-200">
                    <div className="w-56 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal:</span>
                        <span className="font-mono font-bold">
                          {formatCurrencyAmount(subtotal, country)}
                        </span>
                      </div>
                      {discountPct > 0 && (
                        <div className="flex justify-between text-emerald-600">
                          <span>Discount ({discountPct}%):</span>
                          <span className="font-mono font-bold">
                            -{formatCurrencyAmount(discountAmount, country)}
                          </span>
                        </div>
                      )}
                      {taxPct > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Tax ({taxPct}%):</span>
                          <span className="font-mono font-bold">
                            +{formatCurrencyAmount(taxAmount, country)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-black pt-2 border-t border-slate-300 text-slate-900">
                        <span>Total Due:</span>
                        <span className="font-mono">{formatCurrencyAmount(grandTotal, country)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center pt-8 border-t border-slate-200 text-xs text-slate-400">
                    {footerMessage}
                  </div>
                </div>
              )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Strip */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="font-bold text-white font-mono">
              Total: {formatCurrencyAmount(grandTotal, country)}
            </span>
            <span>·</span>
            <span>{billItems.length} items</span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Copy Text */}
            <button
              onClick={handleCopyText}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700"
              title="Copy receipt summary to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            {/* Print / Vector Save as PDF */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700 shadow-sm"
              title="Print directly or save as vector PDF from browser"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Print / Vector PDF</span>
            </button>

            {/* Download CSV Spreadsheet */}
            <button
              onClick={handleDownloadCSV}
              disabled={isExporting}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700 shadow-sm"
              title="Export itemized bill as CSV spreadsheet (Excel / Sheets)"
              id="btn-download-bill-csv"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              <span>CSV Sheet</span>
            </button>

            {/* Download HD PNG (300 DPI) */}
            <button
              onClick={handleDownloadHDImage}
              disabled={isExporting}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700 shadow-sm"
              title="Download 300 DPI High Resolution PNG image (lossless)"
              id="btn-download-bill-png"
            >
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              <span>HD Image (PNG)</span>
            </button>

            {/* Download Ultra-Crisp PDF */}
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/25 active:scale-95 disabled:opacity-50"
              id="btn-download-bill-pdf"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillReceiptModal;
