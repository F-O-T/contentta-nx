import { translate } from "@packages/localization";
import { Badge } from "@packages/ui/components/badge";
import { cn } from "@packages/ui/lib/utils";
import { Check, Clock, X, XCircle } from "lucide-react";

type InviteStatus = "pending" | "accepted" | "expired" | "canceled";

interface StatusBadgeProps {
   status: InviteStatus | string;
   showIcon?: boolean;
   className?: string;
}

const statusConfig: Record<
   InviteStatus,
   {
      icon: typeof Clock;
      className: string;
      labelKey: string;
   }
> = {
   pending: {
      icon: Clock,
      className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      labelKey: "dashboard.routes.organization.invites-table.status.pending",
   },
   accepted: {
      icon: Check,
      className: "bg-green-500/10 text-green-600 border-green-500/20",
      labelKey: "dashboard.routes.organization.invites-table.status.accepted",
   },
   expired: {
      icon: X,
      className: "bg-gray-500/10 text-gray-500 border-gray-500/20",
      labelKey: "dashboard.routes.organization.invites-table.status.expired",
   },
   canceled: {
      icon: XCircle,
      className: "bg-red-500/10 text-red-600 border-red-500/20",
      labelKey: "dashboard.routes.organization.invites-table.status.canceled",
   },
};

export function StatusBadge({
   status,
   showIcon = true,
   className,
}: StatusBadgeProps) {
   const normalizedStatus = status.toLowerCase() as InviteStatus;
   const config = statusConfig[normalizedStatus] || statusConfig.pending;
   const Icon = config.icon;

   return (
      <Badge className={cn(config.className, className)} variant="outline">
         {showIcon && <Icon className="size-3" />}
         <span>
            {translate(config.labelKey as Parameters<typeof translate>[0])}
         </span>
      </Badge>
   );
}

export { statusConfig };
