import { Link } from "react-router-dom";
import { uploadUrl } from "../api.js";

// Renders one message. Used by the inbox list and by the detail page.
// Content is always rendered as plain text (never as HTML).
export default function MessageCard({ message, meId, full = false, onDelete }) {
  const received = message.receiverId === meId;
  // senderId is a plain ID, or an object { _id, userName, image } when populated.
  const senderObj = typeof message.senderId === "object" ? message.senderId : null;
  const senderId = senderObj?._id ?? message.senderId;
  const sender = !senderId
    ? "Anonymous"
    : senderId === meId
      ? "You"
      : senderObj?.userName || "A registered user";
  const attachments = message.attachments ?? [];

  return (
    <article className="card">
      <p className="eyebrow mb-4">
        {received ? "Received" : "Sent"} · {received ? sender : "by you"} ·{" "}
        <time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString()}</time>
      </p>

      {message.content && (
        <p
          className={`whitespace-pre-wrap break-words text-base text-mist ${full ? "" : "line-clamp-6"}`}
        >
          {message.content}
        </p>
      )}

      {attachments.length > 0 && (
        <ul className="mt-5 flex list-none flex-wrap gap-3 p-0">
          {attachments.map((path, i) => (
            <li key={path}>
              <a href={uploadUrl(path)} target="_blank" rel="noopener noreferrer">
                <img
                  src={uploadUrl(path)}
                  alt={`Attachment ${i + 1}`}
                  loading="lazy"
                  className="h-28 w-28 rounded-ctl bg-deep object-cover"
                />
              </a>
            </li>
          ))}
        </ul>
      )}

      {(!full || onDelete) && (
        <div className="mt-6 flex flex-wrap gap-3">
          {!full && (
            <Link to={`/messages/${message._id}`} className="btn-secondary">Open</Link>
          )}
          {onDelete && (
            <button type="button" className="btn-secondary" onClick={() => onDelete(message._id)}>
              Delete
            </button>
          )}
        </div>
      )}
    </article>
  );
}