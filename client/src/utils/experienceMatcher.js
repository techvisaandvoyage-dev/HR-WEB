/**
 * Helper to parse an experience string into numeric { min, max } years.
 * Examples:
 *   "12 - 34 Yrs" -> { min: 12, max: 34 }
 *   "16 - 20 Yrs" -> { min: 16, max: 20 }
 *   "0 - 1 Yrs" -> { min: 0, max: 1 }
 *   "Fresher" -> { min: 0, max: 1 }
 *   "25+ yrs" -> { min: 25, max: 99 }
 *   "5 Years" -> { min: 5, max: 5 }
 */
export const parseExperienceRange = (str) => {
  if (!str || typeof str !== 'string') return null;
  const s = str.trim().toLowerCase();
  if (s === 'all' || s === 'any' || s === 'any experience') return null;

  // Fresher or intern keywords
  if (s.includes('fresher') || s.includes('intern') || s.includes('trainee') || s.includes('months')) {
    const nums = s.match(/\d+/g);
    if (!nums || nums.length <= 1) {
      return { min: 0, max: 1 };
    }
  }

  // Check for X+ (e.g. "25+ yrs", "5+ Yrs")
  const plusMatch = s.match(/(\d+)\s*\+/);
  if (plusMatch) {
    return { min: parseInt(plusMatch[1], 10), max: 99 };
  }

  // Extract all numbers
  const nums = s.match(/\d+/g);
  if (!nums || nums.length === 0) return null;

  if (nums.length >= 2) {
    const n1 = parseInt(nums[0], 10);
    const n2 = parseInt(nums[1], 10);
    return {
      min: Math.min(n1, n2),
      max: Math.max(n1, n2)
    };
  }

  if (nums.length === 1) {
    const single = parseInt(nums[0], 10);
    return { min: single, max: single };
  }

  return null;
};

/**
 * Checks if a job's experience range matches or overlaps with a selected experience filter.
 * For example:
 *   jobExp: "12 - 34 Yrs", filterExp: "16 - 20 Yrs" -> returns true because 16-20 is inside 12-34.
 */
export const isExperienceMatch = (jobExp, filterExp) => {
  if (!filterExp || filterExp === 'All' || filterExp === 'Any' || filterExp === 'Any Experience') {
    return true;
  }
  if (!jobExp) return false;

  const jobExpStr = String(jobExp).trim();
  const filterExpStr = String(filterExp).trim();

  // Direct substring / equality match check
  if (jobExpStr.toLowerCase().includes(filterExpStr.toLowerCase())) {
    return true;
  }

  const fRange = parseExperienceRange(filterExpStr);
  const jRange = parseExperienceRange(jobExpStr);

  if (!fRange) return true;

  if (!jRange) {
    // If job experience is 'Not specified' or 'Any'
    if (jobExpStr.toLowerCase().includes('any') || jobExpStr.toLowerCase().includes('not specified')) {
      return true;
    }
    return false;
  }

  // Two ranges [A, B] and [C, D] overlap if max(A, C) <= min(B, D)
  return Math.max(fRange.min, jRange.min) <= Math.min(fRange.max, jRange.max);
};
