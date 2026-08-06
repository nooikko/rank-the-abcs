/**
 * Renders a JSON-LD payload as the `<script type="application/ld+json">` tag
 * that search engines and crawlers look for.
 *
 * The `<` replacement is the part worth keeping: `JSON.stringify` will happily
 * emit a literal `</script>` if one ever reaches it through the data, which
 * closes the tag early and turns whatever follows into markup. Escaping every
 * `<` to its unicode form is still valid JSON and cannot terminate the element.
 * Nothing on this site currently feeds user input into a payload — but the
 * escape costs one pass over a short string, and the alternative is remembering
 * this the day something does.
 *
 * A plain `<script>` rather than `next/script`: this is data for a parser, not
 * code to execute, so there is nothing for a loading strategy to optimise.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: the only way to emit JSON-LD, and the payload is escaped
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
