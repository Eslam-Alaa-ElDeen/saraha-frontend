import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { sendMessage } from "../api.js";
import { checkImages, checkMessage, isObjectId, MAX_IMAGES } from "../validate.js";
import Field from "../components/Field.jsx";
import Notice from "../components/Notice.jsx";

export default function PublicMessagePage() {
  const { recipientId } = useParams();
  const { isLoggedIn } = useAuth();
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [asMe, setAsMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState({ type: "info", text: "" });
  const [submitting, setSubmitting] = useState(false);
  const fileInput = useRef(null);

  // Object URLs for thumbnails; revoked when files change or the page unmounts.
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  if (!isObjectId(recipientId)) {
    return (
      <div className="mx-auto max-w-[600px] py-16">
        <div className="card-deep">
          <h1 className="mb-3 text-3xl">This link is not valid</h1>
          <p className="mb-6">Check that you copied the whole link.</p>
          <Link to="/" className="btn-secondary">Go home</Link>
        </div>
      </div>
    );
  }

  function addFiles(e) {
    const next = [...files, ...Array.from(e.target.files ?? [])];
    e.target.value = "";
    const problem = checkImages(next);
    if (problem) return setErrors({ files: problem });
    setErrors({});
    setFiles(next);
  }

  function removeFile(index) {
    setFiles(files.filter((_, i) => i !== index));
    setErrors({});
  }

  async function submit(e) {
    e.preventDefault();
    setNotice({ type: "info", text: "" });
    const problem = checkMessage(content, files);
    if (problem) return setErrors({ content: problem });
    setErrors({});

    setSubmitting(true);
    try {
      await sendMessage({ receiverId: recipientId, content: content.trim(), files, asMe: isLoggedIn && asMe });
      setContent("");
      setFiles([]);
      setNotice({ type: "success", text: "Message sent." });
    } catch (err) {
      if (err.status === 404) setNotice({ type: "error", text: "This link is not valid: the recipient was not found." });
      else if (err.fieldErrors.content) setErrors({ content: err.fieldErrors.content });
      else setNotice({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[600px] py-10">
      <div className="card">
        <p className="eyebrow mb-3">Saraha</p>
        <h1 className="mb-3 text-4xl">Send an honest message</h1>
        <p className="mb-8">{isLoggedIn && asMe ? "Your name will be attached to this message." : "Your identity stays private. No account needed."}</p>
        <Notice type={notice.type}>{notice.text}</Notice>

        <form onSubmit={submit} noValidate>
          <Field label="Message" name="content" as="textarea" value={content} onChange={(e) => setContent(e.target.value)} error={errors.content} maxLength={10000} placeholder="Write something kind, honest and useful…" />

          <div className="mb-5">
            <label htmlFor="attachments" className="eyebrow mb-2 block">Images (optional, up to {MAX_IMAGES})</label>
            <input id="attachments" ref={fileInput} type="file" accept="image/jpeg,image/png,image/gif" multiple className="input" onChange={addFiles} />
            {errors.files && <p className="mt-2 text-sm text-danger-soft"><span className="font-medium">Error:</span> {errors.files}</p>}
            {files.length > 0 && (
              <ul className="mt-4 flex list-none flex-wrap gap-3 p-0">
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="w-24">
                    <img src={previews[i]} alt={`Preview of ${f.name}`} className="h-24 w-24 rounded-ctl bg-deep object-cover" />
                    <button type="button" className="nav-link mt-2" onClick={() => removeFile(i)}>Remove</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {isLoggedIn && (
            <label className="mb-6 flex items-center gap-3 text-sm text-mist">
              <input type="checkbox" checked={asMe} onChange={(e) => setAsMe(e.target.checked)} />
              Send as myself (not anonymous)
            </label>
          )}

          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? "Sending…" : "Send message"}
          </button>
        </form>
      </div>
    </div>
  );
}