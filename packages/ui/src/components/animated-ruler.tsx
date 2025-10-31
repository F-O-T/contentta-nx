"use client";

import { cn } from "@packages/ui/lib/utils";
import { motion } from "motion/react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

export type UsageRulerProps = {
   className?: string;
   min?: number;
   max?: number;
   defaultValue?: number;
   legend?: string;
   value?: number;
   displayMax?: number;
};

function clamp(v: number, min: number, max: number) {
   return Math.min(Math.max(v, min), max);
}

function formatNumber(n: number) {
   return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
      n,
   );
}

export function UsageRuler({
   className,
   min = 0,
   max = 10000,
   defaultValue = 5000,
   legend,
   value,
   displayMax,
}: UsageRulerProps) {
   const [currentValue] = useState(clamp(defaultValue, min, max));
   const finalValue =
      value !== undefined ? clamp(value, min, max) : currentValue;

   // Use displayMax for visual representation, but keep real max for labels
   const visualMax = displayMax && displayMax < max ? displayMax : max;
   const visualValue = Math.min(finalValue, visualMax);
   const trackRef = useRef<HTMLDivElement | null>(null);
   const [trackWidth, setTrackWidth] = useState(0);
   const [posPct, setPosPct] = useState(
      () => ((visualValue - min) / (visualMax - min)) * 100,
   );

   // measure track width for ticks
   useLayoutEffect(() => {
      const el = trackRef.current;
      if (!el) return;
      const update = () => setTrackWidth(el.clientWidth);
      update();
      const ro = new ResizeObserver(update);
      ro.observe(el);
      window.addEventListener("resize", update);
      return () => {
         ro.disconnect();
         window.removeEventListener("resize", update);
      };
   }, []);

   // keep visual position in sync with external value changes (controlled)
   useLayoutEffect(() => {
      const pctFromValue = ((visualValue - min) / (visualMax - min)) * 100;
      setPosPct(clamp(pctFromValue, 0, 100));
   }, [visualValue, min, visualMax]);

   const tickCount = useMemo(
      () => Math.max(80, Math.floor((trackWidth || 1) / 6)),
      [trackWidth],
   );
   const currentTickIndexFloat = useMemo(
      () => (posPct / 100) * (tickCount - 1),
      [posPct, tickCount],
   );

   // Positions for labels - show real values but position them at visual scale endpoints
   const firstThousand = useMemo(() => Math.ceil(min / 1000) * 1000, [min]);
   const lastThousand = useMemo(() => Math.floor(max / 1000) * 1000, [max]);
   const visualLastThousand = useMemo(
      () => Math.floor(visualMax / 1000) * 1000,
      [visualMax],
   );
   const startLabel = `${formatNumber(firstThousand)}`;
   // End label should show the real max since that's what users care about
   const endLabel = `${formatNumber(lastThousand)}`;

   return (
      <div className={cn("w-full", className)}>
         <div>
            <div className="relative h-12 select-none" ref={trackRef}>
               {/* Animated ruler ticks */}
               <div className="pointer-events-none absolute inset-0">
                  {Array.from({ length: tickCount }).map((_, i) => {
                     const left = (i / (tickCount - 1)) * 100;
                     const distFloat = Math.abs(currentTickIndexFloat - i);
                     const base = 10;
                     const peak = 12;
                     const spread = 2;
                     const factor = Math.max(0, 1 - distFloat / spread);
                     const height = base + peak * factor;
                     let color =
                        i <= currentTickIndexFloat
                           ? "bg-primary"
                           : "bg-muted-foreground/40";
                     if (distFloat < 0.5) color = "bg-primary";
                     else if (distFloat < 1.5) color = "bg-primary/90";
                     else if (distFloat < 2.5) color = "bg-primary/70";
                     const widthClass =
                        distFloat < 0.5
                           ? "w-[3px]"
                           : distFloat < 3.5
                             ? "w-[2px]"
                             : "w-px";
                     return (
                        <motion.div
                           animate={{ height }}
                           className={`absolute top-1/2 -translate-y-full ${widthClass} rounded-full ${color}`}
                           key={i}
                           style={{ left: `${left}%` }}
                           transition={{
                              damping: 28,
                              stiffness: 260,
                              type: "spring",
                           }}
                        />
                     );
                  })}
               </div>

               {/* Clickable dots every 1000 credits */}
               <div className="pointer-events-auto absolute inset-0 px-1">
                  {(() => {
                     const first = Math.ceil(min / 1000) * 1000;
                     const dots: React.ReactNode[] = [];
                     // Create fewer dots for cleaner appearance
                     const numberOfDots = Math.min(
                        8,
                        Math.floor(visualLastThousand / 5000) + 1,
                     );
                     const dotStep = Math.max(
                        1000,
                        Math.floor(visualLastThousand / numberOfDots),
                     );
                     for (
                        let v = first;
                        v <= visualLastThousand;
                        v += dotStep
                     ) {
                        const t = (v - min) / (visualMax - min);
                        const left = `${t * 100}%`;
                        // Check if this dot should be active based on actual consumed value
                        const isActive = Math.round(finalValue) >= v;
                        dots.push(
                           <div
                              className={`absolute rounded-full ${isActive ? "bg-primary" : "bg-muted-foreground/70"}`}
                              key={`dot-${v}`}
                              style={{
                                 height: "4px",
                                 left,
                                 top: "calc(50% + 14px)",
                                 transform: "translateX(-50%)",
                                 width: "4px",
                              }}
                           />,
                        );
                     }
                     return dots;
                  })()}
               </div>
            </div>

            <div className="flex justify-between text-xs text-muted-foreground ">
               <span>{startLabel}</span>
               <span>{endLabel}</span>
            </div>

            {legend && (
               <div className="text-center text-xs text-muted-foreground mt-4">
                  {legend} {formatNumber(finalValue)}
               </div>
            )}
         </div>
      </div>
   );
}
