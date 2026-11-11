/** Renders admin-edited headings: `*word*` → gold italic, `{city}` → shop city. Plain text only (no HTML). */
export function RichTitle({ text, city, accent = "text-gold-600" }: { text: string; city: string; accent?: string }) {
  const parts = text.replaceAll("{city}", city).split("*");
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <em key={i} className={`font-serif italic ${accent}`}>
            {p}
          </em>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}
