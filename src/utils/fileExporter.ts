import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

export interface ExportFileOptions {
  filename: string;
  data: string | Blob | ArrayBuffer | Uint8Array;
  mimeType?: string;
  shareTitle?: string;
  shareText?: string;
  dialogTitle?: string;
}

export interface ExportResult {
  success: boolean;
  method: "web_download" | "capacitor_share" | "capacitor_filesystem" | "fallback";
  message: string;
  filename: string;
  error?: string;
}

// Common MIME types and default extensions
export const MIME_CONFIGS: Record<string, { ext: string; isBinary: boolean }> = {
  "application/pdf": { ext: "pdf", isBinary: true },
  "image/png": { ext: "png", isBinary: true },
  "image/jpeg": { ext: "jpg", isBinary: true },
  "image/jpg": { ext: "jpg", isBinary: true },
  "image/webp": { ext: "webp", isBinary: true },
  "text/plain": { ext: "txt", isBinary: false },
  "text/csv": { ext: "csv", isBinary: false },
  "application/json": { ext: "json", isBinary: false },
  "text/calendar": { ext: "ics", isBinary: false },
};

export const EXTENSION_MIME_MAP: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  txt: "text/plain",
  csv: "text/csv",
  json: "application/json",
  ics: "text/calendar",
};

/**
 * Check if the current runtime is running inside native Capacitor (Android APK or iOS).
 */
