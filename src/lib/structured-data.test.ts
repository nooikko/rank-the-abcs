import { describe, expect, it } from "vitest";
import type { Ranking } from "./ranking";
import { SITE_NAME, SITE_URL } from "./site";
import { rankingStructuredData, siteStructuredData } from "./structured-data";

const placed: Ranking["placed"] = [
  { letter: "Q", score: 1.4, stderr: 0.2, position: 1 },
  { letter: "A", score: 0.3, stderr: 0.3, position: 2 },
  { letter: "M", score: -0.9, stderr: 0.25, position: 3 },
];

describe("siteStructuredData", () => {
  it("survives the escaping the renderer puts it through", () => {
    expect(JSON.parse(JSON.stringify(siteStructuredData))).toMatchObject({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    });
  });
});

describe("rankingStructuredData", () => {
  it("lists the letters in the order the fit put them", () => {
    const data = rankingStructuredData(placed);
    expect(data.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Q" },
      { "@type": "ListItem", position: 2, name: "A" },
      { "@type": "ListItem", position: 3, name: "M" },
    ]);
  });

  it("counts what it actually listed", () => {
    const data = rankingStructuredData(placed);
    expect(data.numberOfItems).toBe(data.itemListElement.length);
  });

  /**
   * The page renders this only once letters are placed, but an empty list is
   * still valid rather than a crash — the guard belongs to the page's copy, not
   * to the payload.
   */
  it("produces an empty list rather than failing when nothing is placed", () => {
    const data = rankingStructuredData([]);
    expect(data.numberOfItems).toBe(0);
    expect(data.itemListElement).toEqual([]);
  });
});
