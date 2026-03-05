"use client";

import { type ButtonHTMLAttributes } from "react";

type Variant = "blue" | "cyan" | "pink" | "yellow" | "green" | "purple";

const variantStyles: Record<Variant, string> = {
  blue: "border-neon-blue/40 bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 hover:shadow-neon-blue",
  cyan: "border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20 hover:shadow-neon-cyan",
  pink: "border-neon-pink/40 bg-neon-pink/10 text-neon-pink hover:bg-neon-pink/20 hover:shadow-neon-pink",
  yellow: "border-neon-yellow/40 bg-neon-yellow/10 text-neon-yellow hover:bg-neon-yellow/20 hover:shadow-neon-yellow",
  green: "border-neon-green/40 bg-neon-green/10 text-neon-green hover:bg-neon-green/20 hover:shadow-neon-green",
  purple: "border-neon-purple/40 bg-neon-purple/10 text-neon-purple hover:bg-neon-purple/20 hover:shadow-neon-purple",
};

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function NeonButton({
  variant = "blue",
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
