import type { Asset } from "./types";

/** Escape a CSV cell: wrap in quotes and double internal quotes */
function escapeCsvCell(value: string): string {
  const str = String(value ?? "");
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert an array of assets to a CSV string.
 * Columns: id, name, type, operator, lat, lon, tags (JSON).
 */
export function assetsToCsv(assets: Asset[]): string {
  const headers = ["id", "name", "type", "operator", "lat", "lon", "tags"];
  const rows = assets.map((a) => [
    escapeCsvCell(a.id),
    escapeCsvCell(a.name),
    escapeCsvCell(a.type),
    escapeCsvCell(a.operator ?? ""),
    String(a.lat),
    String(a.lon),
    escapeCsvCell(JSON.stringify(a.tags)),
  ]);
  const headerLine = headers.join(",");
  const dataLines = rows.map((row) => row.join(","));
  return [headerLine, ...dataLines].join("\r\n");
}

/**
 * Trigger a file download for a CSV string.
 */
export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
