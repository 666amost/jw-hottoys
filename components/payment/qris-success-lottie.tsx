"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef } from "react";
import type { LottieRefCurrentProps } from "lottie-react";
import successAnimation from "@/lib/animations/qris-success.json";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export function QrisSuccessLottie() {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const playSuccessAnimation = useCallback(() => {
    const animation = lottieRef.current;
    if (!animation) return;

    animation.setSubframe(false);
    animation.setSpeed(1.15);
    animation.playSegments([0, 60], true);
  }, []);

  return (
    <div className="relative mx-auto size-28" aria-hidden="true">
      <span className="absolute inset-3 rounded-full bg-emerald-400/15 blur-xl" />
      <Lottie
        lottieRef={lottieRef}
        animationData={successAnimation}
        autoplay={false}
        loop={false}
        onDOMLoaded={playSuccessAnimation}
        rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
        className="relative size-full"
      />
    </div>
  );
}
