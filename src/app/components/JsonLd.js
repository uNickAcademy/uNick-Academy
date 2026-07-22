// Renderuje dane strukturalne JSON-LD jako <script type="application/ld+json">.
// Server component — brak interaktywności, dane wstrzykiwane w SSR, więc
// widoczne dla wyszukiwarek i botów AI bez wykonywania JS.
export default function JsonLd({ data }) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <>
      {payload.map((node, i) => (
        <script
          key={i}
          type="application/ld+json"
          // Dane pochodzą z naszej konfiguracji (nie od użytkownika), więc
          // serializacja JSON jest bezpieczna.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(node) }}
        />
      ))}
    </>
  );
}
