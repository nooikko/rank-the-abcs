/**
 * The facts the site asserts about itself, in one place — read by both the
 * rendered page and the `<head>` metadata, so the two cannot disagree.
 */

export const SITE_NAME = "Rank the ABCs";
export const SITE_HOST = "abc.findquinn.com";
export const SITE_URL = `https://${SITE_HOST}`;

export const SITE_DESCRIPTION =
  "Q is in a weird place in the alphabet. Rule on one pair of letters at a time, and watch a new alphabet get built out of everyone's answers.";

export const SITE_AUTHOR = "Quinn Penney";

/**
 * The share card. `src/app/opengraph-image.png` is still the file that serves
 * it, but the description of it lives here rather than in the sibling
 * `.alt.txt` that Next's file convention would read: the convention only
 * applies to routes that state no `openGraph` of their own, and every page
 * states one in order to fix its own og:url. Named here, one copy feeds them
 * all.
 */
export const SITE_OG_IMAGE = {
  url: "/opengraph-image.png",
  width: 1200,
  height: 630,
  alt: 'A title card on white: "Q is in a weird place in the alphabet." set large in a serif, then in orange "Settle it, one pair at a time.", with abc.findquinn.com below an orange rule.',
} as const;

export const REPO_URL = "https://github.com/nooikko/rank-the-abcs";

/** The apex this lives under. */
export const PORTFOLIO_URL = "https://findquinn.com";
export const PORTFOLIO_LABEL = "findquinn.com";
