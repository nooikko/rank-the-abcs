import type { Ranking } from "./ranking";
import {
  PORTFOLIO_URL,
  SITE_AUTHOR,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "./site";

/**
 * Describes the site itself, for the whole app. Deliberately only `WebSite` and
 * its creator: the per-page facts a `WebPage` block would carry are already in
 * the markup and the metadata, and restating them in JSON-LD adds a second copy
 * to keep honest without telling a crawler anything it could not already read.
 */
export const siteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: "en",
  creator: {
    "@type": "Person",
    name: SITE_AUTHOR,
    url: PORTFOLIO_URL,
  },
};

/**
 * The ordering, as the one thing on this site that is genuinely list-shaped.
 *
 * Takes only the placed letters. The unplaced ones have no position, and an
 * `ItemList` exists to assert positions — handing them an arbitrary one would
 * state in machine-readable form the exact claim the page refuses to make in
 * prose.
 */
export function rankingStructuredData(placed: Ranking["placed"]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "The alphabet so far",
    description:
      "The community-sourced ordering of the alphabet, fitted from pairwise rulings.",
    url: `${SITE_URL}/rankings`,
    numberOfItems: placed.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    itemListElement: placed.map((entry) => ({
      "@type": "ListItem",
      position: entry.position,
      name: entry.letter,
    })),
  };
}
