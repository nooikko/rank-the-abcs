import { describe, expect, it } from "vitest";
import { pageMetadata } from "./metadata";
import { SITE_NAME, SITE_OG_IMAGE } from "./site";

describe("pageMetadata", () => {
  it("points the canonical and og:url at the same place", () => {
    const meta = pageMetadata({ title: "Privacy", path: "/privacy" });
    expect(meta.alternates?.canonical).toBe("/privacy");
    expect(meta.openGraph?.url).toBe("/privacy");
  });

  it("tracks the path it was given rather than the origin", () => {
    for (const path of ["/", "/vote", "/rankings", "/privacy"]) {
      const meta = pageMetadata({ path });
      expect(meta.openGraph?.url).toBe(path);
      expect(meta.alternates?.canonical).toBe(path);
    }
  });

  /**
   * The reason this helper exists. Next merges `openGraph` shallowly, so a page
   * that declares any key inside it drops every key the layout declared. These
   * three have to be restated on every page or they vanish from that page only
   * — the failure the original bug was made of.
   */
  it("restates the fields a shallow merge would otherwise drop", () => {
    const og = pageMetadata({ path: "/vote" }).openGraph;
    expect(og).toMatchObject({
      siteName: SITE_NAME,
      locale: "en_US",
      type: "website",
    });
  });

  /**
   * The quietest of the dropped fields. `opengraph-image.png` reaches a route
   * through a file convention that skips any route declaring its own
   * `openGraph` — so every page here has to carry the card explicitly, and a
   * page that loses it looks fine in the browser and blank in every share
   * preview.
   */
  it("carries the share card, which the file convention no longer supplies", () => {
    const og = pageMetadata({ path: "/privacy" }).openGraph;
    expect(og?.images).toEqual([SITE_OG_IMAGE]);
    expect(SITE_OG_IMAGE.alt).not.toHaveLength(0);
  });

  it("leaves the title bare for the layout's template to compose", () => {
    expect(pageMetadata({ title: "Privacy", path: "/privacy" }).title).toBe(
      "Privacy",
    );
  });

  it("omits the title entirely when a page has none, so the default applies", () => {
    expect(pageMetadata({ path: "/" }).title).toBeUndefined();
  });

  it("carries the description through", () => {
    const meta = pageMetadata({ path: "/vote", description: "Two letters." });
    expect(meta.description).toBe("Two letters.");
  });

  it("rejects a path that is not rooted, which would resolve against the current route", () => {
    expect(() => pageMetadata({ path: "vote" })).toThrow();
    expect(() => pageMetadata({ path: "https://example.com/vote" })).toThrow();
  });

  it("rejects a trailing slash, which the canonical would disagree with", () => {
    expect(() => pageMetadata({ path: "/vote/" })).toThrow();
  });
});
