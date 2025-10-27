import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
} from "@packages/ui/components/dialog";
import { Button } from "@packages/ui/components/button";
import { Separator } from "@packages/ui/components/separator";
import type { RouterInput, RouterOutput } from "@packages/api/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@packages/ui/components/select";
import { AgentWriterCard } from "@/widgets/agent-display-card/ui/agent-writter-card";
import { Check } from "lucide-react";

type Statuses = RouterInput["content"]["listAllContent"]["status"];
type StatusValue = Statuses[number];

interface FilteringCredenzaProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   selectedStatuses: Statuses;
   selectedAgents: string[];
   onStatusesChange: (statuses: Statuses) => void;
   onAgentsChange: (agents: string[]) => void;
   agents?: RouterOutput["agent"]["list"]["items"];
}

const statusLabels: Record<NonNullable<StatusValue>, string> = {
   pending: "Pending",
   draft: "Draft",
   approved: "Approved",
   failed: "Failed",
};

const allStatuses = Object.entries(statusLabels).map(([value, label]) => ({
   value: value as NonNullable<StatusValue>,
   label,
}));

export function FilteringCredenza({
   open,
   onOpenChange,
   selectedStatuses,
   selectedAgents,
   onStatusesChange,
   onAgentsChange,
   agents,
}: FilteringCredenzaProps) {
   const handleStatusChange = (status: Statuses[number], checked: boolean) => {
      if (checked) {
         onStatusesChange([...selectedStatuses, status]);
      } else {
         onStatusesChange(selectedStatuses.filter((s) => s !== status));
      }
   };

   const handleAgentChange = (agentId: string) => {
      const isAlreadySelected = selectedAgents.includes(agentId);
      if (isAlreadySelected) {
         onAgentsChange(selectedAgents.filter((id) => id !== agentId));
      } else {
         onAgentsChange([agentId]);
      }
   };

   const clearFilters = () => {
      onStatusesChange([]);
      onAgentsChange([]);
   };

   const selectedAgentId = selectedAgents[0];

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="max-w-md">
            <DialogHeader>
               <DialogTitle>Filter Content</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
               <div>
                  <h3 className="text-sm font-medium mb-3">Status</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                     <Select>
                        <SelectTrigger className="w-full">
                           <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                        <SelectContent>
                           {allStatuses.map((status) => (
                              <SelectItem key={status.value} value={status.value} onSelect={() => handleStatusChange(status.value as Statuses[number], true)}>
                                 {status.label}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
               </div>

               <Separator />

               <div>
                  <h3 className="text-sm font-medium mb-3">Agent</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                     {agents?.map((agent) => {
                        const isSelected = agent.id === selectedAgentId;
                        return (
                           <button
                              key={agent.id}
                              type="button"
                              onClick={() => handleAgentChange(agent.id)}
                              className="w-full text-left relative transition-all"
                           >
                              <AgentWriterCard
                                 name={agent.personaConfig.metadata.name}
                                 description={agent.personaConfig.metadata.description}
                                 photo={agent.profilePhotoUrl ?? ""}
                              />
                              {isSelected && (
                                 <div className="absolute top-1/2 right-4 -translate-y-1/2">
                                    <Check className="w-5 h-5 text-primary" />
                                 </div>
                              )}
                           </button>
                        );
                     })}
                  </div>
               </div>

               <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={clearFilters}>
                     Clear All
                  </Button>
                  <Button onClick={() => onOpenChange(false)}>
                     Apply Filters
                  </Button>
               </div>
            </div>
         </DialogContent>
      </Dialog>
   );
}
