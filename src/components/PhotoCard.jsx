import { useEffect, useState } from "react";
import { uploadProfilePhoto, uploadUrl } from "../api.js";
import { checkImages } from "../validate.js";
import Notice from "./Notice.jsx";

export default function PhotoCard() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [uploaded, setUploaded] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Local preview. Always revoke the object URL.
  useEffect(() => {
    if (!file) { setPreview(""); return undefined; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function choose(e) {
    const picked = e.target.files?.[0] ?? null;
    setUploaded("");
    setError(picked ? checkImages([picked]) : "");
    setFile(picked && !checkImages([picked]) ? picked : null);
    e.target.value = "";
  }

  async function submit(e) {
    e.preventDefault();
    if (!file) return;
    setSubmitting(true);
    setError("");
    try {
      const path = await uploadProfilePhoto(file);
      setUploaded(path);
      setFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const shown = preview || (uploaded ? uploadUrl(uploaded) : "");

  return (
    <section className="card" aria-labelledby="photo-title">
      <h2 id="photo-title" className="mb-5 text-2xl tracking-[-0.02em]">Profile photo</h2>
      <Notice type="error">{error}</Notice>
      <Notice type="success">{uploaded && !file ? "Profile photo uploaded." : ""}</Notice>

      {shown && (
        <img src={shown} alt="Profile photo preview" className="mb-5 h-32 w-32 rounded-card bg-deep object-cover" />
      )}

      <form onSubmit={submit}>
        <label htmlFor="photo-file" className="eyebrow mb-2 block">Choose an image (JPEG, PNG or GIF, max 5 MB)</label>
        <input id="photo-file" type="file" accept="image/jpeg,image/png,image/gif" onChange={choose} className="input mb-5" />
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn-primary" disabled={!file || submitting}>
            {submitting ? "Uploading…" : "Upload"}
          </button>
          {file && (
            <button type="button" className="btn-secondary" onClick={() => setFile(null)}>Remove</button>
          )}
        </div>
      </form>
      <p className="mt-4 text-xs">The photo is shown here right after upload. The profile API does not return it yet.</p>
    </section>
  );
}
