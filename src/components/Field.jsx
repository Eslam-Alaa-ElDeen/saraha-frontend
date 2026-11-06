// Label + control + error text. `as` can be "input" (default), "textarea" or "select".
export default function Field({ label, name, error, hint, as: Tag = "input", children, ...props }) {
  const id = `field-${name}`;
  return (
    <div className="mb-5">
      <label htmlFor={id} className="eyebrow mb-2 block">{label}</label>
      <Tag
        id={id}
        name={name}
        className="input"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      >
        {children}
      </Tag>
      {hint && !error && <p className="mt-2 text-xs">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-mist">
          <span className="font-medium">Error:</span> {error}
        </p>
      )}
    </div>
  );
}
