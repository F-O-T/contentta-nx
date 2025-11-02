import { translate } from "@packages/localization";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { cn } from "@packages/ui/lib/utils";
import { ScriptOnce } from "@tanstack/react-router";
import { Monitor, Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import * as React from "react";
import { useCallback, useEffect, useState } from "react";

// FunctionOnce utility for TanStack Router integration
function FunctionOnce<T = unknown>({
   children,
   param,
}: {
   children: (param: T) => unknown;
   param?: T;
}) {
   return (
      <ScriptOnce>
         {`(${children.toString()})(${JSON.stringify(param)})`}
      </ScriptOnce>
   );
}

// Modern theme types
export type ResolvedTheme = "dark" | "light";
export type Theme = ResolvedTheme | "system";

export interface UseThemeProps {
   theme: Theme;
   resolvedTheme: ResolvedTheme;
   setTheme: (theme: Theme) => void;
}

export interface ThemeProviderProps {
   children: React.ReactNode;
   defaultTheme?: Theme;
   storageKey?: string;
   enableSystem?: boolean;
   attribute?: "class" | "data-theme";
}

const isBrowser = typeof window !== "undefined";
const initialState: UseThemeProps = {
   resolvedTheme: "light",
   setTheme: () => null,
   theme: "system",
};
const ThemeProviderContext = React.createContext<UseThemeProps>(initialState);

export function ThemeProvider({
   children,
   defaultTheme = "system",
   storageKey = "conar.theme",
   enableSystem = true,
   attribute = "class",
}: ThemeProviderProps) {
   const [theme, setTheme] = React.useState<Theme>(
      () =>
         (isBrowser
            ? (localStorage.getItem(storageKey) as Theme)
            : defaultTheme) || defaultTheme,
   );
   const [resolvedTheme, setResolvedTheme] =
      React.useState<ResolvedTheme>("light");

   React.useEffect(() => {
      const root = window.document.documentElement;

      function updateTheme() {
         root.classList.remove("light", "dark");

         if (theme === "system" && enableSystem) {
            const systemTheme = window.matchMedia(
               "(prefers-color-scheme: dark)",
            ).matches
               ? "dark"
               : "light";
            setResolvedTheme(systemTheme);
            root.classList.add(systemTheme);
            return;
         }

         // Validate theme before applying
         const validTheme =
            (theme as ResolvedTheme) === "light" ||
            (theme as ResolvedTheme) === "dark"
               ? (theme as ResolvedTheme)
               : "light";

         setResolvedTheme(validTheme);

         if (attribute === "class") {
            root.classList.add(validTheme);
         } else {
            root.setAttribute(attribute, validTheme);
         }
      }

      if (enableSystem) {
         const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
         mediaQuery.addEventListener("change", updateTheme);
         updateTheme();
         return () => mediaQuery.removeEventListener("change", updateTheme);
      } else {
         updateTheme();
      }
   }, [theme, enableSystem, attribute]);

   const value = React.useMemo(
      () => ({
         resolvedTheme,
         setTheme: (theme: Theme) => {
            // Validate theme to prevent empty strings
            if (!theme || theme.trim() === "") {
               console.warn("Invalid theme provided, defaulting to system");
               theme = "system";
            }

            localStorage.setItem(storageKey, theme);
            setTheme(theme);
         },
         theme,
      }),
      [theme, resolvedTheme, storageKey],
   );

   return (
      <ThemeProviderContext value={value}>
         <FunctionOnce param={{ attribute, enableSystem, storageKey }}>
            {({ storageKey, enableSystem, attribute }) => {
               const theme: string | null = localStorage.getItem(storageKey);
               const root = document.documentElement;

               if (
                  theme === "dark" ||
                  ((theme === null || theme === "system") &&
                     enableSystem &&
                     window.matchMedia("(prefers-color-scheme: dark)").matches)
               ) {
                  if (attribute === "class") {
                     root.classList.add("dark");
                  } else {
                     root.setAttribute(attribute, "dark");
                  }
               }
            }}
         </FunctionOnce>
         {children}
      </ThemeProviderContext>
   );
}

export function useTheme() {
   const context = React.useContext(ThemeProviderContext);

   if (context === undefined)
      throw new Error("useTheme must be used within a ThemeProvider");

   return context;
}

export type ThemeSwitcherProps = {
   className?: string;
};

export const ThemeSwitcher = ({ className }: ThemeSwitcherProps) => {
   const themes = [
      {
         icon: Monitor,
         key: "system",
         label: translate("common.themes.system"),
      },
      {
         icon: Sun,
         key: "light",
         label: translate("common.themes.light"),
      },
      {
         icon: Moon,
         key: "dark",
         label: translate("common.themes.dark"),
      },
   ];

   const { theme, setTheme } = useTheme();
   const [mounted, setMounted] = useState(false);

   const handleThemeClick = useCallback(
      (themeKey: "light" | "dark" | "system") => {
         // Validate theme before applying
         if (!themeKey || themeKey.trim() === "") {
            console.warn("Empty theme received, defaulting to system");
            themeKey = "system";
         }
         console.log("Theme changing to:", themeKey);
         setTheme(themeKey);
      },
      [setTheme],
   );

   // Prevent hydration mismatch
   useEffect(() => {
      setMounted(true);
   }, []);

   if (!mounted) {
      return null;
   }

   return (
      <TooltipProvider>
         <div
            className={cn(
               "relative isolate flex h-8 rounded-full bg-background p-1 ring-1 ring-border",
               className,
            )}
         >
            {themes.map(({ key, icon: Icon, label }) => {
               const isActive = theme === key;

               return (
                  <Tooltip key={key}>
                     <TooltipTrigger asChild>
                        <button
                           aria-label={label}
                           className="relative h-6 w-6 rounded-full"
                           onClick={() =>
                              handleThemeClick(
                                 key as "light" | "dark" | "system",
                              )
                           }
                           type="button"
                        >
                           {isActive && (
                              <motion.div
                                 className="absolute inset-0 rounded-full bg-muted"
                                 layoutId="activeTheme"
                                 transition={{ duration: 0.5, type: "spring" }}
                              />
                           )}
                           <Icon
                              className={cn(
                                 "relative z-10 m-auto h-4 w-4",
                                 isActive
                                    ? "text-foreground"
                                    : "text-muted-foreground",
                              )}
                           />
                        </button>
                     </TooltipTrigger>
                     <TooltipContent>
                        <p className="text-foreground">{label}</p>
                     </TooltipContent>
                  </Tooltip>
               );
            })}
         </div>
      </TooltipProvider>
   );
};
