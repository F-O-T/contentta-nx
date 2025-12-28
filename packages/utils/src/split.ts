export type CategorySplit = {
   categoryId: string;
   value: number;
   splitType: "amount";
};

export type CategorySplitMode = "equal" | "percentage" | "fixed" | "dynamic";

export type CategorySplitConfig = {
   categoryId: string;
   value: number;
};

const TOLERANCE_CENTS = 1;
const PERCENTAGE_TOLERANCE = 0.01;

export function validateCategorySplits(
   splits: CategorySplit[] | null | undefined,
   categoryIds: string[],
   totalAmountInCents: number,
): { isValid: boolean; errors: string[] } {
   if (!splits || splits.length === 0) {
      return { errors: [], isValid: true };
   }

   const errors: string[] = [];

   const invalidIds = splits.filter((s) => !categoryIds.includes(s.categoryId));
   if (invalidIds.length > 0) {
      errors.push("Split contains invalid category IDs");
   }

   if (splits.some((s) => s.value < 0)) {
      errors.push("Split values cannot be negative");
   }

   const sum = splits.reduce((acc, s) => acc + s.value, 0);
   if (Math.abs(totalAmountInCents - sum) > TOLERANCE_CENTS) {
      errors.push(
         `Split sum (${sum / 100}) does not match total (${totalAmountInCents / 100})`,
      );
   }

   return { errors, isValid: errors.length === 0 };
}

export function isSplitSumValid(
   splits: CategorySplit[],
   totalAmountInCents: number,
): boolean {
   const sum = splits.reduce((acc, s) => acc + s.value, 0);
   return Math.abs(totalAmountInCents - sum) <= TOLERANCE_CENTS;
}

export function getRemainingAmount(
   splits: CategorySplit[],
   totalAmountInCents: number,
): number {
   const sum = splits.reduce((acc, s) => acc + s.value, 0);
   return totalAmountInCents - sum;
}

export function calculateEqualSplits(
   categoryIds: string[],
   totalAmountInCents: number,
): CategorySplit[] {
   if (categoryIds.length === 0) return [];
   if (categoryIds.length === 1) {
      const categoryId = categoryIds[0];
      if (!categoryId) return [];
      return [
         {
            categoryId,
            splitType: "amount",
            value: totalAmountInCents,
         },
      ];
   }

   const baseValue = Math.floor(totalAmountInCents / categoryIds.length);
   const remainder = totalAmountInCents % categoryIds.length;

   return categoryIds.map((categoryId, index) => ({
      categoryId,
      splitType: "amount" as const,
      value: baseValue + (index < remainder ? 1 : 0),
   }));
}

export function calculateSplitsFromPercentage(
   splits: CategorySplitConfig[],
   totalAmountInCents: number,
): CategorySplit[] {
   if (splits.length === 0) return [];

   const totalPercentage = splits.reduce((acc, s) => acc + s.value, 0);
   if (totalPercentage === 0) return [];

   const normalizedSplits = splits.map((s) => ({
      categoryId: s.categoryId,
      percentage: (s.value / totalPercentage) * 100,
   }));

   let allocated = 0;
   const result: CategorySplit[] = [];

   for (let i = 0; i < normalizedSplits.length; i++) {
      const split = normalizedSplits[i];
      if (!split) continue;
      const isLast = i === normalizedSplits.length - 1;

      let value: number;
      if (isLast) {
         value = totalAmountInCents - allocated;
      } else {
         value = Math.round((split.percentage / 100) * totalAmountInCents);
         allocated += value;
      }

      result.push({
         categoryId: split.categoryId,
         splitType: "amount",
         value,
      });
   }

   return result;
}

export function adjustFixedSplitsProportionally(
   splits: CategorySplitConfig[],
   totalAmountInCents: number,
): CategorySplit[] {
   if (splits.length === 0) return [];

   const configuredTotal = splits.reduce((acc, s) => acc + s.value, 0);

   if (configuredTotal === 0) {
      return calculateEqualSplits(
         splits.map((s) => s.categoryId),
         totalAmountInCents,
      );
   }

   if (Math.abs(configuredTotal - totalAmountInCents) <= TOLERANCE_CENTS) {
      return splits.map((s) => ({
         categoryId: s.categoryId,
         splitType: "amount" as const,
         value: s.value,
      }));
   }

   const ratio = totalAmountInCents / configuredTotal;

   let allocated = 0;
   const result: CategorySplit[] = [];

   for (let i = 0; i < splits.length; i++) {
      const split = splits[i];
      if (!split) continue;
      const isLast = i === splits.length - 1;

      let value: number;
      if (isLast) {
         value = totalAmountInCents - allocated;
      } else {
         value = Math.round(split.value * ratio);
         allocated += value;
      }

      result.push({
         categoryId: split.categoryId,
         splitType: "amount",
         value,
      });
   }

   return result;
}

