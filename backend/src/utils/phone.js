// Indian phone number normalization.
//
// Accepts user-friendly forms and returns E.164 (+91XXXXXXXXXX) when valid,
// or null when not. We deliberately keep this strict — anything that doesn't
// resolve to a valid Indian mobile number is rejected at the schema layer.
//
// Accepted inputs (after stripping spaces, dashes, parens):
//   9876543210
//   +919876543210
//   919876543210
//   09876543210     (leading-zero variant some users type)
//
// Indian mobile rule: 10 digits, starting with 6/7/8/9.

const INDIAN_MOBILE_PREFIX_RE = /^[6-9]\d{9}$/;

export function normalizeIndianPhone(input) {
    if (input === undefined || input === null) return null;
    const stripped = String(input).replace(/[\s\-()]/g, '');

    let digits;
    if (stripped.startsWith('+91')) {
        digits = stripped.slice(3);
    } else if (stripped.startsWith('91') && stripped.length === 12) {
        digits = stripped.slice(2);
    } else if (stripped.startsWith('0') && stripped.length === 11) {
        digits = stripped.slice(1);
    } else {
        digits = stripped;
    }

    if (!INDIAN_MOBILE_PREFIX_RE.test(digits)) return null;
    return `+91${digits}`;
}

export function isValidIndianPhone(input) {
    return normalizeIndianPhone(input) !== null;
}
