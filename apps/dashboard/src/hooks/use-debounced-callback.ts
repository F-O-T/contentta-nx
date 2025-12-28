import { useCallback, useEffect, useRef } from "react";

export function useDebouncedCallback<T extends unknown[]>(
   callback: (...args: T) => void,
   delay: number,
): (...args: T) => void {
   const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
   const callbackRef = useRef(callback);

   useEffect(() => {
      callbackRef.current = callback;
   }, [callback]);

   return useCallback(
      (...args: T) => {
         if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
         }

         timeoutRef.current = setTimeout(() => {
            callbackRef.current(...args);
         }, delay);
      },
      [delay],
   );
}
