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
   ItemGroup,
   ItemSeparator,
   ItemTitle,
} from "@packages/ui/components/item";
import { Calendar, FileText, Users } from "lucide-react";
import { Fragment } from "react";

interface Team {
   id: string;
   name: string;
   description?: string | null;
   createdAt?: Date | string | null;
   members?: unknown[];
}

interface TeamInfoCardProps {
   team: Team;
}

export function TeamInfoCard({ team }: TeamInfoCardProps) {
   const createdDate = team.createdAt
      ? new Date(team.createdAt).toLocaleDateString()
      : "Unknown";

   const infoItems = [
      {
         icon: <Users className="size-4" />,
         label: "Members",
         value: `${team.members?.length ?? 0} members`,
      },
      {
         icon: <FileText className="size-4" />,
         label: "Description",
         value: team.description || "No description",
      },
      {
         icon: <Calendar className="size-4" />,
         label: "Created",
         value: createdDate,
      },
   ];

   return (
      <Card>
         <CardHeader>
            <CardTitle>Team Information</CardTitle>
            <CardDescription>Details about this team</CardDescription>
         </CardHeader>
         <CardContent>
            <ItemGroup>
               {infoItems.map((item, index) => (
                  <Fragment key={`info-${index + 1}`}>
                     <Item>
                        <div className="flex items-center justify-center size-8 rounded-md bg-muted text-muted-foreground">
                           {item.icon}
                        </div>
                        <ItemContent>
                           <ItemTitle className="text-sm font-medium">
                              {item.label}
                           </ItemTitle>
                           <ItemDescription>{item.value}</ItemDescription>
                        </ItemContent>
                     </Item>
                     {index !== infoItems.length - 1 && <ItemSeparator />}
                  </Fragment>
               ))}
            </ItemGroup>
         </CardContent>
      </Card>
   );
}
