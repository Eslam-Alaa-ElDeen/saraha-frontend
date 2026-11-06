import { useEffect, useRef } from "react";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const existing = document.querySelector("script[data-gsi]");
    if (existing) return existing.addEventListener("load", resolve);
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.dataset.gsi = "1";
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// Wraps Google Identity Services. Calls onToken with the Google ID token (never an access token).
// Renders nothing when no client ID is configured or the script cannot load.
export default function GoogleButton({ onToken }) {
  const box = useRef(null);
  const callback = useRef(onToken);
  callback.current = onToken;

  useEffect(() => {
    if (!CLIENT_ID) return undefined;
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled || !box.current) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => callback.current(response.credential),
        });
        window.google.accounts.id.renderButton(box.current, {
          theme: "filled_black",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!CLIENT_ID) return null;
  return (
    <div className="mt-6">
      <p className="eyebrow mb-3 text-center">or</p>
      <div ref={box} className="flex justify-center" />
    </div>
  );
}
