import { cn } from "@packages/ui/lib/utils";
import type { IconName } from "../lib/available-icons";
import { getIconComponent } from "../lib/available-icons";

interface IconDisplayProps {
   iconName: IconName | null;
   className?: string;
   size?: number;
}

export function IconDisplay({
   iconName,
   className,
   size = 20,
}: IconDisplayProps) {
   if (!iconName) {
      return null;
   }

   const IconComponent = getIconComponent(iconName);

   if (!IconComponent) {
      return null;
   }

   return <IconComponent className={cn(className)} size={size} />;
}
