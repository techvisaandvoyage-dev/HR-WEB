/**
 * Formats a salary value cleanly across SahiJob.
 * If the salary contains only an additional note (e.g. "Performance Bonus included", "Negotiable"),
 * it prepends "CTC: " so candidates and employers see "CTC: Performance Bonus included".
 */
export function formatSalary(val, note = '') {
  let s = (val !== undefined && val !== null && String(val).trim() !== '' && String(val).trim() !== 'Not specified')
    ? String(val).trim()
    : (note !== undefined && note !== null && String(note).trim() !== '' ? String(note).trim() : '');

  if (!s) return 'As per industry standards';

  // Normalize common unit variations
  s = s
    .replace(/lacs\s*pa/gi, 'PA')
    .replace(/lac\s*pa/gi, 'PA')
    .replace(/lpa/gi, 'PA')
    .replace(/per\s*month/gi, 'PM')
    .replace(/per\s*hour/gi, 'PH')
    .trim();

  // If wrapped in outer parentheses e.g. "(Performance Bonus included)"
  if (/^\((.+)\)$/.test(s)) {
    s = s.replace(/^\((.+)\)$/, (_, inner) => inner.trim());
  }

  const sLower = s.toLowerCase();
  const isGenericPlaceholder =
    sLower === 'as per industry standards' ||
    sLower === 'not specified' ||
    sLower === 'competitive' ||
    sLower === 'salary not specified';

  if (isGenericPlaceholder) {
    return s;
  }

  // If it already starts with CTC, normalize to "CTC: "
  if (/^ctc:?\s*/i.test(s)) {
    return s.replace(/^ctc:?\s*/i, 'CTC: ');
  }

  // If there are NO digits and NO currency symbols (₹, $, €, £), it is purely a note
  // Prepend "CTC: "
  if (!/[\d₹$€£]/.test(s)) {
    return `CTC: ${s}`;
  }

  return s;
}

/**
 * Builds the finalSalary string for saving jobs when posting or editing.
 */
export function buildJobSalary(min, max, salaryType, cSym, salaryNote) {
  const hasRange = min && max;
  const baseSalary = hasRange
    ? (salaryType === 'Yearly'
        ? `${cSym} ${min}-${max} PA`
        : `${cSym}${min} - ${cSym}${max} ${salaryType === 'Monthly' ? 'PM' : 'PH'}`)
    : '';
  const trimmedNote = (salaryNote || '').trim();

  if (baseSalary && trimmedNote) {
    return `${baseSalary} (${trimmedNote})`;
  }
  if (baseSalary) {
    return baseSalary;
  }
  if (trimmedNote) {
    return /^ctc:?\s*/i.test(trimmedNote)
      ? trimmedNote.replace(/^ctc:?\s*/i, 'CTC: ')
      : `CTC: ${trimmedNote}`;
  }
  return 'Not specified';
}

/**
 * Formats the live Listing Salary Preview for employers in PostJob.
 */
export function getListingSalaryPreview(min, max, salaryType, cSym, salaryNote) {
  const hasRange = min && max;
  const baseSalary = hasRange
    ? (salaryType === 'Yearly'
        ? `${cSym} ${min}-${max} PA`
        : `${cSym}${min} - ${cSym}${max} ${salaryType === 'Monthly' ? 'PM' : 'PH'}`)
    : '';
  const trimmedNote = (salaryNote || '').trim();

  if (baseSalary && trimmedNote) {
    return `${baseSalary} (${trimmedNote})`;
  }
  if (baseSalary) {
    return baseSalary;
  }
  if (trimmedNote) {
    return /^ctc:?\s*/i.test(trimmedNote)
      ? trimmedNote.replace(/^ctc:?\s*/i, 'CTC: ')
      : `CTC: ${trimmedNote}`;
  }
  return !min ? 'Not specified' : '';
}
