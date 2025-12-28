"use client";

import {
   InputGroup,
   InputGroupAddon,
   InputGroupInput,
   InputGroupText,
} from "@packages/ui/components/input-group";
import * as React from "react";

interface MoneyInputProps
   extends Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      "onChange" | "value"
   > {
   value?: number | string;
   onChange?: (value: number | undefined) => void;
   placeholder?: string;
   className?: string;
   valueInCents?: boolean;
   debounceMs?: number;
}

function useDebouncedCallback<T extends unknown[]>(
   callback: (...args: T) => void,
   delay: number,
): (...args: T) => void {
   const timeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);
   const callbackRef = React.useRef(callback);

   React.useEffect(() => {
      callbackRef.current = callback;
   }, [callback]);

   return React.useCallback(
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

const MAX_CENTS = 999999999999;

function formatCentsToDisplay(cents: number): string {
   if (cents === 0) {
      return "";
   }

   const reais = cents / 100;
   const parts = reais.toFixed(2).split(".");
   const integerPart = parts[0] || "0";
   const decimalPart = parts[1] || "00";

   const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

   return `${formattedInteger},${decimalPart}`;
}

function extractDigits(str: string): string {
   return str.replace(/\D/g, "");
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
   (
      {
         value,
         onChange,
         placeholder = "0,00",
         className,
         valueInCents = true,
         debounceMs = 0,
         ...props
      },
      ref,
   ) => {
      const [rawCents, setRawCents] = React.useState<number>(0);
      const inputRef = React.useRef<HTMLInputElement | null>(null);
      const isInternalChange = React.useRef(false);

      const debouncedOnChange = useDebouncedCallback<[number | undefined]>(
         (value: number | undefined) => {
            onChange?.(value);
         },
         debounceMs,
      );

      const emitChange = React.useCallback(
         (cents: number) => {
            const finalValue = valueInCents ? cents : cents / 100;
            if (debounceMs > 0) {
               debouncedOnChange(cents === 0 ? undefined : finalValue);
            } else {
               onChange?.(cents === 0 ? undefined : finalValue);
            }
         },
         [valueInCents, debounceMs, debouncedOnChange, onChange],
      );

      React.useEffect(() => {
         if (isInternalChange.current) {
            isInternalChange.current = false;
            return;
         }

         if (value === undefined || value === "" || value === 0) {
            setRawCents(0);
            return;
         }

         const numValue =
            typeof value === "string" ? Number.parseFloat(value) : value;

         if (Number.isNaN(numValue)) {
            setRawCents(0);
            return;
         }

         const cents = valueInCents
            ? Math.round(numValue)
            : Math.round(numValue * 100);
         setRawCents(cents);
      }, [value, valueInCents]);

      const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
         const input = e.target as HTMLInputElement;
         const inputValue = input.value;

         const digits = extractDigits(inputValue);

         if (digits === "") {
            isInternalChange.current = true;
            setRawCents(0);
            emitChange(0);
            return;
         }

         let cents = Number.parseInt(digits, 10);

         if (Number.isNaN(cents)) {
            return;
         }

         if (cents > MAX_CENTS) {
            cents = MAX_CENTS;
         }

         isInternalChange.current = true;
         setRawCents(cents);
         emitChange(cents);
      };

      const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
         const allowedKeys = [
            "Backspace",
            "Delete",
            "Tab",
            "Escape",
            "Enter",
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "ArrowDown",
            "Home",
            "End",
         ];

         const isNumber = /^[0-9]$/.test(e.key);

         if (
            !isNumber &&
            !allowedKeys.includes(e.key) &&
            !e.ctrlKey &&
            !e.metaKey
         ) {
            e.preventDefault();
         }
      };

      const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
         e.preventDefault();
         const pastedText = e.clipboardData.getData("text");
         const digits = extractDigits(pastedText);

         if (digits === "") {
            return;
         }

         let cents = Number.parseInt(digits, 10);

         if (Number.isNaN(cents)) {
            return;
         }

         if (cents > MAX_CENTS) {
            cents = MAX_CENTS;
         }

         isInternalChange.current = true;
         setRawCents(cents);
         emitChange(cents);
      };

      const displayValue = formatCentsToDisplay(rawCents);

      return (
         <InputGroup className={className}>
            <InputGroupAddon>
               <InputGroupText>R$</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
               data-slot="input-group-control"
               inputMode="numeric"
               onInput={handleInput}
               onKeyDown={handleKeyDown}
               onPaste={handlePaste}
               placeholder={placeholder}
               ref={(node) => {
                  inputRef.current = node;
                  if (typeof ref === "function") {
                     ref(node);
                  } else if (ref) {
                     ref.current = node;
                  }
               }}
               type="text"
               value={displayValue}
               {...props}
            />
            <InputGroupAddon align="inline-end">
               <InputGroupText>BRL</InputGroupText>
            </InputGroupAddon>
         </InputGroup>
      );
   },
);

MoneyInput.displayName = "MoneyInput";