export function isNativePlatform(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * Sanitize filename by removing illegal filesystem characters.
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== "string") {
    return `export_${Date.now()}`;
  }
  // Remove slashes, colons, wildcards, quotes, etc.
  return filename.replace(/[/\\?%*:|"<>]/g, "_").trim();
}

/**
 * Ensures filename has the correct extension matching its MIME type.
 */
export function ensureFilenameExtension(filename: string, mimeType: string): string {
  const sanitized = sanitizeFilename(filename);
  const parts = sanitized.split(".");
  const currentExt = parts.length > 1 ? parts.pop()?.toLowerCase() : "";

  const config = MIME_CONFIGS[mimeType];
  const expectedExt = config ? config.ext : "bin";

  if (!currentExt) {
    return `${sanitized}.${expectedExt}`;
  }

  // If extension is already valid for this mime type, keep it
  if (EXTENSION_MIME_MAP[currentExt] === mimeType) {
    return sanitized;
  }

  // If extension is known but different, check if mimeType was default
  return `${parts.join(".")}.${expectedExt}`;
}

/**
 * Detect MIME type from filename extension or data type.
 */
export function inferMimeType(filename: string, explicitMime?: string): string {
  if (explicitMime && explicitMime.trim()) {
    return explicitMime.trim().toLowerCase();
  }
  const parts = filename.split(".");
  if (parts.length > 1) {
    const ext = parts[parts.length - 1].toLowerCase();
    if (EXTENSION_MIME_MAP[ext]) {
      return EXTENSION_MIME_MAP[ext];
    }
  }
  return "text/plain";
}

/**
 * Converts a Blob to a raw base64 string (without the data URL prefix).
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read binary Blob data"));
    reader.onload = () => {
      const res = reader.result as string;
      // Strip data:*/*;base64, prefix
      const commaIdx = res.indexOf(",");
      if (commaIdx !== -1) {
        resolve(res.slice(commaIdx + 1));
      } else {
        resolve(res);
      }
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Converts ArrayBuffer to raw base64 string.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts base64 string to a Blob for web browser downloading.
 */
function base64ToBlob(base64Data: string, mimeType: string): Blob {
  try {
    let clean = base64Data;
    // If it's a data URI (e.g. data:application/pdf;base64,... or data:application/pdf;filename=...;base64,...),
    // strip everything up to and including the first comma
    if (clean.startsWith("data:")) {
      const commaIdx = clean.indexOf(",");
      if (commaIdx !== -1) {
        clean = clean.slice(commaIdx + 1);
      }
    }

    // Strip all whitespaces, line breaks, and carriage returns
    clean = clean.replace(/[\s\r\n]+/g, "");

    // Normalize URL-safe base64 characters if present
    clean = clean.replace(/-/g, "+").replace(/_/g, "/");

    // Ensure valid base64 padding
    const remainder = clean.length % 4;
    if (remainder > 0) {
      clean += "=".repeat(4 - remainder);
    }

    const binaryString = atob(clean);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  } catch (err) {
    console.warn("base64ToBlob decoding issue, falling back to direct Blob wrapping:", err);
    return new Blob([base64Data], { type: mimeType });
  }
}

/**
 * Standard browser file download using programmatic anchor click with Blob ObjectURL.
 */
function downloadInBrowser(filename: string, blob: Blob): ExportResult {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.style.display = "none";
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();

  // Cleanup after a slight delay to allow browser to trigger save dialog
  setTimeout(() => {
    try {
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch {
      // Ignore cleanup error
    }
  }, 1000);

  return {
    success: true,
    method: "web_download",
    message: `Downloaded "${filename}" successfully.`,
    filename,
  };
}

/**
 * Universal export function that works in both standard web browsers and Capacitor Android APKs.
 * - On Web: initiates direct browser file download.
 * - On Native Android (Capacitor): writes file with correct MIME & extension to Cache/Documents
 *   and invokes the native Android Share & Save-to-Device intent.
 */
export async function exportFile(options: ExportFileOptions): Promise<ExportResult> {
  const {
    data,
    shareTitle,
    shareText,
    dialogTitle,
  } = options;

  // 1. Validate empty data
  if (data === null || data === undefined) {
    return {
      success: false,
      method: "fallback",
      message: "No content to export. File data is empty.",
      filename: options.filename || "export",
      error: "EMPTY_DATA",
    };
  }

  if (typeof data === "string" && data.trim().length === 0) {
    return {
      success: false,
      method: "fallback",
      message: "Cannot export empty content. Please generate or enter data first.",
      filename: options.filename || "export",
      error: "EMPTY_DATA",
    };
  }

  if (data instanceof Blob && data.size === 0) {
    return {
      success: false,
      method: "fallback",
      message: "Generated file is empty (0 bytes).",
      filename: options.filename || "export",
      error: "EMPTY_BLOB",
    };
  }

  // 2. Resolve MIME type & filename
  const mimeType = inferMimeType(options.filename, options.mimeType);
  const filename = ensureFilenameExtension(options.filename, mimeType);
  const isBinary = MIME_CONFIGS[mimeType]?.isBinary ?? (mimeType.startsWith("image/") || mimeType.startsWith("application/pdf"));

  // 3. Native Capacitor Handling (Android APK & iOS)
  if (isNativePlatform()) {
    try {
      let rawBase64Data: string;
      let textContent: string | null = null;

      if (typeof data === "string") {
        if (data.startsWith("data:") && data.includes(";base64,")) {
          // Data URI
          rawBase64Data = data.slice(data.indexOf(",") + 1);
        } else if (isBinary) {
          // Plain base64 string
          rawBase64Data = data;
        } else {
          // Plain text content (TXT, CSV, JSON)
          textContent = data;
          rawBase64Data = btoa(unescape(encodeURIComponent(data)));
        }
      } else if (data instanceof Blob) {
        rawBase64Data = await blobToBase64(data);
      } else if (data instanceof ArrayBuffer) {
        rawBase64Data = arrayBufferToBase64(data);
      } else if (data instanceof Uint8Array) {
        rawBase64Data = arrayBufferToBase64(data.buffer);
      } else {
        throw new Error("Unsupported data format for export.");
      }

      // Write file to Cache directory (clean, safe, and shareable without root permissions on all Android versions)
      let writeFileResult;
      if (textContent !== null) {
        writeFileResult = await Filesystem.writeFile({
          path: filename,
          data: textContent,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });
      } else {
        writeFileResult = await Filesystem.writeFile({
          path: filename,
          data: rawBase64Data,
          directory: Directory.Cache,
        });
      }

      const fileUri = writeFileResult.uri;

      // Invoke Android's Native Sharing & Save-to-Disk interface
      try {
        await Share.share({
          title: shareTitle || filename,
          text: shareText || `Here is ${filename}`,
          files: [fileUri],
          dialogTitle: dialogTitle || `Save or Share ${filename}`,
        });

        return {
          success: true,
          method: "capacitor_share",
          message: `"${filename}" ready in Android share sheet! Choose "Save to device", Google Drive, or your preferred app.`,
          filename,
        };
      } catch (shareErr: any) {
        // If user cancelled the share dialog, treat as graceful completion
        if (shareErr?.message && /cancel/i.test(shareErr.message)) {
          return {
            success: true,
            method: "capacitor_share",
            message: `Export dialog closed.`,
            filename,
          };
        }
        console.warn("Share files intent error, trying url fallback:", shareErr);

        try {
          await Share.share({
            title: shareTitle || filename,
            text: shareText || `Here is ${filename}`,
            url: fileUri,
            dialogTitle: dialogTitle || `Save or Share ${filename}`,
          });

          return {
            success: true,
            method: "capacitor_share",
            message: `"${filename}" ready in Android share sheet!`,
            filename,
          };
        } catch (urlShareErr: any) {
          if (urlShareErr?.message && /cancel/i.test(urlShareErr.message)) {
            return {
              success: true,
              method: "capacitor_share",
              message: `Export dialog closed.`,
              filename,
            };
          }
          console.warn("All share intents failed:", urlShareErr);
        }
      }

      return {
        success: true,
        method: "capacitor_filesystem",
        message: `File saved successfully to app storage: ${filename}`,
        filename,
      };
    } catch (nativeErr: any) {
      console.error("Native Capacitor export error, attempting browser fallback:", nativeErr);
      // Fallback to web download if native filesystem or share fails unexpectedly
    }
  }

  // 4. Web Browser Handling
  try {
    let blob: Blob;

    if (data instanceof Blob) {
      blob = data;
    } else if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
      blob = new Blob([data], { type: mimeType });
    } else if (typeof data === "string") {
      if (data.startsWith("data:") && data.includes(";base64,")) {
        blob = base64ToBlob(data, mimeType);
      } else if (isBinary) {
        blob = base64ToBlob(data, mimeType);
      } else {
        blob = new Blob([data], { type: `${mimeType};charset=utf-8` });
      }
    } else {
      throw new Error("Unrecognized data format.");
    }

    return downloadInBrowser(filename, blob);
  } catch (webErr: any) {
    console.error("Browser download failed:", webErr);
    return {
      success: false,
      method: "fallback",
      message: `Failed to download "${filename}": ${webErr?.message || "Unknown error"}`,
      filename,
      error: webErr?.message || "DOWNLOAD_ERROR",
    };
  }
}

/**
 * Convenience helper to export plain text (such as Calculator Suite Logs).
 */
export async function exportTextFile(
  filename: string,
  content: string,
  shareTitle = "Suite Logs Export"
): Promise<ExportResult> {
  return exportFile({
    filename,
    data: content,
    mimeType: "text/plain",
    shareTitle,
    shareText: `Exported calculation logs: ${filename}`,
    dialogTitle: "Save or Share Calculation Logs",
  });
}

/**
 * Convenience helper to export CSV spreadsheets (such as Bill breakdowns or EMI schedules).
 */
export async function exportCsvFile(
  filename: string,
  csvContent: string,
  shareTitle = "Spreadsheet Report Export"
): Promise<ExportResult> {
  return exportFile({
    filename,
    data: csvContent,
    mimeType: "text/csv",
    shareTitle,
    shareText: `Spreadsheet data: ${filename}`,
    dialogTitle: "Save or Share CSV Report",
  });
}

/**
 * Convenience helper to export PDF documents.
 */
export async function exportPdfFile(
  filename: string,
  pdfData: string | Blob | ArrayBuffer,
  shareTitle = "Bill & Receipt PDF"
): Promise<ExportResult> {
  return exportFile({
    filename,
    data: pdfData,
    mimeType: "application/pdf",
    shareTitle,
    shareText: `Itemized Bill PDF: ${filename}`,
    dialogTitle: "Save or Share Bill PDF",
  });
}

/**
 * Convenience helper to export high-definition images (PNG/JPG).
 */
export async function exportImageFile(
  filename: string,
  imageData: string | Blob,
  mimeType = "image/png",
  shareTitle = "Bill HD Image"
): Promise<ExportResult> {
  return exportFile({
    filename,
    data: imageData,
    mimeType,
    shareTitle,
    shareText: `Receipt Image: ${filename}`,
    dialogTitle: "Save or Share Receipt Image",
  });
}

/**
 * Helper to build a properly escaped CSV string from headers and rows.
 */
export function buildCsvContent(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const escapeCell = (cell: any): string => {
    if (cell === null || cell === undefined) return '""';
    const str = String(cell);
    if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  const headerRow = headers.map(escapeCell).join(",");
  const dataRows = rows.map((row) => row.map(escapeCell).join(","));

  return [headerRow, ...dataRows].join("\r\n");
}
