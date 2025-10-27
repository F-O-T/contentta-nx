import { Button } from "@packages/ui/components/button";
import { InfoItem } from "@packages/ui/components/info-item";
import { translate } from "@packages/localization";
import type { AgentForm } from "../lib/use-agent-form";
import { UserIcon, FileTextIcon, LayoutGridIcon } from "lucide-react";
import { formatStringForDisplay } from "@packages/utils/text";

export function ReviewStep({ form }: { form: AgentForm }) {
   // Collect all items with their values
   const singleColumnItems = [
      {
         icon: <UserIcon className="w-4 h-4" />,
         label: translate("pages.agent-creation-form.review.fields.agent-name"),
         value: String(form.getFieldValue("metadata.name") ?? ""),
      },
      {
         icon: <LayoutGridIcon className="w-4 h-4" />,
         label: translate("pages.agent-creation-form.review.fields.purpose"),
         value: formatStringForDisplay(
            String(form.getFieldValue("purpose") ?? ""),
         ),
      },
   ];

   // Communication style as a double-width item

   // Optional single-column items

   // Combine core and optional single-column items
   const allSingleItems = [...singleColumnItems];

   // Full-width items
   const fullWidthItems = [];

   const description = form.getFieldValue("metadata.description");
   if (description) {
      fullWidthItems.push({
         icon: <FileTextIcon className="w-4 h-4" />,
         label: translate(
            "pages.agent-creation-form.review.fields.description",
         ),
         value: String(description).replace(/<[^>]*>/g, ""),
      });
   }

   return (
      <div className="space-y-4">
         {/* Grid for items */}
         <div className="grid grid-cols-2 gap-4 text-sm">
            {allSingleItems.map((item) => (
               <InfoItem
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  value={item.value}
               />
            ))}
         </div>

         {/* Full-width items */}
         {fullWidthItems.length > 0 && (
            <div className="space-y-4">
               {fullWidthItems.map((item) => (
                  <InfoItem
                     key={item.label}
                     icon={item.icon}
                     label={item.label}
                     value={item.value}
                  />
               ))}
            </div>
         )}
      </div>
   );
}

export function ReviewStepSubscribe({
   form,
   mode = "create",
}: {
   form: AgentForm;
   mode?: "create" | "edit";
}) {
   return (
      <form.Subscribe
         selector={(state) => ({
            canSubmit: state.canSubmit,
            isSubmitting: state.isSubmitting,
         })}
      >
         {({ canSubmit, isSubmitting }) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
               {isSubmitting
                  ? mode === "edit"
                     ? translate("common.actions.updating")
                     : translate("common.actions.creating")
                  : mode === "edit"
                    ? translate("common.actions.update")
                    : translate(
                         "pages.agent-creation-form.actions.create-agent",
                      )}
            </Button>
         )}
      </form.Subscribe>
   );
}
