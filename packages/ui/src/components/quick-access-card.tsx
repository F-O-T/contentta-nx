import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import {
   Card,
   CardAction,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "./card";

interface QuickAccessCardProps {
   icon: ReactNode;
   title: string;
   description: string;
   onClick?: () => void;
   disabled?: boolean;
   content?: ReactNode;
}

export function QuickAccessCard({
   content,
   icon,
   title,
   description,
   onClick,
   disabled = false,
}: QuickAccessCardProps) {
   const handleKeyDown = (event: React.KeyboardEvent) => {
      if (disabled) return;
      if (event.key === "Enter" || event.key === " ") {
         event.preventDefault();
         onClick?.();
      }
   };

   return (
      <Card
         aria-disabled={disabled}
         aria-label={`${title}: ${description}`}
         className={`${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"} transition-opacity`}
         onClick={disabled ? undefined : onClick}
         onKeyDown={handleKeyDown}
         role={disabled ? undefined : "button"}
         tabIndex={disabled ? -1 : 0}
      >
         <CardAction className="px-6 flex items-center justify-between w-full">
            <div className="rounded-lg bg-muted p-2 text-primary">{icon}</div>
            <ArrowUpRight className="size-4 text-primary" />
         </CardAction>
         <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
            <CardAction></CardAction>
         </CardHeader>
         <CardContent>{content}</CardContent>
      </Card>
   );
}
