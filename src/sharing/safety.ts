// Privacy safeguard: checks that child-submitted text (project title, custom strings)
// does not accidentally contain phone numbers, emails, addresses, or school details.
// Tone rule: friendly kid-language, explaining that personal secrets should stay private.

export interface SafetyCheckResult {
  safe: boolean;
  warning?: string;
}

const PHONE_REGEX = /(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b|\b\d{10}\b/;
const EMAIL_REGEX = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const SCHOOL_REGEX = /\b(?:school|vidyalaya|academy|convent|public\s+school|international\s+school)\b/i;

export function scanChildText(text: string): SafetyCheckResult {
  if (!text || !text.trim()) return { safe: true };

  if (PHONE_REGEX.test(text)) {
    return {
      safe: false,
      warning: "It looks like there's a phone number here! Keep personal phone numbers private.",
    };
  }

  if (EMAIL_REGEX.test(text)) {
    return {
      safe: false,
      warning: "It looks like there's an email address here! Keep email addresses private.",
    };
  }

  if (SCHOOL_REGEX.test(text)) {
    return {
      safe: false,
      warning: "It looks like a school name is mentioned. For safety, keep school names private.",
    };
  }

  // Check for pincodes specifically when preceded by "pin" or "pincode"
  if (/(?:pin|pincode|postal|zip)\s*:?\s*[1-9][0-9]{5}/i.test(text)) {
    return {
      safe: false,
      warning: "It looks like an address or PIN code is mentioned. Keep addresses private.",
    };
  }

  return { safe: true };
}
