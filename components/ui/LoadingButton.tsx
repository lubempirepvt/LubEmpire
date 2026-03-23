"use client";

import React from "react";

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  loadingText?: string;
  defaultText?: string | React.ReactNode;
  variant?: "primary" | "danger" | "secondary" | "ghost";
  children?: React.ReactNode;
}

export default function LoadingButton({
  isLoading,
  loadingText = "Processing...",
  defaultText,
  variant = "primary",
  className = "",
  disabled,
  children,
  ...props
}: LoadingButtonProps) {
  // Base styling for all buttons
  const baseStyle =
    "flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed";

  // Variant styling (Primary Gold, Danger Red, Secondary Gray, Transparent Ghost)
  const variants = {
    primary:
      "bg-[var(--lub-gold)] hover:bg-yellow-500 text-white shadow-[var(--lub-gold)]/20 shadow-lg px-4 py-2.5",
    danger:
      "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20 shadow-lg px-4 py-2.5",
    secondary:
      "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5",
    ghost:
      "bg-transparent text-gray-600 hover:bg-gray-100 shadow-none border-none px-4 py-2.5",
  };

  // Allow using either <LoadingButton defaultText="Save" /> OR <LoadingButton>Save</LoadingButton>
  const content = children || defaultText;

  return (
    <button
      {...props}
      disabled={isLoading || disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {isLoading ? (
        <>
          <svg
            className="w-4 h-4 animate-spin text-current shrink-0"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {loadingText}
        </>
      ) : (
        content
      )}
    </button>
  );
}
