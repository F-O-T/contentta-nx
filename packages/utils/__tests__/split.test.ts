import { describe, expect, it } from "bun:test";
import {
   adjustFixedSplitsProportionally,
   type CategorySplit,
   calculateEqualSplits,
   calculateSplitsFromPercentage,
   createCategoryMap,
   getPercentageRemaining,
   getRemainingAmount,
   isPercentageSumValid,
   isSplitSumValid,
   parseDynamicSplits,
   validateCategorySplits,
} from "../src/split";

describe("split utilities", () => {
   describe("validateCategorySplits", () => {
      const categoryIds = ["cat-1", "cat-2", "cat-3"];

      it("should return valid for null splits", () => {
         const result = validateCategorySplits(null, categoryIds, 10000);
         expect(result.isValid).toBe(true);
         expect(result.errors).toEqual([]);
      });

      it("should return valid for undefined splits", () => {
         const result = validateCategorySplits(undefined, categoryIds, 10000);
         expect(result.isValid).toBe(true);
         expect(result.errors).toEqual([]);
      });

      it("should return valid for empty splits array", () => {
         const result = validateCategorySplits([], categoryIds, 10000);
         expect(result.isValid).toBe(true);
         expect(result.errors).toEqual([]);
      });

      it("should return valid when splits sum matches total", () => {
         const splits: CategorySplit[] = [
            { categoryId: "cat-1", splitType: "amount", value: 5000 },
            { categoryId: "cat-2", splitType: "amount", value: 5000 },
         ];
         const result = validateCategorySplits(splits, categoryIds, 10000);
         expect(result.isValid).toBe(true);
         expect(result.errors).toEqual([]);
      });

      it("should return valid when splits sum is within tolerance (1 cent)", () => {
         const splits: CategorySplit[] = [
            { categoryId: "cat-1", splitType: "amount", value: 5000 },
            { categoryId: "cat-2", splitType: "amount", value: 4999 },
         ];
         const result = validateCategorySplits(splits, categoryIds, 10000);
         expect(result.isValid).toBe(true);
      });

      it("should return invalid when splits sum exceeds tolerance", () => {
         const splits: CategorySplit[] = [
            { categoryId: "cat-1", splitType: "amount", value: 5000 },
            { categoryId: "cat-2", splitType: "amount", value: 4998 },
         ];
         const result = validateCategorySplits(splits, categoryIds, 10000);
         expect(result.isValid).toBe(false);
         expect(result.errors.length).toBeGreaterThan(0);
      });

      it("should return invalid for splits with invalid category IDs", () => {
         const splits: CategorySplit[] = [
            { categoryId: "invalid-cat", splitType: "amount", value: 5000 },
            { categoryId: "cat-2", splitType: "amount", value: 5000 },
         ];
         const result = validateCategorySplits(splits, categoryIds, 10000);
         expect(result.isValid).toBe(false);
         expect(result.errors).toContain("Split contains invalid category IDs");
      });

      it("should return invalid for negative split values", () => {
         const splits: CategorySplit[] = [
            { categoryId: "cat-1", splitType: "amount", value: -5000 },
            { categoryId: "cat-2", splitType: "amount", value: 15000 },
         ];
         const result = validateCategorySplits(splits, categoryIds, 10000);
         expect(result.isValid).toBe(false);
         expect(result.errors).toContain("Split values cannot be negative");
      });

      it("should return multiple errors when multiple validations fail", () => {
         const splits: CategorySplit[] = [
            { categoryId: "invalid-cat", splitType: "amount", value: -1000 },
            { categoryId: "cat-2", splitType: "amount", value: 5000 },
         ];
         const result = validateCategorySplits(splits, categoryIds, 10000);
         expect(result.isValid).toBe(false);
         expect(result.errors.length).toBeGreaterThan(1);
      });

      it("should handle single category split", () => {
         const splits: CategorySplit[] = [
            { categoryId: "cat-1", splitType: "amount", value: 10000 },
         ];
         const result = validateCategorySplits(splits, categoryIds, 10000);
         expect(result.isValid).toBe(true);
      });

      it("should handle many category splits", () => {
         const splits: CategorySplit[] = [
            { categoryId: "cat-1", splitType: "amount", value: 3333 },
            { categoryId: "cat-2", splitType: "amount", value: 3333 },
            { categoryId: "cat-3", splitType: "amount", value: 3334 },
         ];
         const result = validateCategorySplits(splits, categoryIds, 10000);
         expect(result.isValid).toBe(true);
      });

      it("should handle zero value splits", () => {
         const splits: CategorySplit[] = [
            { categoryId: "cat-1", splitType: "amount", value: 10000 },
            { categoryId: "cat-2", splitType: "amount", value: 0 },
         ];
         const result = validateCategorySplits(splits, categoryIds, 10000);
         expect(result.isValid).toBe(true);
      });
   });

   describe("isSplitSumValid", () => {
      it("should return true when sum equals total", () => {
         const splits: CategorySplit[] = [
            { categoryId: "cat-1", splitType: "amount", value: 5000 },
            { categoryId: "cat-2", splitType: "amount", value: 5000 },
         ];
         expect(isSplitSumValid(splits, 10000)).toBe(true);
      });

      it("should return true when sum is within 1 cent tolerance", () => {
         const splits: CategorySplit[] = [
            { categoryId: "cat-1", splitType: "amount", value: 5000 },
            { categoryId: "cat-2", splitType: "amount", value: 4999 },
         ];
         expect(isSplitSumValid(splits, 10000)).toBe(true);
      });

      it("should return false when sum exceeds tolerance (below)", () => {
         const splits: CategorySplit[] = [
            { categoryId: "cat-1", splitType: "amount", value: 5000 },
            { categoryId: "cat-2", splitType: "amount", value: 4997 },
         ];
         expect(isSplitSumValid(splits, 10000)).toBe(false);
      });

      it("should return false when sum exceeds tolerance (above)", () => {
         const splits: CategorySplit[] = [
            { categoryId: "cat-1", splitType: "amount", value: 5000 },
            { categoryId: "cat-2", splitType: "amount", value: 5003 },
         ];
         expect(isSplitSumValid(splits, 10000)).toBe(false);
      });

      it("should handle empty splits array", () => {
         expect(isSplitSumValid([], 0)).toBe(true);
      });

      it("should handle single split", () => {
         const splits: CategorySplit[] = [
            { categoryId: "cat-1", splitType: "amount", value: 10000 },
         ];
         expect(isSplitSumValid(splits, 10000)).toBe(true);
      });
   });

   describe("getRemainingAmount", () => {
      it("should return 0 when splits sum equals total", () => {
         const splits: CategorySplit[] = [
            { categoryId: "cat-1", splitType: "amount", value: 5000 },
            { categoryId: "cat-2", splitType: "amount", value: 5000 },
         ];
         expect(getRemainingAmount(splits, 10000)).toBe(0);
      });

      it("should return positive when splits sum is less than total", () => {
         const splits: CategorySplit[] = [
            { categoryId: "cat-1", splitType: "amount", value: 3000 },
            { categoryId: "cat-2", splitType: "amount", value: 4000 },
         ];
         expect(getRemainingAmount(splits, 10000)).toBe(3000);
      });

      it("should return negative when splits sum exceeds total", () => {
         const splits: CategorySplit[] = [
            { categoryId: "cat-1", splitType: "amount", value: 6000 },
            { categoryId: "cat-2", splitType: "amount", value: 6000 },
         ];
         expect(getRemainingAmount(splits, 10000)).toBe(-2000);
      });

      it("should return total when splits array is empty", () => {
         expect(getRemainingAmount([], 10000)).toBe(10000);
      });

      it("should handle single split", () => {
         const splits: CategorySplit[] = [
            { categoryId: "cat-1", splitType: "amount", value: 7500 },
         ];
         expect(getRemainingAmount(splits, 10000)).toBe(2500);
      });

      it("should handle zero total", () => {
         const splits: CategorySplit[] = [
            { categoryId: "cat-1", splitType: "amount", value: 0 },
         ];
         expect(getRemainingAmount(splits, 0)).toBe(0);
      });
   });

   describe("calculateEqualSplits", () => {
      it("should return empty array for empty categoryIds", () => {
         const result = calculateEqualSplits([], 10000);
         expect(result).toEqual([]);
      });

      it("should return single split for one category", () => {
         const result = calculateEqualSplits(["cat-1"], 10000);
         expect(result).toEqual([
            { categoryId: "cat-1", splitType: "amount", value: 10000 },
         ]);
      });

      it("should divide equally between two categories", () => {
         const result = calculateEqualSplits(["cat-1", "cat-2"], 10000);
         expect(result).toEqual([
            { categoryId: "cat-1", splitType: "amount", value: 5000 },
            { categoryId: "cat-2", splitType: "amount", value: 5000 },
         ]);
      });

      it("should handle remainder by distributing extra cents to first categories", () => {
         const result = calculateEqualSplits(
            ["cat-1", "cat-2", "cat-3"],
            10000,
         );
         expect(result).toEqual([
            { categoryId: "cat-1", splitType: "amount", value: 3334 },
            { categoryId: "cat-2", splitType: "amount", value: 3333 },
            { categoryId: "cat-3", splitType: "amount", value: 3333 },
         ]);
      });

      it("should handle remainder with 2 cents left", () => {
         const result = calculateEqualSplits(
            ["cat-1", "cat-2", "cat-3"],
            10001,
         );
         expect(result[0]?.value).toBe(3334);
         expect(result[1]?.value).toBe(3334);
         expect(result[2]?.value).toBe(3333);
         expect(result.reduce((sum, s) => sum + s.value, 0)).toBe(10001);
      });

      it("should handle small amounts", () => {
         const result = calculateEqualSplits(["cat-1", "cat-2"], 3);
         expect(result[0]?.value).toBe(2);
         expect(result[1]?.value).toBe(1);
      });

      it("should handle zero total", () => {
         const result = calculateEqualSplits(["cat-1", "cat-2"], 0);
         expect(result[0]?.value).toBe(0);
         expect(result[1]?.value).toBe(0);
      });
   });

   describe("calculateSplitsFromPercentage", () => {
      it("should return empty array for empty splits", () => {
         const result = calculateSplitsFromPercentage([], 10000);
         expect(result).toEqual([]);
      });

      it("should return empty array when all percentages are zero", () => {
         const result = calculateSplitsFromPercentage(
            [
               { categoryId: "cat-1", value: 0 },
               { categoryId: "cat-2", value: 0 },
            ],
            10000,
         );
         expect(result).toEqual([]);
      });

      it("should calculate 50/50 split correctly", () => {
         const result = calculateSplitsFromPercentage(
            [
               { categoryId: "cat-1", value: 50 },
               { categoryId: "cat-2", value: 50 },
            ],
            10000,
         );
         expect(result[0]?.value).toBe(5000);
         expect(result[1]?.value).toBe(5000);
      });

      it("should calculate 70/30 split correctly", () => {
         const result = calculateSplitsFromPercentage(
            [
               { categoryId: "cat-1", value: 70 },
               { categoryId: "cat-2", value: 30 },
            ],
            10000,
         );
         expect(result[0]?.value).toBe(7000);
         expect(result[1]?.value).toBe(3000);
      });

      it("should handle rounding and assign remainder to last category", () => {
         const result = calculateSplitsFromPercentage(
            [
               { categoryId: "cat-1", value: 33.33 },
               { categoryId: "cat-2", value: 33.33 },
               { categoryId: "cat-3", value: 33.34 },
            ],
            10000,
         );
         const sum = result.reduce((acc, s) => acc + s.value, 0);
         expect(sum).toBe(10000);
      });

      it("should normalize percentages that do not sum to 100", () => {
         const result = calculateSplitsFromPercentage(
            [
               { categoryId: "cat-1", value: 50 },
               { categoryId: "cat-2", value: 25 },
            ],
            10000,
         );
         expect(result[0]?.value).toBe(6667);
         expect(result[1]?.value).toBe(3333);
      });

      it("should handle single category with 100%", () => {
         const result = calculateSplitsFromPercentage(
            [{ categoryId: "cat-1", value: 100 }],
            10000,
         );
         expect(result[0]?.value).toBe(10000);
      });
   });

   describe("adjustFixedSplitsProportionally", () => {
      it("should return empty array for empty splits", () => {
         const result = adjustFixedSplitsProportionally([], 10000);
         expect(result).toEqual([]);
      });

      it("should return equal splits when all values are zero", () => {
         const result = adjustFixedSplitsProportionally(
            [
               { categoryId: "cat-1", value: 0 },
               { categoryId: "cat-2", value: 0 },
            ],
            10000,
         );
         expect(result[0]?.value).toBe(5000);
         expect(result[1]?.value).toBe(5000);
      });

      it("should return same values when sum matches total", () => {
         const result = adjustFixedSplitsProportionally(
            [
               { categoryId: "cat-1", value: 6000 },
               { categoryId: "cat-2", value: 4000 },
            ],
            10000,
         );
         expect(result[0]?.value).toBe(6000);
         expect(result[1]?.value).toBe(4000);
      });

      it("should scale up when configured total is less than actual", () => {
         const result = adjustFixedSplitsProportionally(
            [
               { categoryId: "cat-1", value: 5000 },
               { categoryId: "cat-2", value: 3000 },
            ],
            10000,
         );
         expect(result[0]?.value).toBe(6250);
         expect(result[1]?.value).toBe(3750);
      });

      it("should scale down when configured total exceeds actual", () => {
         const result = adjustFixedSplitsProportionally(
            [
               { categoryId: "cat-1", value: 7000 },
               { categoryId: "cat-2", value: 3000 },
            ],
            5000,
         );
         expect(result[0]?.value).toBe(3500);
         expect(result[1]?.value).toBe(1500);
      });

      it("should ensure sum equals total after adjustment", () => {
         const result = adjustFixedSplitsProportionally(
            [
               { categoryId: "cat-1", value: 5000 },
               { categoryId: "cat-2", value: 3000 },
               { categoryId: "cat-3", value: 2000 },
            ],
            7777,
         );
         const sum = result.reduce((acc, s) => acc + s.value, 0);
         expect(sum).toBe(7777);
      });
   });

   describe("isPercentageSumValid", () => {
      it("should return true when sum equals 100", () => {
         const result = isPercentageSumValid([
            { categoryId: "cat-1", value: 70 },
            { categoryId: "cat-2", value: 30 },
         ]);
         expect(result).toBe(true);
      });

      it("should return true within tolerance", () => {
         const result = isPercentageSumValid([
            { categoryId: "cat-1", value: 33.34 },
            { categoryId: "cat-2", value: 33.33 },
            { categoryId: "cat-3", value: 33.33 },
         ]);
         expect(result).toBe(true);
      });

      it("should return false when sum is too low", () => {
         const result = isPercentageSumValid([
            { categoryId: "cat-1", value: 50 },
            { categoryId: "cat-2", value: 40 },
         ]);
         expect(result).toBe(false);
      });

      it("should return false when sum exceeds 100", () => {
         const result = isPercentageSumValid([
            { categoryId: "cat-1", value: 70 },
            { categoryId: "cat-2", value: 40 },
         ]);
         expect(result).toBe(false);
      });

      it("should handle empty array", () => {
         const result = isPercentageSumValid([]);
         expect(result).toBe(false);
      });
   });

   describe("getPercentageRemaining", () => {
      it("should return 0 when sum equals 100", () => {
         const result = getPercentageRemaining([
            { categoryId: "cat-1", value: 70 },
            { categoryId: "cat-2", value: 30 },
         ]);
         expect(result).toBe(0);
      });

      it("should return positive when sum is below 100", () => {
         const result = getPercentageRemaining([
            { categoryId: "cat-1", value: 50 },
            { categoryId: "cat-2", value: 30 },
         ]);
         expect(result).toBe(20);
      });

      it("should return negative when sum exceeds 100", () => {
         const result = getPercentageRemaining([
            { categoryId: "cat-1", value: 70 },
            { categoryId: "cat-2", value: 50 },
         ]);
         expect(result).toBe(-20);
      });

      it("should return 100 for empty array", () => {
         const result = getPercentageRemaining([]);
         expect(result).toBe(100);
      });
   });

   describe("createCategoryMap", () => {
      it("should create map with normalized category names", () => {
         const categories = [
            { id: "cat-1", name: "Alimentação" },
            { id: "cat-2", name: "Limpeza" },
         ];
         const map = createCategoryMap(categories);
         expect(map.get("alimentacao")).toBe("cat-1");
         expect(map.get("limpeza")).toBe("cat-2");
      });

      it("should normalize accents and uppercase", () => {
         const categories = [{ id: "cat-1", name: "EDUCAÇÃO" }];
         const map = createCategoryMap(categories);
         expect(map.get("educacao")).toBe("cat-1");
      });

      it("should handle empty categories array", () => {
         const map = createCategoryMap([]);
         expect(map.size).toBe(0);
      });

      it("should trim whitespace from names", () => {
         const categories = [{ id: "cat-1", name: "  Saúde  " }];
         const map = createCategoryMap(categories);
         expect(map.get("saude")).toBe("cat-1");
      });
   });

   describe("parseDynamicSplits", () => {
      const categories = [
         { id: "cat-1", name: "Alimentação" },
         { id: "cat-2", name: "Limpeza" },
         { id: "cat-3", name: "Outros" },
      ];
      const categoryMap = createCategoryMap(categories);

      it("should parse basic percentage pattern", () => {
         const result = parseDynamicSplits(
            "alimentacao 70% limpeza 30%",
            categoryMap,
            10000,
         );
         expect(result).not.toBeNull();
         expect(result?.length).toBe(2);
         expect(result?.find((s) => s.categoryId === "cat-1")?.value).toBe(
            7000,
         );
         expect(result?.find((s) => s.categoryId === "cat-2")?.value).toBe(
            3000,
         );
      });

      it("should parse description with extra text", () => {
         const result = parseDynamicSplits(
            "SUPERMERCADO XYZ alimentacao 80% limpeza 20%",
            categoryMap,
            10000,
         );
         expect(result).not.toBeNull();
         expect(result?.find((s) => s.categoryId === "cat-1")?.value).toBe(
            8000,
         );
         expect(result?.find((s) => s.categoryId === "cat-2")?.value).toBe(
            2000,
         );
      });

      it("should handle accented category names in description", () => {
         const result = parseDynamicSplits(
            "Alimentação 50% Limpeza 50%",
            categoryMap,
            10000,
         );
         expect(result).not.toBeNull();
         expect(result?.length).toBe(2);
      });

      it("should return null when no matches found", () => {
         const result = parseDynamicSplits(
            "SUPERMERCADO XYZ compra normal",
            categoryMap,
            10000,
         );
         expect(result).toBeNull();
      });

      it("should return null when no categories match", () => {
         const result = parseDynamicSplits(
            "unknown 50% invalid 50%",
            categoryMap,
            10000,
         );
         expect(result).toBeNull();
      });

      it("should handle partial category name match", () => {
         const result = parseDynamicSplits(
            "alim 70% limp 30%",
            categoryMap,
            10000,
         );
         expect(result).not.toBeNull();
      });

      it("should handle decimal percentages", () => {
         const result = parseDynamicSplits(
            "alimentacao 33.33% limpeza 33.33% outros 33.34%",
            categoryMap,
            10000,
         );
         expect(result).not.toBeNull();
         const sum = result?.reduce((acc, s) => acc + s.value, 0);
         expect(sum).toBe(10000);
      });

      it("should handle percentages with comma as decimal separator", () => {
         const result = parseDynamicSplits(
            "alimentacao 33,5% limpeza 66,5%",
            categoryMap,
            10000,
         );
         expect(result).not.toBeNull();
         expect(result?.length).toBe(2);
      });

      it("should use custom pattern when provided", () => {
         const customMap = createCategoryMap([
            { id: "cat-1", name: "food" },
            { id: "cat-2", name: "clean" },
         ]);
         const result = parseDynamicSplits(
            "food 70% clean 30%",
            customMap,
            10000,
            "(\\w+)\\s+(\\d+)%",
         );
         expect(result).not.toBeNull();
         expect(result?.length).toBe(2);
      });
   });
});
