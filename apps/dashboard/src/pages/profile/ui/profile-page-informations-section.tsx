import { translate } from "@packages/localization";
import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Item,
   ItemContent,
   ItemDescription,
   ItemTitle,
} from "@packages/ui/components/item";
import { betterAuthClient } from "@/integrations/clients";

export function ProfileInformation() {
   const { data: session } = betterAuthClient.useSession();
   const getInitials = (name: string, email: string) => {
      if (name) {
         return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
      }
      return email ? email.slice(0, 2).toUpperCase() : "?";
   };

   return (
      <Card className="w-full h-full">
         <CardHeader>
            <CardTitle>
               {translate("pages.profile.information.title")}
            </CardTitle>
            <CardDescription>
               {translate("pages.profile.information.description")}
            </CardDescription>
         </CardHeader>
         <CardContent className="grid place-items-center gap-4">
            <Avatar className="w-24 h-24">
               <AvatarImage
                  alt={session?.user?.name || "Profile picture"}
                  src={session?.user?.image || undefined}
               />
               <AvatarFallback>
                  {getInitials(
                     session?.user?.name || "",
                     session?.user?.email || "",
                  )}
               </AvatarFallback>
            </Avatar>
            <Item className=" text-center">
               <ItemContent>
                  <ItemTitle>{session?.user?.name}</ItemTitle>
                  <ItemDescription>{session?.user?.email}</ItemDescription>
               </ItemContent>
            </Item>
         </CardContent>
      </Card>
   );
}
