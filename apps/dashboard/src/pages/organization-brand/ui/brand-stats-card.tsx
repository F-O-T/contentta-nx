import type { RouterOutput } from "@packages/api/client";
import { StatsCard } from "@packages/ui/components/stats-card";
import { useMemo } from "react";

interface BrandStatsCardProps {
   brand: RouterOutput["brand"]["getByOrganization"];
}

export function BrandStatsCard({ brand }: BrandStatsCardProps) {
   const items = useMemo(() => {
      const features = brand?.features ?? [];
      const totalFeatures = features.length;

      let highCount = 0;
      let mediumCount = 0;
      let sumConfidence = 0;

      for (const f of features) {
         const confidence = f.meta?.confidence ?? 0;
         sumConfidence += confidence * 100;
         if (confidence > 0.8) highCount++;
         else if (confidence > 0.5) mediumCount++;
      }

      const confidenceDetails =
         totalFeatures > 0
            ? [
                 {
                    description: "Features with confidence above 80%",
                    title: "High Confidence",
                    value: String(highCount),
                 },
                 {
                    description: "Features with confidence between 50-80%",
                    title: "Medium Confidence",
                    value: String(mediumCount),
                 },
              ]
            : undefined;

      const avgConfidence =
         totalFeatures > 0 ? Math.round(sumConfidence / totalFeatures) : 0;

      return [
         {
            description: "Total number of features identified for this brand",
            label: "Total Features",
            value: String(totalFeatures),
         },
         {
            description:
               "Average confidence score across all extracted features",
            details: confidenceDetails,
            label: "Average Confidence",
            value: `${avgConfidence}%`,
         },
      ];
   }, [brand?.features]);

   return (
      <div className="grid h-min grid-cols-2 gap-4">
         {items.map((item) => (
            <StatsCard
               description={item.description}
               details={item.details}
               key={item.label}
               title={item.label}
               value={item.value}
            />
         ))}
      </div>
   );
}
