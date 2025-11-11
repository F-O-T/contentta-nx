import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
} from "@packages/ui/components/dialog";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemSeparator,
   ItemTitle,
} from "@packages/ui/components/item";
import {
   ChevronRightIcon,
   CrownIcon,
   ShieldIcon,
   UserIcon,
} from "lucide-react";
import * as React from "react";

export function OrganizationRoles() {
   const organizationRoles = [
      {
         description:
            "The user who created the organization. Has full control over the organization and can perform any action.",
         icon: CrownIcon,
         id: "owner",
         permissions: [
            "Organization: update, delete",
            "Member: create, update, delete",
            "Invitation: create, cancel",
            "Transfer ownership",
            "Full control over all resources",
         ],
         title: "Owner",
      },
      {
         description:
            "Full control over the organization except for deleting the organization or changing the owner.",
         icon: ShieldIcon,
         id: "admin",
         permissions: [
            "Organization: update",
            "Member: create, update, delete",
            "Invitation: create, cancel",
            "Cannot delete organization",
            "Cannot change owner",
         ],
         title: "Admin",
      },
      {
         description:
            "Limited control over the organization. Can create projects, invite users, and manage projects they have created.",
         icon: UserIcon,
         id: "member",
         permissions: [
            "Read organization data",
            "Create projects",
            "Invite users",
            "Manage own projects",
            "No control over organization/member/invitation actions",
         ],
         title: "Member",
      },
   ];

   function RolePermissionsDialog({
      role,
   }: {
      role: (typeof organizationRoles)[0];
   }) {
      return (
         <DialogContent>
            <DialogHeader>
               <DialogTitle className="flex items-center gap-3">
                  <role.icon className="h-5 w-5" />
                  {role.title} Permissions
               </DialogTitle>
               <DialogDescription>
                  Detailed permissions and capabilities for the {role.title}{" "}
                  role
               </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
               <p className="text-sm text-muted-foreground">
                  {role.description}
               </p>
               <div>
                  <p className="text-sm font-medium mb-3">Permissions:</p>
                  <ul className="text-sm space-y-2">
                     {role.permissions.map((permission, index) => (
                        <li
                           className="flex items-start gap-3"
                           key={`permission-${index + 1}`}
                        >
                           <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                           <span>{permission}</span>
                        </li>
                     ))}
                  </ul>
               </div>
            </div>
         </DialogContent>
      );
   }
   return (
      <Card className="w-full">
         <CardHeader>
            <CardTitle>Organization Roles</CardTitle>
            <CardDescription>
               Access control roles and permissions for organization management
            </CardDescription>
         </CardHeader>
         <CardContent className="w-full">
            <ItemGroup>
               {organizationRoles.map((role, index) => (
                  <React.Fragment key={role.id}>
                     <Dialog>
                        <DialogTrigger asChild>
                           <Item className="cursor-pointer hover:bg-accent/50 transition-colors">
                              <ItemMedia className="size-10 " variant="icon">
                                 <role.icon className="size-4 " />
                              </ItemMedia>
                              <ItemContent className="gap-1">
                                 <ItemTitle>{role.title}</ItemTitle>
                                 <ItemDescription>
                                    {role.description}
                                 </ItemDescription>
                              </ItemContent>
                              <ItemActions>
                                 <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                              </ItemActions>
                           </Item>
                        </DialogTrigger>
                        <RolePermissionsDialog role={role} />
                     </Dialog>
                     {index !== organizationRoles.length - 1 && (
                        <ItemSeparator />
                     )}
                  </React.Fragment>
               ))}
            </ItemGroup>
         </CardContent>
      </Card>
   );
}
