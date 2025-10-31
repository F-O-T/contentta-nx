import { translate } from "@packages/localization";
import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardAction,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuGroup,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import {
   Item,
   ItemContent,
   ItemDescription,
   ItemTitle,
} from "@packages/ui/components/item";
import {
   KeyIcon,
   Mail as MailIcon,
   MoreVertical,
   User as UserIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { betterAuthClient } from "@/integrations/clients";
import { UpdateEmailForm } from "../features/update-email-form";
import { UpdatePasswordForm } from "../features/update-password-form";
import { UpdateProfileForm } from "../features/update-profile-form";

export function ProfileInformation() {
   const { data: session } = betterAuthClient.useSession();
   const [showEmailModal, setShowEmailModal] = useState(false);
   const [showPasswordModal, setShowPasswordModal] = useState(false);
   const [showProfileModal, setShowProfileModal] = useState(false);

   // Helper for avatar fallback
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

   // Memoize dropdown menu items
   const dropdownMenuItems = useMemo(
      () => [
         {
            icon: MailIcon,
            label: translate("pages.profile.information.actions.edit-email"),
            onClick: () => setShowEmailModal(true),
         },
         {
            icon: KeyIcon,
            label: translate("pages.profile.information.actions.edit-password"),
            onClick: () => setShowPasswordModal(true),
         },
         {
            icon: UserIcon,
            label: translate("pages.profile.information.actions.edit-profile"),
            onClick: () => setShowProfileModal(true),
         },
      ],
      [],
   );

   return (
      <>
         <Card className="w-full h-full">
            <CardHeader>
               <CardTitle>
                  {translate("pages.profile.information.title")}
               </CardTitle>
               <CardDescription>
                  {translate("pages.profile.information.description")}
               </CardDescription>
               <CardAction>
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button
                           aria-label={translate(
                              "pages.profile.information.actions.title",
                           )}
                           size="icon"
                           variant="ghost"
                        >
                           <MoreVertical className="w-5 h-5" />
                        </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>
                           {translate(
                              "pages.profile.information.actions.title",
                           )}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                           {dropdownMenuItems.map((item, index) => {
                              const Icon = item.icon;
                              return (
                                 <DropdownMenuItem
                                    className=" flex items-center gap-2"
                                    key={`${item.label}-${index + 1}`}
                                    onClick={item.onClick}
                                 >
                                    <Icon className="w-4 h-4 " />
                                    <span>{item.label}</span>
                                 </DropdownMenuItem>
                              );
                           })}
                        </DropdownMenuGroup>
                     </DropdownMenuContent>
                  </DropdownMenu>
               </CardAction>
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
         <UpdateEmailForm
            currentEmail={session?.user?.email || ""}
            onOpenChange={setShowEmailModal}
            open={showEmailModal}
         />
         <UpdatePasswordForm
            onOpenChange={setShowPasswordModal}
            open={showPasswordModal}
         />
         <UpdateProfileForm
            currentImage={session?.user?.image || ""}
            currentName={session?.user?.name || ""}
            onOpenChange={setShowProfileModal}
            open={showProfileModal}
         />
      </>
   );
}