export function isPercentageSumValid(splits: CategorySplitConfig[]): boolean {
   const sum = splits.reduce((acc, s) => acc + s.value, 0);
   return Math.abs(100 - sum) <= PERCENTAGE_TOLERANCE;
}

export function getPercentageRemaining(splits: CategorySplitConfig[]): number {
   const sum = splits.reduce((acc, s) => acc + s.value, 0);
   return 100 - sum;
}

function normalizeText(text: string): string {
   return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
}

export function parseDynamicSplits(
   description: string,
   categoryMap: Map<string, string>,
   totalAmountInCents: number,
   pattern?: string,
): CategorySplit[] | null {
   const matches: { name: string; percentage: number }[] = [];

   const normalizedDescription = normalizeText(description);

   const regexToUse = pattern
      ? new RegExp(pattern, "gi")
      : /(\w+)\s+(\d+(?:[.,]\d+)?)\s*%/gi;

   let match = regexToUse.exec(normalizedDescription);
   while (match !== null) {
      const name = match[1];
      const percentageStr = match[2]?.replace(",", ".");
      if (name && percentageStr) {
         const percentage = Number.parseFloat(percentageStr);
         if (!Number.isNaN(percentage) && percentage > 0) {
            matches.push({ name: normalizeText(name), percentage });
         }
      }
      match = regexToUse.exec(normalizedDescription);
   }

   if (matches.length === 0) return null;

   const resolvedSplits: CategorySplitConfig[] = [];

   for (const { name, percentage } of matches) {
      let categoryId: string | undefined;

      if (categoryMap.has(name)) {
         categoryId = categoryMap.get(name);
      } else {
         for (const [key, id] of categoryMap) {
            if (key.includes(name) || name.includes(key)) {
               categoryId = id;
               break;
            }
         }
      }

      if (categoryId) {
         resolvedSplits.push({ categoryId, value: percentage });
      }
   }

   if (resolvedSplits.length === 0) return null;

   return calculateSplitsFromPercentage(resolvedSplits, totalAmountInCents);
}

export function createCategoryMap(
   categories: { id: string; name: string }[],
): Map<string, string> {
   const map = new Map<string, string>();
   for (const category of categories) {
      map.set(normalizeText(category.name), category.id);
   }
   return map;
}

/**
 * Recalculates splits when categories change.
 * - Keeps existing splits for categories that remain
 * - Distributes remaining amount equally to new categories
 * - Returns null if only 1 category (no split needed)
 */
export function recalculateSplitsForNewCategories(
   existingSplits: CategorySplit[] | null | undefined,
   newCategoryIds: string[],
   totalAmountInCents: number,
): CategorySplit[] | null {
   // No splits needed for single category
   if (newCategoryIds.length <= 1) return null;

   // If no existing splits, distribute equally
   if (!existingSplits || existingSplits.length === 0) {
      return calculateEqualSplits(newCategoryIds, totalAmountInCents);
   }

   // Keep existing splits for categories that remain
   const keptSplits = existingSplits.filter((s) =>
      newCategoryIds.includes(s.categoryId),
   );

   // Find new categories that don't have splits
   const newCategoriesWithoutSplits = newCategoryIds.filter(
      (id) => !existingSplits.some((s) => s.categoryId === id),
   );

   // If all categories are new, distribute equally
   if (keptSplits.length === 0) {
      return calculateEqualSplits(newCategoryIds, totalAmountInCents);
   }

   // If no new categories, just keep existing (but may need adjustment)
   if (newCategoriesWithoutSplits.length === 0) {
      // Adjust proportionally to match total
      return adjustFixedSplitsProportionally(
         keptSplits.map((s) => ({ categoryId: s.categoryId, value: s.value })),
         totalAmountInCents,
      );
   }

   // Calculate remaining amount for new categories
   const keptTotal = keptSplits.reduce((sum, s) => sum + s.value, 0);
   const remaining = totalAmountInCents - keptTotal;

   // If remaining is negative or zero, redistribute everything proportionally
   if (remaining <= 0) {
      const allCategorySplits = [
         ...keptSplits.map((s) => ({
            categoryId: s.categoryId,
            value: s.value,
         })),
         ...newCategoriesWithoutSplits.map((id) => ({
            categoryId: id,
            value: 0,
         })),
      ];
      return adjustFixedSplitsProportionally(
         allCategorySplits,
         totalAmountInCents,
      );
   }

   // Distribute remaining equally among new categories
   const baseValue = Math.floor(remaining / newCategoriesWithoutSplits.length);
   const remainder = remaining % newCategoriesWithoutSplits.length;

   const newSplits: CategorySplit[] = newCategoriesWithoutSplits.map(
      (categoryId, index) => ({
         categoryId,
         splitType: "amount" as const,
         value: baseValue + (index < remainder ? 1 : 0),
      }),
   );

   return [...keptSplits, ...newSplits];
}
