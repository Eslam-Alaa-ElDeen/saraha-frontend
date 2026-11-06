import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { deleteMessage, getMessages } from "../api.js";
import { escapeRegex } from "../validate.js";
import MessageCard from "../components/MessageCard.jsx";
import Notice from "../components/Notice.jsx";

const LIMIT = 10;
const TABS = [
  ["2", "All"],
  ["0", "Received"],
  ["1", "Sent"],
];

export default function MessagesPage() {
  const { userId } = useAuth();
  const [type, setType] = useState("2");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null); // { messages, count, totalPages }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");
    // Always send type, page and limit: backend defaults are not applied.
    getMessages({ type, page, limit: LIMIT, search: search ? escapeRegex(search) : "" })
      .then((result) => { if (!ignore) setData(result); })
      .catch((err) => { if (!ignore) setError(err.message); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [type, search, page, reloadKey]);

  function changeType(next) {
    setType(next);
    setPage(1);
  }

  function submitSearch(e) {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  function clearSearch() {
    setSearchInput("");
    setSearch("");
    setPage(1);
  }

  async function remove(id) {
    if (!window.confirm("Delete this message permanently?")) return;
    try {
      await deleteMessage(id);
      // If that was the last item on this page, step back one page.
      if (data && data.messages.length === 1 && page > 1) setPage(page - 1);
      else setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err.message);
    }
  }

  const messages = data?.messages ?? [];

  return (
    <div className="mx-auto max-w-[760px] py-8">
      <div className="mb-10">
        <p className="eyebrow mb-3">Inbox</p>
        <div className="flex items-end gap-4">
          <span className="stat">{data ? data.count : "–"}</span>
          <span className="eyebrow pb-2">{search ? "matching messages" : "messages"}</span>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Message type">
        {TABS.map(([value, label]) => (
          <button key={value} type="button" className="tab" aria-pressed={type === value} onClick={() => changeType(value)}>
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={submitSearch} className="mb-8 flex flex-wrap gap-3" role="search">
        <label htmlFor="search" className="sr-only">Search messages</label>
        <input id="search" className="input !w-auto min-w-0 flex-1" placeholder="Search messages" maxLength={100} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        <button type="submit" className="btn-secondary">Search</button>
      </form>

      {error && (
        <>
          <Notice type="error">{error}</Notice>
          <button type="button" className="btn-secondary mb-6" onClick={() => setReloadKey((k) => k + 1)}>Retry</button>
        </>
      )}

      {loading && !data && <p>Loading messages…</p>}

      {data && messages.length === 0 && !loading && (
        <div className="card-deep">
          {search ? (
            <>
              <p className="mb-4 text-mist">No messages match “{search}”.</p>
              <button type="button" className="btn-secondary" onClick={clearSearch}>Clear search</button>
            </>
          ) : (
            <>
              <p className="mb-4 text-mist">
                {type === "1" ? "You have not sent any messages yet." : "No messages yet. They appear here when someone writes to your link."}
              </p>
              <Link to="/profile" className="btn-secondary">Get my link</Link>
            </>
          )}
        </div>
      )}

      <div className={`grid gap-5 ${loading && data ? "opacity-60" : ""}`}>
        {messages.map((m) => (
          <MessageCard key={m._id} message={m} meId={userId} onDelete={remove} />
        ))}
      </div>

      {data && data.totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-between" aria-label="Pagination">
          <button type="button" className="btn-secondary" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>Previous</button>
          <span className="eyebrow">Page {page} of {data.totalPages}</span>
          <button type="button" className="btn-secondary" disabled={page >= data.totalPages || loading} onClick={() => setPage(page + 1)}>Next</button>
        </nav>
      )}
    </div>
  );
}
