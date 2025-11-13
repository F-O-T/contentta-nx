import { QuickAccessCard } from "@packages/ui/components/quick-access-card";
import { useRouter } from "@tanstack/react-router";
import { Building2, Mail, Palette, Users } from "lucide-react";

export function QuickAccessCards() {
   const router = useRouter();
   const quickAccessItems = [
      {
         description: "Manage organization teams and collaborate",
         icon: <Building2 className="size-5" />,
         onClick: () => router.navigate({ to: "/organization/teams" }),
         title: "Teams",
      },
      {
         description: "Configure brand settings and assets",
         icon: <Palette className="size-5" />,
         onClick: () => router.navigate({ to: "/organization/brand" }),
         title: "Brand",
      },
      {
         description: "View and manage all organization members",
         icon: <Users className="size-5" />,
         onClick: () => router.navigate({ to: "/organization/members" }),
         title: "Members",
      },
      {
         description: "Manage invitations and send new invites",
         icon: <Mail className="size-5" />,
         onClick: () => router.navigate({ to: "/organization/invites" }),
         title: "Invites",
      },
   ];

   return (
      <div className="col-span-1 grid grid-cols-2 gap-4">
         {quickAccessItems.map((item, index) => (
            <QuickAccessCard
               description={item.description}
               icon={item.icon}
               key={`quick-access-${index + 1}`}
               onClick={item.onClick}
               title={item.title}
            />
         ))}
      </div>
   );
}
