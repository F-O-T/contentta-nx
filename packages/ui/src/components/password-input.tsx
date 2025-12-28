import { Input } from "@packages/ui/components/input";
import { cn } from "@packages/ui/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import type { ComponentProps, HTMLAttributes } from "react";
import { useState } from "react";

export function PasswordInput({
   className,
   containerProps,
   ...props
}: ComponentProps<typeof Input> & {
   containerProps?: HTMLAttributes<HTMLDivElement>;
}) {
   const [isVisible, setIsVisible] = useState<boolean>(false);

   const toggleVisibility = () => setIsVisible((prevState) => !prevState);

   return (
      <div
         {...containerProps}
         className={cn("relative", containerProps?.className)}
      >
         <Input
            className={cn("pe-9", className)}
            placeholder="Password"
            type={isVisible ? "text" : "password"}
            {...props}
         />
         <button
            aria-controls="password"
            aria-label={isVisible ? "Hide password" : "Show password"}
            aria-pressed={isVisible}
            className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus:z-10 focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
            onClick={toggleVisibility}
            type="button"
         >
            {isVisible ? (
               <EyeOff aria-hidden="true" size={16} strokeWidth={2} />
            ) : (
               <Eye aria-hidden="true" size={16} strokeWidth={2} />
            )}
         </button>
      </div>
   );
}
