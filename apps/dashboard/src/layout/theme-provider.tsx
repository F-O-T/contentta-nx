import { SquaredIconButton } from "@packages/ui/components/squared-icon-button";
import { ScriptOnce } from "@tanstack/react-router";
import { MoonIcon, SunIcon } from "lucide-react";
import * as React from "react";

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

         setResolvedTheme(theme as ResolvedTheme);

         if (attribute === "class") {
            root.classList.add(theme);
         } else {
            root.setAttribute(attribute, theme);
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

export const ThemeToggler = () => {
   const { theme, setTheme, resolvedTheme } = useTheme();

   const nextTheme = React.useMemo(() => {
      if (theme === "dark") return "light";
      if (theme === "light") return "dark";
      return resolvedTheme === "dark" ? "light" : "dark";
   }, [theme, resolvedTheme]);

   return (
      <SquaredIconButton onClick={() => setTheme(nextTheme)}>
         {resolvedTheme === "dark" ? <SunIcon /> : <MoonIcon />}
         Toggle theme
      </SquaredIconButton>
   );
};
