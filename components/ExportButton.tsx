"use client";

import { useCallback } from "react";
import { assetsToCsv, downloadCsv } from "@/lib/csv";
import type { Asset } from "@/lib/types";

interface ExportButtonProps {
  results: Asset[];
  query?: string | null;
  disabled?: boolean;
}

/**
 * Export button that downloads the current search results as CSV.
 */
export default function ExportButton({
  results,
  query = null,
  disabled = false,
}: ExportButtonProps) {
  const handleExport = useCallback(() => {
    if (results.length === 0) return;

    const csv = assetsToCsv(results);
    const slug =
      query
        ?.trim()
        .slice(0, 40)
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-") || "export";
    const date = new Date().toISOString().slice(0, 10);
    const filename = `sightline-${slug}-${date}.csv`;
    downloadCsv(csv, filename);
  }, [results, query]);

  const isDisabled = disabled || results.length === 0;

  return (
    <button
      type="button"
      className="export-button"
      onClick={handleExport}
      disabled={isDisabled}
      title={
        results.length === 0
          ? "No data to export"
          : `Export ${results.length.toLocaleString()} results as CSV`
      }
      aria-label="Export results as CSV"
    >
      <svg
        className="export-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      <span className="export-text">Export CSV</span>
    </button>
  );
}
