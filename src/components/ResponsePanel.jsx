export default function ResponsePanel({ title, value, tone = "default" }) {
  if (!value) return null;

  return (
    <div className={`response-panel response-panel--${tone}`}>
      <div className="response-panel__title">{title}</div>
      <pre>{typeof value === "string" ? value : JSON.stringify(value, null, 2)}</pre>
    </div>
  );
}
