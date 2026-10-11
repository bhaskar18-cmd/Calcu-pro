# High-Definition Bill & Invoice Generator (BHK Grocery App Format)

Generate, preview, and download ultra-crisp, zero-quality-drop grocery bills matching the exact "BHK Grocery App" store invoice format provided, with itemized rates, quantities, and dual PDF / high-res export.

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your uploaded sample bill format:
> - **Visual Layout**: Faithfully matches the uploaded "BHK Grocery App" invoice layout:
>   - **Header**: Vibrant 3D "BHK Grocery App" header branding with leaf emblem, "Your Daily Grocery Partner" cursive script, and supermarket storefront graphic.
>   - **Invoice Badge**: Centered royal blue "BILL / INVOICE" pill badge.
>   - **Metadata Row**: Clean horizontal bar with Date and Customer Name (defaults to "Bhaskar Karmakar", editable in the preview).
>   - **Itemized Table**: Deep blue rounded table header (`No.`, `Item Name`, `Price`, `Quantity`, `Total Price`) with crisp row lines and monospace currency numbers.
>   - **Bottom Summary**: Left-side ice-blue summary card displaying Total Items count, Total Quantity, Subtotal, and a bold Grand Total highlight box; right-side "Thank You! for using BHK Grocery App" script with grocery bag graphic.
> - **Zero Quality Drop (Crystal Clear Export)**:
>   - **300 DPI / 3× Scale Canvas Capture**: Multiplies canvas rendering resolution by 3× to prevent any blurriness or compression artifacts when generating PDF and PNG downloads.
>   - **Native Lossless Print Vector**: Includes a browser print option (`window.print()`) that renders the invoice directly via native vector CSS/SVG at infinite print resolution.
>   - **Dual Format Support**: One-click **Download PDF** and **Download HD Image (PNG)** plus **Print Invoice**.

- **Confirmed Decision 1**: Adopt the uploaded BHK Grocery App invoice format as the primary bill template.
- **Confirmed Decision 2**: Ensure zero quality loss through 3× supersampling (300 DPI equivalent) for PDF and lossless vector browser printing.
- **Customizable Fields in Preview**: Customer Name, Store Title/Tagline, and Date can be edited directly before downloading.

---

## 1. Overview & Core Concept

- **What It Does**: Adds an intuitive "Download Bill" feature to both the grocery list details view and each list card. Opening the bill generator presents an exact, live-rendered invoice matching the user's BHK Grocery App bill format. The user can adjust customer name and date, then download a high-definition PDF or image with zero degradation in visual quality.
- **Target Audience**: Grocery shoppers, budget trackers, and household managers who want crisp, store-grade purchase invoices to archive, print, or share.
- **Key Value**: Delivers professional, supermarket-standard invoices with automated unit price and total calculations, eliminating manual math while maintaining ultra-sharp text and graphics.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Triggering Bill Generation**:
   - In the active list detail view, a prominent **"Download Bill"** button (`Receipt` icon) sits in the top action strip.
   - On the "All Lists" hub view, each list card includes a quick **"Bill"** action button.
2. **Interactive Bill Customizer & Live Invoice**:
   - Clicking either button opens the full-screen **Bill & Invoice Modal**:
     - **Controls Toolbar (Top)**:
       - Customer Name input (prefilled with "Bhaskar Karmakar" or user's preference).
       - Date picker (prefilled with the list date).
       - Store branding toggles (BHK Grocery App branding or custom title).
       - Action buttons: **Download PDF (HD)**, **Download Image (PNG)**, **Print Invoice**, and **Close**.
     - **Invoice Canvas (Center)**:
       - Displays the full BHK Grocery App invoice at exact print proportions.
       - Ultra-sharp typography: Plus Jakarta Sans / Outfit for headings and clean monospace tabular numerals for prices and quantities.
       - Header features the BHK Grocery App 3D logo and storefront illustration.
       - Blue table with `No.`, `Item Name` (with quantity/unit in brackets, e.g. `Rice (1 kg)`), `Price`, `Quantity`, and `Total Price`.
       - Bottom left card showing `Total Items`, `Total Quantity`, `Subtotal`, and bold `Grand Total`.
       - Bottom right showing `Thank You! for using BHK Grocery App` and grocery bag artwork.
3. **Exporting with Zero Quality Drop**:
   - User clicks **"Download PDF"**: A high-density canvas renders at 3× resolution (300 DPI), converted into a crisp PDF file named `BHK-Grocery-Bill-[Date].pdf`.
   - User clicks **"Print Invoice"**: Triggers native browser print dialog with print-optimized vector CSS, producing pixel-perfect physical or digital printouts.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: 3× Supersampling Resolution for Canvas-to-PDF**
  - *Chosen Approach*: Configure `dom-to-image-more` with `scale: 3` and high-density canvas context before generating the jsPDF document.
  - *Why*: Standard 1× web canvas capture produces blurry 72–96 DPI images when converted to PDF. 3× supersampling delivers razor-sharp 300 DPI output with zero pixelation or artifacting.
  - *Alternatives Considered*: Standard 1× capture (rejected due to quality drop).
- **Decision 2: Direct Vector Browser Print Capability**
  - *Chosen Approach*: Implement a dedicated `@media print` layout stylesheet so users can use native browser printing directly to printer or system PDF with 100% vector fidelity.
  - *Why*: Guarantees crisp, unrasterized vector text at any scale.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                       GroceryList.tsx                       │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Active List Header    │       │ List Cards (Hub)      │  │
│  │ [Download Bill Button]│       │ [Quick Bill Button]   │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
└──────────────┼───────────────────────────────┼──────────────┘
               ▼                               ▼
       ┌───────────────────────────────────────────────┐
       │               BillInvoiceModal.tsx            │
       │  ┌─────────────────────────────────────────┐  │
       │  │ Top Controls Bar:                       │  │
       │  │ - Customer Name ("Bhaskar Karmakar")    │  │
       │  │ - Date Picker                           │  │
       │  │ - [Download PDF (HD)] [PNG] [Print]     │  │
       │  └────────────────────┬────────────────────┘  │
       │                       ▼                       │
       │  ┌─────────────────────────────────────────┐  │
       │  │ BHK Grocery App Bill Format:            │  │
       │  │ 1. 3D Logo & Storefront Header          │  │
       │  │ 2. "BILL / INVOICE" Badge               │  │
       │  │ 3. Date & Customer Bar                  │  │
       │  │ 4. Itemized Blue Table (No, Item, Qty,  │  │
       │  │    Unit Price, Total Price)             │  │
       │  │ 5. Summary Card (Items, Qty, Subtotal,  │  │
       │  │    Grand Total) & Thank You Graphic     │  │
       │  └────────────────────┬────────────────────┘  │
       │                       ▼                       │
       │  ┌─────────────────────────────────────────┐  │
       │  │ Zero-Quality-Drop Export Engine:        │  │
       │  │ - 3× Device Pixel Ratio Rendering       │  │
       │  │ - jsPDF High-DPI Output                 │  │
       │  │ - Pure Vector @media print Stylesheet   │  │
       │  └─────────────────────────────────────────┘  │
       └───────────────────────────────────────────────┘
```

### Calculation Rules

- **Unit Price Calculation**:
  - `Unit Price = Item Total Price / Quantity` (or user's direct price if entered).
  - Both unit price and item total price are formatted to 2 decimal places.
- **Aggregate Summary**:
  - `Total Items`: Number of distinct items in the list.
  - `Total Quantity`: Sum of all individual item quantities.
  - `Subtotal`: Sum of all item total prices.
  - `Grand Total`: Final payable amount formatted cleanly (matching template styling).
