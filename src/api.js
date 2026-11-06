// The ONLY file that talks to the backend and the only one that touches tokens.
// Backend facts this file accounts for are documented in FINAL_FRONTEND_IMPLEMENTATION_PLAN.md §3.

const BASE = import.meta.env.VITE_API_URL ?? "/api";

// ---------------------------------------------------------------- tokens
const ACCESS = "saraha_access";
const REFRESH = "saraha_refresh";

export const getTokens = () => ({
  access: localStorage.getItem(ACCESS),
  refresh: localStorage.getItem(REFRESH),
});

export const saveTokens = (t) => {
  localStorage.setItem(ACCESS, t.access_token);
  localStorage.setItem(REFRESH, t.refresh_token);
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
};

// Reads the (unverified) JWT payload. Used only to schedule refreshes and to show
// the user's own share link. Never used for authorization: the server decides that.
const decode = (jwt) => JSON.parse(atob(jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));

export const userIdFromToken = (jwt = getTokens().access) => {
  try {
    return decode(jwt).user.sub ?? null;
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------- errors
export class ApiError extends Error {
  constructor(status, message, fieldErrors = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

// Error shapes the backend can return (plan §3.1):
//   400 { message, arrError: [{ message, path, key }] }
//   any thrown error { error, error_message, stack }   <- text is in error_message
//   429 { message }
//   Google endpoint failure: HTTP 200 with a bare string body
function toApiError(status, data) {
  if (typeof data === "string") return new ApiError(status, data);

  const fieldErrors = {};
  if (Array.isArray(data?.arrError)) {
    for (const item of data.arrError) {
      if (item.path && !(item.path in fieldErrors)) fieldErrors[item.path] = item.message;
    }
  }

  let message = data?.error_message ?? data?.message;
  if (status >= 500 || !message) message = "Something went wrong. Please try again.";
  return new ApiError(status, message, fieldErrors);
}

// ---------------------------------------------------------------- session / refresh
function endSession() {
  clearTokens();
  window.location.assign("/login");
  throw new ApiError(401, "Your session has ended. Please log in again.");
}

async function rotate() {
  const { refresh } = getTokens();
  if (!refresh) endSession();
  try {
    const body = await request("/user/rotate-token", { method: "POST", token: refresh });
    saveTokens(body.data);
  } catch {
    endSession();
  }
}

// Only one rotation at a time: refresh tokens are single use.
let refreshing = null;
const refreshTokens = () => (refreshing ??= rotate().finally(() => { refreshing = null; }));

// The backend answers an expired JWT with HTTP 500 (not 401), so we read `exp`
// ourselves and rotate shortly BEFORE the token expires (backend allows ~30 s ahead).
async function freshAccessToken() {
  const { access } = getTokens();
  if (!access) endSession();
  let exp = 0;
  try { exp = decode(access).exp * 1000; } catch { endSession(); }
  if (exp - 20_000 > Date.now()) return access;
  await refreshTokens();
  return getTokens().access;
}

// ---------------------------------------------------------------- one request function
async function request(path, { method = "GET", body, query, token } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }
  const qs = query ? "?" + new URLSearchParams(query) : "";

  let res;
  try {
    res = await fetch(BASE + path + qs, { method, headers, body });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Check your connection and try again.");
  }

  const data = await res.json().catch(() => null); // body may be empty
  if (res.status === 401 && token) endSession();
  if (!res.ok || typeof data === "string") throw toApiError(res.status, data);
  return data; // envelope: { status, message, data }
}

// Protected call: attaches a fresh access token first.
const authed = async (path, options = {}) =>
  request(path, { ...options, token: await freshAccessToken() });

// ---------------------------------------------------------------- helpers
// Stored paths look like "uploads/message/<uuid>.png"; Express serves ./uploads at /uploads.
// Google users have a full https URL as image; uploaded photos are relative paths.
export const uploadUrl = (path) =>
  /^https?:\/\//i.test(path) ? path : `/${String(path).replace(/^\/+/, "")}`; // same-origin /uploads/...

// ================================================================ ENDPOINTS
// ---- auth (public) -------------------------------------------------------
// #1
export const signup = (fields) => request("/auth/signup", { method: "POST", body: fields });

// #2. New Google accounts get unusable tokens on the first call (backend bug), so
// repeat the call once with the same ID token. Remove this once the backend is fixed.
export async function signInWithGoogle(idToken) {
  const call = () => request("/auth/signup-with-gmail", { method: "POST", body: { idToken } });
  let body = await call();
  if (body?.status === 201) body = await call();
  if (!body?.data?.access_token) throw new ApiError(200, "Google sign-in failed. Please try again.");
  return body.data;
}

// #3. Returns { access_token, refresh_token } or null when a 2FA code was emailed.
export async function login(fields) {
  const body = await request("/auth/login", { method: "POST", body: fields });
  return body?.data?.access_token ? body.data : null;
}

// #4
export const confirmEmail = (email, otp) =>
  request("/auth/confirm_otp", { method: "PATCH", body: { email, otp } });

// #5
export const resendOtp = (email) => request("/auth/resend_otp", { method: "POST", body: { email } });

// #6
export const requestPasswordReset = (email) =>
  request("/auth/forget_password_send_otp", { method: "POST", body: { email } });

// #7
export const resetPassword = ({ email, otp, newPassword }) =>
  request("/auth/update_password", { method: "PATCH", body: { email, otp, newPassword } });

// #10
export async function confirmTwoFactorLogin(email, otp) {
  const body = await request("/auth/login-confirm-email-two-factor-authentication", {
    method: "POST",
    body: { email, otp },
  });
  return body.data;
}

// ---- auth (protected) ----------------------------------------------------
// #8   status: 1 = enable, 0 = disable
export const requestTwoFactorOtp = (status) =>
  authed("/auth/send-otp-two-factor", { method: "POST", body: { status } });

// #9
export const confirmTwoFactorOtp = (otp, status) =>
  authed("/auth/confirm-otp-two-factor", { method: "PATCH", body: { otp, status } });

// ---- user ----------------------------------------------------------------
// #11  -> { name, email, gender }
export const getProfile = async () => (await authed("/user/profile")).data;

// #13  all = true logs out every device. The body is required by the backend.
export async function logout(all = false) {
  try {
    await authed("/user/logout", { method: "POST", body: { actions: all ? 0 : 1 } });
  } catch {
    /* ignore: local tokens are cleared below regardless */
  }
  clearTokens();
}

// #14  -> "uploads/user/<uuid>.<ext>"
export async function uploadProfilePhoto(file) {
  const form = new FormData();
  form.append("attachment", file); // field name is `attachment` (singular)
  return (await authed("/user/profile_photo", { method: "POST", body: form })).data;
}

// ---- messages ------------------------------------------------------------
// #15  Always send type, page and limit: backend defaults are not applied (plan §3.2 #1).
//      `messages` comes back as an object keyed "0","1"..., so use Object.values.
export async function getMessages({ type, page, limit, search }) {
  // `populate` is safe ONLY after the backend whitelists the populated fields (userName, image).
  const query = { type, page, limit, populate: "senderId" };
  if (search) query.search = search;
  const d = (await authed("/message", { query })).data ?? {};
  return {
    messages: Object.values(d.messages ?? {}),
    count: Number(d.count) || 0,
    totalPages: Number(d.totalPages) || 0,
    page: Number(d.page) || page,
  };
}

// #17
export const getMessage = async (id) => (await authed(`/message/${id}`)).data;

// #16
export const deleteMessage = (id) => authed(`/message/${id}`, { method: "DELETE" });

// #18 (anonymous) and #19 (as the logged-in user)
export async function sendMessage({ receiverId, content, files, asMe }) {
  const form = new FormData();
  form.append("receiverId", receiverId);
  if (content) form.append("content", content);
  files.forEach((f) => form.append("attachments", f)); // repeated field `attachments`
  if (asMe) return authed("/message/by-account", { method: "POST", body: form });
  return request("/message", { method: "POST", body: form });
}