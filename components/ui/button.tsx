import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
};

export function Button({
  asChild,
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return (
    <Component
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-extrabold transition outline-none focus-visible:ring-2 focus-visible:ring-[#1746a2] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        {
          "bg-[#e21b2d] text-white shadow-[0_12px_32px_rgba(226,27,45,.22)] hover:bg-[#c91425]":
            variant === "primary",
          "border border-black/15 bg-white text-[#111217] hover:border-black/35 hover:bg-[#f5f5f2]":
            variant === "secondary",
          "text-slate-700 hover:bg-black/5": variant === "ghost",
          "bg-red-600 text-white hover:bg-red-500": variant === "danger",
          "h-9 px-4 text-sm": size === "sm",
          "h-11 px-5 text-sm": size === "md",
          "h-13 px-7 text-base": size === "lg",
          "size-10 p-0": size === "icon",
        },
        className,
      )}
      {...props}
    />
  );
}
