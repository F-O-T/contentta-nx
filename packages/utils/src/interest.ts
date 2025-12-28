export type PenaltyType = "none" | "percentage" | "fixed";
export type InterestType = "none" | "daily" | "monthly";
export type MonetaryCorrectionIndex = "none" | "ipca" | "selic" | "cdi";

export type InterestConfig = {
   penaltyType: PenaltyType;
   penaltyValue: number | null;
   interestType: InterestType;
   interestValue: number | null;
   monetaryCorrectionIndex: MonetaryCorrectionIndex;
   gracePeriodDays: number;
};

export type InterestRates = {
   ipca: number;
   selic: number;
   cdi: number;
};

export type InterestCalculationResult = {
   daysOverdue: number;
   effectiveDaysOverdue: number;
   penaltyAmount: number;
   interestAmount: number;
   correctionAmount: number;
   totalInterest: number;
   updatedAmount: number;
};

export function calculateDaysOverdue(
   dueDate: Date,
   referenceDate?: Date,
): number {
   const today = referenceDate ?? new Date();
   const dueDateNormalized = new Date(dueDate);
   dueDateNormalized.setHours(0, 0, 0, 0);

   const todayNormalized = new Date(today);
   todayNormalized.setHours(0, 0, 0, 0);

   const diffTime = todayNormalized.getTime() - dueDateNormalized.getTime();
   const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

   return Math.max(0, diffDays);
}

export function calculatePenalty(
   originalAmount: number,
   penaltyType: PenaltyType,
   penaltyValue: number | null,
): number {
   if (penaltyType === "none" || penaltyValue === null) {
      return 0;
   }

   if (penaltyType === "fixed") {
      return penaltyValue;
   }

   if (penaltyType === "percentage") {
      return originalAmount * (penaltyValue / 100);
   }

   return 0;
}

export function calculateMoraInterest(
   originalAmount: number,
   effectiveDaysOverdue: number,
   interestType: InterestType,
   interestValue: number | null,
): number {
   if (
      interestType === "none" ||
      interestValue === null ||
      effectiveDaysOverdue <= 0
   ) {
      return 0;
   }

   if (interestType === "daily") {
      return originalAmount * (interestValue / 100) * effectiveDaysOverdue;
   }

   if (interestType === "monthly") {
      const months = effectiveDaysOverdue / 30;
      return originalAmount * (interestValue / 100) * months;
   }

   return 0;
}

export function calculateMonetaryCorrection(
   originalAmount: number,
   daysOverdue: number,
   index: MonetaryCorrectionIndex,
   rates: InterestRates,
): number {
   if (index === "none" || daysOverdue <= 0) {
      return 0;
   }

   const annualRate = rates[index];
   if (!annualRate) {
      return 0;
   }

   const dailyRate = annualRate / 365;
   return originalAmount * (dailyRate / 100) * daysOverdue;
}

export function calculateInterest(
   originalAmount: number,
   dueDate: Date,
   config: InterestConfig,
   rates: InterestRates,
   referenceDate?: Date,
): InterestCalculationResult {
   const daysOverdue = calculateDaysOverdue(dueDate, referenceDate);

   if (daysOverdue <= 0) {
      return {
         correctionAmount: 0,
         daysOverdue: 0,
         effectiveDaysOverdue: 0,
         interestAmount: 0,
         penaltyAmount: 0,
         totalInterest: 0,
         updatedAmount: originalAmount,
      };
   }

   const effectiveDaysOverdue = Math.max(
      0,
      daysOverdue - config.gracePeriodDays,
   );

   const penaltyAmount =
      effectiveDaysOverdue > 0
         ? calculatePenalty(
              originalAmount,
              config.penaltyType,
              config.penaltyValue,
           )
         : 0;

   const interestAmount = calculateMoraInterest(
      originalAmount,
      effectiveDaysOverdue,
      config.interestType,
      config.interestValue,
   );

   const correctionAmount = calculateMonetaryCorrection(
      originalAmount,
      effectiveDaysOverdue,
      config.monetaryCorrectionIndex,
      rates,
   );

   const totalInterest = penaltyAmount + interestAmount + correctionAmount;
   const updatedAmount = originalAmount + totalInterest;

   return {
      correctionAmount: Math.round(correctionAmount * 100) / 100,
      daysOverdue,
      effectiveDaysOverdue,
      interestAmount: Math.round(interestAmount * 100) / 100,
      penaltyAmount: Math.round(penaltyAmount * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      updatedAmount: Math.round(updatedAmount * 100) / 100,
   };
}

export function formatInterestBreakdown(
   result: InterestCalculationResult,
   config: InterestConfig,
   originalAmount: number,
): {
   lines: { label: string; value: number }[];
   total: number;
} {
   const lines: { label: string; value: number }[] = [
      { label: "Valor Original", value: originalAmount },
   ];

   if (result.penaltyAmount > 0) {
      const penaltyLabel =
         config.penaltyType === "percentage"
            ? `Multa (${config.penaltyValue}%)`
            : `Multa (fixo)`;
      lines.push({ label: penaltyLabel, value: result.penaltyAmount });
   }

   if (result.interestAmount > 0) {
      const interestLabel =
         config.interestType === "daily"
            ? `Juros (${config.interestValue}%/dia × ${result.effectiveDaysOverdue})`
            : `Juros (${config.interestValue}%/mês × ${(result.effectiveDaysOverdue / 30).toFixed(1)})`;
      lines.push({ label: interestLabel, value: result.interestAmount });
   }

   if (result.correctionAmount > 0) {
      const indexName = config.monetaryCorrectionIndex.toUpperCase();
      lines.push({
         label: `${indexName} (${result.effectiveDaysOverdue} dias)`,
         value: result.correctionAmount,
      });
   }

   return {
      lines,
      total: result.updatedAmount,
   };
}

export function isOverdue(dueDate: Date, referenceDate?: Date): boolean {
   return calculateDaysOverdue(dueDate, referenceDate) > 0;
}

export function isWithinGracePeriod(
   dueDate: Date,
   gracePeriodDays: number,
   referenceDate?: Date,
): boolean {
   const daysOverdue = calculateDaysOverdue(dueDate, referenceDate);
   return daysOverdue > 0 && daysOverdue <= gracePeriodDays;
}
