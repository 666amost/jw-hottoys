"use client";

import dynamic from "next/dynamic";
import successAnimation from "@/lib/animations/qris-success.json";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export function QrisSuccessLottie() {
  return (
    <div className="relative mx-auto size-28" aria-hidden="true">
      <span className="absolute inset-3 rounded-full bg-emerald-400/15 blur-xl" />
      <Lottie animationData={successAnimation} autoplay loop={false} className="relative size-full" />
    </div>
  );
}
