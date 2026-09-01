# Contributing

Corrections are welcome, especially from people running indexers.

## What this documentation must be

**Grounded.** Every factual claim traces to the [Dogecoin TAP
specification](https://github.com/Trac-Systems/doge-tap-protocol-specs), to
[ord-dogecoin](https://github.com/Trac-Systems/ord-dogecoin), or to the Bitcoin Universe codebase.
Where a rule is a Bitcoin Universe indexing decision rather than the protocol itself, it is
labelled **Universe decision** so an implementer can tell the two apart.

**Honest about support.** Code existing is not capability released. Do not add a claim that a
wallet, marketplace, or indexer supports something without a source that shows it wired up. When
in doubt, omit it or say plainly that it is not currently supported in Bitcoin Universe products.

**Specific about Dogecoin.** This protocol is easy to describe as "TAP, but on Dogecoin", and that
framing causes real losses. Where Dogecoin differs, say concretely how, with the number or the
rule, not a general remark about a different chain.

## House style

- Never use an em dash character. Use commas, colons, periods, or parentheses.
- For the idea of a definitive source, write "authoritative", "owning", "official", or "the source
  of truth". Do not reach for the Latinate synonym that starts with a c; it is banned across this
  workspace and reads as jargon anyway.
- Plain, direct writing. No filler, no unsupported superlatives, no urgency, no placeholders, no
  "coming soon".
- Prefer a diagram or a table to a wall of text.

## Technical constraints

- Static HTML, CSS, and vanilla JavaScript. No build step, no framework, no CDN, no external
  fonts, no trackers.
- All ordinary content must work with JavaScript disabled. Scripts may only enhance.
- Dark and light themes must both meet WCAG 2.2 AA contrast.
- Responsive to 320px wide with no horizontal page overflow. Wide tables and code blocks scroll
  inside their own container.
- Semantic landmarks, a skip link, visible focus, correct heading order, and a text alternative on
  every diagram.
- Diagrams are inline SVG using the CSS custom properties for stroke and fill, so they stay legible
  in both themes.

## When you change content

1. Update `search-index.json` if you add or rename a heading.
2. Update `sitemap.xml` and `llms.txt` if you add or remove a page.
3. Add a `changelog.html` entry.
4. Update `lastVerified` in `docs.manifest.json`, and validate the manifest against the Bitcoin
   Universe documentation manifest schema.
5. Check every page in both themes and at 320px wide.

## Pull requests

Branch from `main`, keep the change focused, and say in the description which source grounds each
new factual claim.
