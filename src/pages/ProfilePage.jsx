import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext.jsx";
import { getProfile, uploadUrl } from "../api.js";
import Notice from "../components/Notice.jsx";
import PhotoCard from "../components/PhotoCard.jsx";
import TwoFactorCard from "../components/TwoFactorCard.jsx";

export default function ProfilePage() {
  const { userId, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");
    getProfile()
      .then((p) => { if (!ignore) setProfile(p); })
      .catch((err) => { if (!ignore) setError(err.message); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [reloadKey]);

  // The user's own ID comes from their token (the profile API does not return it).
  const shareLink = userId ? `${window.location.origin}/u/${userId}` : "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      document.getElementById("share-link")?.select(); // fallback: select so the user can copy
    }
  }

  function logoutEverywhere() {
    if (window.confirm("Log out of all devices?")) signOut(true);
  }

  return (
    <div className="mx-auto grid max-w-[760px] gap-5 py-8">
      <div>
        <p className="eyebrow mb-3">Account</p>
        <h1 className="text-4xl">{profile ? profile.name : "Profile"}</h1>
      </div>

      {loading && <p>Loading profile…</p>}
      {error && (
        <div>
          <Notice type="error">{error}</Notice>
          <button type="button" className="btn-secondary" onClick={() => setReloadKey((k) => k + 1)}>Retry</button>
        </div>
      )}

      {profile && (
        <section className="card" aria-labelledby="profile-title">
          <h2 id="profile-title" className="mb-5 text-2xl tracking-[-0.02em]">Details</h2>
          {profile.image && (
            <img src={uploadUrl(profile.image)} referrerPolicy="no-referrer" alt="Your profile photo" className="mb-5 h-24 w-24 rounded-card bg-deep object-cover" />
          )}
          <dl className="m-0 grid gap-4">
            <div><dt className="eyebrow">Name</dt><dd className="m-0 text-mist">{profile.name}</dd></div>
            <div><dt className="eyebrow">Email</dt><dd className="m-0 break-all text-mist">{profile.email}</dd></div>
            <div><dt className="eyebrow">Gender</dt><dd className="m-0 capitalize text-mist">{profile.gender}</dd></div>
          </dl>
        </section>
      )}

      {shareLink && (
        <section className="card" aria-labelledby="share-title">
          <h2 id="share-title" className="mb-2 text-2xl tracking-[-0.02em]">Your link</h2>
          <p className="mb-5 text-sm">Share it anywhere. Anyone who opens it can send you an anonymous message.</p>
          <label htmlFor="share-link" className="sr-only">Your share link</label>
          <input id="share-link" readOnly className="input mb-4" value={shareLink} onFocus={(e) => e.target.select()} />
          <button type="button" className="btn-primary" onClick={copy}>{copied ? "Copied" : "Copy link"}</button>
        </section>
      )}

      <PhotoCard current={profile?.image ?? ""} />
      <TwoFactorCard />

      <section className="card" aria-labelledby="session-title">
        <h2 id="session-title" className="mb-5 text-2xl tracking-[-0.02em]">Session</h2>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-secondary" onClick={() => signOut(false)}>Log out</button>
          <button type="button" className="btn-secondary" onClick={logoutEverywhere}>Log out of all devices</button>
        </div>
      </section>
    </div>
  );
}