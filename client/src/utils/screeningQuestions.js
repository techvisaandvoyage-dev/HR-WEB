export const SCREENING_QUESTION_TYPES = ['Yes/No', 'Short Text', 'Number', 'Dropdown'];
export const DEFAULT_SCREENING_TEXT_MAX_LENGTH = 16;
export const MIN_SCREENING_TEXT_MAX_LENGTH = 1;
export const MAX_SCREENING_TEXT_MAX_LENGTH = 500;
export const DEFAULT_SCREENING_NUMBER_MAX_DIGITS = 16;
export const MIN_SCREENING_NUMBER_MAX_DIGITS = 1;
export const MAX_SCREENING_NUMBER_MAX_DIGITS = 100;

export const getScreeningTextMaxLength = (question) => {
  const maxLength = Number(question?.maxLength);
  return Number.isInteger(maxLength)
    && maxLength >= MIN_SCREENING_TEXT_MAX_LENGTH
    && maxLength <= MAX_SCREENING_TEXT_MAX_LENGTH
    ? maxLength
    : DEFAULT_SCREENING_TEXT_MAX_LENGTH;
};

export const getScreeningNumberMaxDigits = (question) => {
  const maxDigits = Number(question?.maxDigits);
  return Number.isInteger(maxDigits)
    && maxDigits >= MIN_SCREENING_NUMBER_MAX_DIGITS
    && maxDigits <= MAX_SCREENING_NUMBER_MAX_DIGITS
    ? maxDigits
    : DEFAULT_SCREENING_NUMBER_MAX_DIGITS;
};

export const countScreeningNumberDigits = (value) => String(value ?? '').replace(/\D/g, '').length;

export const normalizeScreeningOptions = (options) => (
  Array.isArray(options)
    ? options.map((option) => String(option ?? '').trim()).filter(Boolean)
    : []
);

export const validateScreeningAnswer = (question, answer) => {
  const value = String(answer ?? '').trim();
  const required = question?.required !== false;

  if (!value) {
    return required ? 'Please provide an answer for this question.' : '';
  }

  if (question?.type === 'Number' && !Number.isFinite(Number(value))) {
    return 'Please enter a valid number.';
  }

  if (question?.type === 'Number') {
    const maxDigits = getScreeningNumberMaxDigits(question);
    if (countScreeningNumberDigits(value) > maxDigits) {
      return `Please enter no more than ${maxDigits} digits.`;
    }
  }

  if (question?.type === 'Short Text') {
    const maxLength = getScreeningTextMaxLength(question);
    if (value.length > maxLength) {
      return `Please keep your answer to ${maxLength} characters or fewer.`;
    }
  }

  if (question?.type === 'Yes/No' && !['Yes', 'No'].includes(value)) {
    return 'Please select Yes or No.';
  }

  if (question?.type === 'Dropdown' && !normalizeScreeningOptions(question.options).includes(value)) {
    return 'Please select one of the listed options.';
  }

  return '';
};
