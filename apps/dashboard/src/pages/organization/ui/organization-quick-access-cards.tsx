import { QuickAccessCard } from "@packages/ui/components/quick-access-card";
import { Mail, Palette, Users } from "lucide-react";

export function QuickAccessCards() {
   const quickAccessItems = [
      {
         description: "Manage organization teams and members",
         icon: <Users className="size-5" />,
         onClick: () => console.log("Navigate to Teams"),
         title: "Teams",
      },
      {
         description: "Configure brand settings and assets",
         icon: <Palette className="size-5" />,
         onClick: () => console.log("Navigate to Brand"),
         title: "Brand",
      },
      {
         description: "View and manage all organization members",
         icon: <Users className="size-5" />,
         onClick: () => console.log("Navigate to all members"),
         title: "All Members",
      },
      {
         description: "Manage invitations and send new invites",
         icon: <Mail className="size-5" />,
         onClick: () => console.log("Navigate to manage invites"),
         title: "Manage Invites",
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