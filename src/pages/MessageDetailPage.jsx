import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { deleteMessage, getMessage } from "../api.js";
import { isObjectId } from "../validate.js";
import MessageCard from "../components/MessageCard.jsx";
import Notice from "../components/Notice.jsx";

export default function MessageDetailPage() {
  const { messageId } = useParams();
  const { userId } = useAuth();
  const navigate = useNavigate();
  const validId = isObjectId(messageId);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(validId);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(!validId);

  useEffect(() => {
    if (!validId) return undefined; // invalid ID: no request
    let ignore = false;
    setLoading(true);
    setError("");
    getMessage(messageId)
      .then((m) => { if (!ignore) setMessage(m); })
      .catch((err) => {
        if (ignore) return;
        if (err.status === 404) setNotFound(true);
        else setError(err.message);
      })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [messageId, validId]);

  async function remove() {
    if (!window.confirm("Delete this message permanently?")) return;
    try {
      await deleteMessage(messageId);
      navigate("/messages", { replace: true });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-[760px] py-8">
      <Link to="/messages" className="eyebrow mb-6 inline-block no-underline">← Back to inbox</Link>
      {loading && <p>Loading…</p>}
      <Notice type="error">{error}</Notice>
      {notFound && (
        <div className="card-deep">
          <h1 className="mb-3 text-2xl">Message not found</h1>
          <p>It may have been deleted, or the link is not valid.</p>
        </div>
      )}
      {message && !notFound && <MessageCard message={message} meId={userId} full onDelete={remove} />}
    </div>
  );
}
