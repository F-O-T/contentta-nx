"use client";

import NumberFlow from "@number-flow/react";
import { cn } from "@packages/ui/lib/utils";
import { ArrowRightIcon, CheckIcon } from "@radix-ui/react-icons";
import * as React from "react";
import { Button } from "../components/button";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "../components/table";

export type PlanLevel = "starter" | "pro" | "all" | string;

export interface PricingFeature {
   name: string;
   included: PlanLevel | null;
}

export interface PricingPlan {
   name: string;
   level: PlanLevel;
   price: {
      monthly: number;
      yearly: number;
   };
   popular?: boolean;
}

export interface PricingTableProps {
   onPlanSelect?: (plan: PlanLevel) => void;
   containerClassName?: string;
   buttonClassName?: string;
}

const defaultContent = {
   buttonText: "Get started with",
   defaultInterval: "monthly",
   defaultPlan: "pro",
   features: [
      { included: "all", name: "Custom domains" },
      { included: "all", name: "Email support" },
      { included: "Pro, Enterprise", name: "Priority support" },
      { included: "Pro, Enterprise", name: "Advanced analytics" },
      { included: "Enterprise", name: "Team collaboration" },
   ],
   featuresHeaderLabel: "Features",
   monthLabel: "month",
   monthlyLabel: "Monthly",
   plans: [
      {
         level: "starter",
         name: "Starter",
         price: {
            monthly: 9,
            yearly: 90,
         },
      },
      {
         level: "pro",
         name: "Pro",
         popular: true,
         price: {
            monthly: 29,
            yearly: 290,
         },
      },
      {
         level: "all",
         name: "Enterprise",
         price: {
            monthly: 99,
            yearly: 990,
         },
      },
   ],
   popularLabel: "Popular",
   yearLabel: "year",
   yearlyLabel: "Yearly",
};

export function PricingTable({
   onPlanSelect,
   containerClassName,
   buttonClassName,
}: PricingTableProps) {
   const mergedContent = { ...defaultContent };
   const [isYearly, setIsYearly] = React.useState(
      mergedContent.defaultInterval === "yearly",
   );
   const [selectedPlan, setSelectedPlan] = React.useState<PlanLevel>(
      mergedContent.defaultPlan || "pro",
   );

   const handlePlanSelect = (plan: PlanLevel) => {
      setSelectedPlan(plan);
      onPlanSelect?.(plan);
   };

   return (
      <section
         className={cn(
            "bg-background text-foreground",
            "py-12 sm:py-24 md:py-32 px-4",
            "fade-bottom overflow-hidden pb-0",
         )}
      >
         <div
            className={cn("w-full max-w-3xl mx-auto px-4", containerClassName)}
         >
            <div className="flex justify-end mb-4 sm:mb-8">
               <div className="inline-flex items-center gap-2 text-xs sm:text-sm">
                  <button
                     className={cn(
                        "px-3 py-1 rounded-md transition-colors",
                        !isYearly
                           ? "bg-muted text-foreground"
                           : "text-muted-foreground",
                     )}
                     onClick={() => setIsYearly(false)}
                     type="button"
                  >
                     {mergedContent.monthlyLabel}
                  </button>
                  <button
                     className={cn(
                        "px-3 py-1 rounded-md transition-colors",
                        isYearly
                           ? "bg-muted text-foreground"
                           : "text-muted-foreground",
                     )}
                     onClick={() => setIsYearly(true)}
                     type="button"
                  >
                     {mergedContent.yearlyLabel}
                  </button>
               </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
               {mergedContent.plans.map((plan) => (
                  <button
                     className={cn(
                        "flex-1 p-4 rounded-xl text-left transition-all",
                        "border border-border",
                        selectedPlan === plan.level && "ring-2 ring-primary",
                     )}
                     key={plan.name}
                     onClick={() => handlePlanSelect(plan.level)}
                     type="button"
                  >
                     <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{plan.name}</span>
                        {plan.popular && (
                           <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              {mergedContent.popularLabel}
                           </span>
                        )}
                     </div>
                     <div className="flex items-baseline gap-1">
                        <NumberFlow
                           className="text-2xl font-bold"
                           format={{
                              currency: "USD",
                              style: "currency",
                           }}
                           value={
                              isYearly ? plan.price.yearly : plan.price.monthly
                           }
                        />
                        <span className="text-sm font-normal text-muted-foreground">
                           /
                           {isYearly
                              ? mergedContent.yearLabel
                              : mergedContent.monthLabel}
                        </span>
                     </div>
                  </button>
               ))}
            </div>

            <div className="border border-border rounded-xl overflow-hidden">
               <Table>
                  <TableHeader>
                     <TableRow className="bg-muted hover:bg-muted">
                        <TableHead className="font-medium">
                           {mergedContent.featuresHeaderLabel}
                        </TableHead>
                        {mergedContent.plans.map((plan) => (
                           <TableHead
                              className="text-center font-medium"
                              key={plan.level}
                           >
                              {plan.name}
                           </TableHead>
                        ))}
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {mergedContent.features.map((feature) => (
                        <TableRow
                           className={cn(
                              "transition-colors",
                              feature.included === selectedPlan &&
                                 "bg-primary/5",
                           )}
                           key={feature.name}
                        >
                           <TableCell className="font-medium">
                              {feature.name}
                           </TableCell>
                           {mergedContent.plans.map((plan) => (
                              <TableCell
                                 className="text-center"
                                 key={plan.level}
                              >
                                 {shouldShowCheck(
                                    feature.included,
                                    plan.name,
                                    mergedContent.plans,
                                 ) ? (
                                    <CheckIcon className="w-5 h-5 text-primary inline-block" />
                                 ) : (
                                    <span className="text-muted-foreground">
                                       -
                                    </span>
                                 )}
                              </TableCell>
                           ))}
                        </TableRow>
                     ))}
                  </TableBody>
               </Table>
            </div>

            <div className="mt-8 text-center">
               <Button
                  className={cn(
                     "w-full sm:w-auto px-8 py-2 rounded-xl pr-4.5",
                     buttonClassName,
                  )}
                  size="lg"
               >
                  {mergedContent.buttonText}{" "}
                  {
                     mergedContent.plans.find((p) => p.level === selectedPlan)
                        ?.name
                  }
                  <ArrowRightIcon className="w-4 h-4 opacity-50" />
               </Button>
            </div>
         </div>
      </section>
   );
}

function shouldShowCheck(
   included: PricingFeature["included"],
   planName: string,
   allPlans: PricingPlan[],
): boolean {
   if (!included) return false;
   if (included === "all") return true;

   // Support comma-separated plan names like "Starter, Pro"
   const includedPlans = included.split(",").map((p) => p.trim().toLowerCase());
   const normalizedPlanName = planName.toLowerCase();

   // Check if current plan is in the included list
   if (includedPlans.includes(normalizedPlanName)) {
      return true;
   }

   // Also check by level for backwards compatibility
   const plan = allPlans.find(
      (p) => p.name.toLowerCase() === normalizedPlanName,
   );
   if (plan && includedPlans.includes(plan.level.toLowerCase())) {
      return true;
   }

   return false;
}
