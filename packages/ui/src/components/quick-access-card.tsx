import {
   Card,
   CardAction,
   CardHeader,
   CardTitle,
   CardDescription,
} from "./card";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

interface QuickAccessCardProps {
   icon: ReactNode;
   title: string;
   description: string;
   onClick?: () => void;
}

export function QuickAccessCard({
   icon,
   title,
   description,
   onClick,
}: QuickAccessCardProps) {
   const handleKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
         event.preventDefault();
         onClick?.();
      }
   };

   return (
      <Card
         className="cursor-pointer "
         onClick={onClick}
         onKeyDown={handleKeyDown}
         role="button"
         tabIndex={0}
         aria-label={`${title}: ${description}`}
      >
         <CardAction className="px-6 flex items-center justify-between w-full">
            <div className="rounded-lg bg-accent p-2">{icon}</div>
            <ArrowUpRight className="w-4 h-4" />
         </CardAction>
         <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
            <CardAction></CardAction>
         </CardHeader>
      </Card  >
   );
}
