import { differenceInYears, parseISO } from "date-fns";

export type AgeGroup = "U-15" | "U-17" | "U-20" | "U-23" | "Senior";

const AGE_GROUP_LIMITS: Record<string, number> = {
  "U-15": 15,
  "U-17": 17,
  "U-20": 20,
  "U-23": 23,
};

/**
 * Calculate age at a given reference date
 */
export function calculateAge(dateOfBirth: string, referenceDate?: string): number {
  const dob = parseISO(dateOfBirth);
  const ref = referenceDate ? parseISO(referenceDate) : new Date();
  return differenceInYears(ref, dob);
}

/**
 * Determine age category based on player's age
 */
export function getAgeCategory(dateOfBirth: string, referenceDate?: string): AgeGroup {
  const age = calculateAge(dateOfBirth, referenceDate);
  if (age < 15) return "U-15";
  if (age < 17) return "U-17";
  if (age < 20) return "U-20";
  if (age < 23) return "U-23";
  return "Senior";
}

/**
 * Check if a player is eligible for a competition based on age group
 * Returns { eligible, age, maxAge, message }
 */
export function checkAgeEligibility(
  dateOfBirth: string,
  ageGroup: string | null,
  cutoffDate?: string | null
): {
  eligible: boolean;
  age: number;
  maxAge: number | null;
  category: AgeGroup;
  message: string;
} {
  const refDate = cutoffDate || undefined;
  const age = calculateAge(dateOfBirth, refDate);
  const category = getAgeCategory(dateOfBirth, refDate);

  // No age restriction
  if (!ageGroup || ageGroup === "Senior") {
    return {
      eligible: true,
      age,
      maxAge: null,
      category,
      message: `Usia ${age} tahun (${category})`,
    };
  }

  const maxAge = AGE_GROUP_LIMITS[ageGroup];
  if (!maxAge) {
    return {
      eligible: true,
      age,
      maxAge: null,
      category,
      message: `Usia ${age} tahun (${category})`,
    };
  }

  const eligible = age < maxAge;
  return {
    eligible,
    age,
    maxAge,
    category,
    message: eligible
      ? `✅ Usia ${age} tahun — memenuhi syarat ${ageGroup}`
      : `❌ Usia ${age} tahun — melebihi batas ${ageGroup} (maks ${maxAge - 1} tahun)`,
  };
}

/**
 * Get badge color based on age category
 */
export function getAgeCategoryColor(category: AgeGroup): string {
  switch (category) {
    case "U-15": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
    case "U-17": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "U-20": return "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200";
    case "U-23": return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
    case "Senior": return "bg-muted text-muted-foreground";
    default: return "bg-muted text-muted-foreground";
  }
}
