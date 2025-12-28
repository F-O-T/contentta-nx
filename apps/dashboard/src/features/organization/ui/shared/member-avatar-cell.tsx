import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import { getInitials } from "@packages/utils/text";

interface MemberAvatarCellProps {
   name: string;
   email?: string;
   image?: string | null;
   showEmail?: boolean;
}

export function MemberAvatarCell({
   name,
   email,
   image,
   showEmail = false,
}: MemberAvatarCellProps) {
   return (
      <div className="flex items-center gap-3">
         <Avatar className="size-8">
            {image && <AvatarImage alt={name} src={image} />}
            <AvatarFallback className="text-xs font-medium">
               {getInitials(name)}
            </AvatarFallback>
         </Avatar>
         <div className="flex flex-col min-w-0">
            <span className="font-medium truncate">{name}</span>
            {showEmail && email && (
               <span className="text-xs text-muted-foreground truncate">
                  {email}
               </span>
            )}
         </div>
      </div>
   );
}
