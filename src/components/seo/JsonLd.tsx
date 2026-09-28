interface JsonLdProps {
  /**
   * A pre-serialised JSON-LD payload. Use `graph()` from @/lib/seo/schema to
   * combine several nodes and let their @id references resolve.
   */
  data: string;
}

/**
 * Emits a JSON-LD <script> block into the server-rendered HTML.
 *
 * This deliberately does not use `next/script`. Structured data must be
 * present in the initial response: crawlers and AI agents frequently read the
 * raw HTML before any JavaScript runs, and a `strategy="afterInteractive"`
 * script is invisible to them. Rendering it inline is also a few bytes
 * cheaper than a client-side injection.
 *
 * The `</script>` sequence is escaped so that a member-supplied business name
 * or product title containing "</script>" cannot break out of the tag and
 * inject markup — these strings come from user data.
 */
export function JsonLd({ data }: JsonLdProps) {
  const safe = data.replace(/</g, '\\u003c');

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger -- required to emit JSON-LD
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
