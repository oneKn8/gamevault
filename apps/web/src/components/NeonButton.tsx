"use client";

import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "highlight";

const variantStyles: Record<Variant, string> = {
  primary: "border-accent bg-accent text-white hover:bg-accent-hover",
  secondary: "border-border-highlight bg-transparent text-text-secondary hover:text-text hover:border-text-muted",
  highlight: "border-secondary bg-secondary text-black font-semibold hover:bg-secondary-hover",
};

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function NeonButton({
  variant = "primary",
  className = "",
  children,
  ...props
}: NeonButtonProps) {
  return (
    <button
      className={`rounded-md border px-4 py-2 text-sm font-medium transition-all ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
