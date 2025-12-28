import { useEffect, useRef, useState } from "react";

export function useTypewriter(text: string, speed = 30) {
   const [displayed, setDisplayed] = useState("");
   const [typing, setTyping] = useState(false);
   const timeoutRef = useRef<NodeJS.Timeout | null>(null);

   useEffect(() => {
      setDisplayed("");
      setTyping(true);
      let i = 0;

      function type() {
         setDisplayed(text.slice(0, i));
         if (i < text.length) {
            i++;
            timeoutRef.current = setTimeout(type, speed);
         } else {
            setTyping(false);
         }
      }

      type();

      return () => {
         if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
   }, [text, speed]);

   return { displayed, typing };
}

export function Typewriter({ message }: { message: string }) {
   const { displayed } = useTypewriter(message, 24);

   return (
      <p className="text-foreground font-medium leading-relaxed transition-all duration-300 text-sm">
         {displayed}
         <span className="inline-block animate-bounce ml-1">.</span>
      </p>
   );
}
