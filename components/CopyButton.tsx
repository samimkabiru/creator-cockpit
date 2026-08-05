"use client";

import { useState, useCallback } from "react";

interface CopyButtonProps {
  text: string;
  /** Button label. Default: "Copy" */
  label?: string;
  className?: string;
}

/**
 * Reusable copy-to-clipboard button.
 * Shows a brief "Copied!" confirmation then resets.
 */
export default function CopyButton({
  text,
  label = "Copy",
  className = "",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers / non-secure contexts
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      disabled={copied}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "5px 12px",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--border)",
        background: copied ? "var(--accent-good)" : "var(--surface-raised)",
        color: copied ? "#fff" : "var(--text-muted)",
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
        fontWeight: 500,
        letterSpacing: "0.06em",
        cursor: copied ? "default" : "pointer",
        transition: "background 150ms ease, color 150ms ease, border-color 150ms ease",
        whiteSpace: "nowrap",
        userSelect: "none",
      }}
      aria-label={copied ? "Copied to clipboard" : `Copy ${label}`}
    >
      {copied ? (
        <>
          <CheckIcon />
          COPIED
        </>
      ) : (
        <>
          <CopyIcon />
          {label.toUpperCase()}
        </>
      )}
    </button>
  );
}

function CopyIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
