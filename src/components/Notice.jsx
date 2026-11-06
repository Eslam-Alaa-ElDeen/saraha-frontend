// The single way to show feedback. Color is never the only signal: each type has a text prefix.
const STYLES = {
  error: "bg-phosphor text-abyss",
  success: "bg-kelp text-mist",
  info: "bg-deep text-mist",
};
const PREFIX = { error: "Error: ", success: "Done: ", info: "" };

export default function Notice({ type = "info", children }) {
  if (!children) return null;
  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`mb-5 rounded-ctl px-4 py-3 text-sm ${STYLES[type]}`}
    >
      <span className="font-medium">{PREFIX[type]}</span>
      {children}
    </div>
  );
}
