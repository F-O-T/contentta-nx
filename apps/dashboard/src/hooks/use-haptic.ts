import { useCallback } from "react";

type HapticPattern = "light" | "medium" | "heavy" | "success" | "error";

const patterns: Record<HapticPattern, number | number[]> = {
   error: [50, 100, 50],
   heavy: 50,
   light: 10,
   medium: 25,
   success: [10, 50, 10],
};

export function useHaptic() {
   const trigger = useCallback((pattern: HapticPattern = "light") => {
      if (!navigator.vibrate) return false;
      return navigator.vibrate(patterns[pattern]);
   }, []);

   return { trigger };
}
