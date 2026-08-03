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
        "inline-flex items-center justify-center gap-2 rounded-xl font-extrabold transition outline-none focus-visible:ring-2 focus-visible:ring-[#f7b718] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        {
          "bg-[#f7b718] text-[#082f3d] shadow-[0_12px_32px_rgba(247,183,24,.24)] hover:bg-[#ffc83d]":
            variant === "primary",
          "border border-slate-200 bg-white text-[#082f3d] hover:border-[#0d5772]/30 hover:bg-slate-50":
            variant === "secondary",
          "text-slate-700 hover:bg-[#eaf2f4]": variant === "ghost",
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
