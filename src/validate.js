// Small pure validators that mirror the backend rules (Joi + Mongoose).
// Client checks are only for fast feedback; the server stays authoritative.

export const MAX_IMAGES = 3;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif"];

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254;
export const isOtp = (v) => /^\d{6}$/.test(v);
export const isPassword = (v) => v.length >= 8 && v.length <= 128;
export const isPhone = (v) => /^\d{11}$/.test(v);
export const isNamePart = (v) => /^\S{2,30}$/.test(v);
export const isObjectId = (v) => /^[a-f0-9]{24}$/i.test(v ?? "");

export const digitsOnly = (v) => v.replace(/\D/g, "").slice(0, 6);

// The backend uses `search` as a regular expression, so escape it (plan §3.2 #4).
export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function checkSignup(v) {
  const e = {};
  if (!isNamePart(v.firstName)) e.firstName = "First name must be 2-30 characters, no spaces.";
  if (!isNamePart(v.lastName)) e.lastName = "Last name must be 2-30 characters, no spaces.";
  if (!isEmail(v.email)) e.email = "Enter a valid email address.";
  if (!isPassword(v.password)) e.password = "Password must be 8-128 characters.";
  if (!isPhone(v.phone)) e.phone = "Phone number must be exactly 11 digits.";
  if (v.DOB && new Date(v.DOB) > new Date()) e.DOB = "Date of birth cannot be in the future.";
  return e;
}

// Returns an error string, or "" when the selection is fine.
export function checkImages(files) {
  if (files.length > MAX_IMAGES) return `Up to ${MAX_IMAGES} images.`;
  for (const f of files) {
    if (!IMAGE_TYPES.includes(f.type)) return "Only JPEG, PNG or GIF images.";
    if (f.size > MAX_IMAGE_BYTES) return "Each image must be 5 MB or smaller.";
  }
  return "";
}

export function checkMessage(content, files) {
  const text = content.trim();
  if (!text && files.length === 0) return "Write a message or attach an image.";
  if (text && text.length < 2) return "Write at least 2 characters.";
  if (text.length > 10000) return "Message cannot exceed 10,000 characters.";
  return "";
}
