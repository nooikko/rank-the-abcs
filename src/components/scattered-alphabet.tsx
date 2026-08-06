import { cn } from "@/lib/utils";

type Scattered = {
  letter: string;
  /** Percentages of the container, so the scatter reflows with the viewport. */
  top: number;
  left: number;
  rotate: number;
  size: "lead" | "title" | "name";
  /**
   * Set for the letters that sit in the horizontal middle of the page. There is
   * only room for them beside the copy on a wide viewport; narrower than that,
   * the measure spreads into the space they occupy and they are dropped.
   */
  wideOnly?: true;
};

/**
 * Hand-placed rather than generated. A random scatter needs a seed to stay
 * stable between server and client, and even seeded it produces clumps and
 * gaps that have to be corrected by hand anyway — at which point the table is
 * the honest version of what is happening.
 *
 * The middle of the page is left empty: the copy sits there.
 */
const DROPPED: Scattered[] = [
  { letter: "A", top: 6, left: 9, rotate: -14, size: "name" },
  { letter: "B", top: 14, left: 22, rotate: 9, size: "title" },
  { letter: "C", top: 4, left: 35, rotate: 22, size: "lead" },
  { letter: "D", top: 12, left: 48, rotate: -8, size: "title" },
  { letter: "E", top: 5, left: 62, rotate: 16, size: "name" },
  { letter: "F", top: 15, left: 74, rotate: -20, size: "lead" },
  { letter: "G", top: 7, left: 84, rotate: 11, size: "title" },
  { letter: "H", top: 22, left: 5, rotate: 27, size: "lead" },
  { letter: "I", top: 24, left: 66, rotate: -12, size: "lead" },
  { letter: "J", top: 20, left: 89, rotate: -25, size: "lead" },

  { letter: "K", top: 78, left: 7, rotate: 18, size: "title" },
  { letter: "L", top: 88, left: 19, rotate: -11, size: "lead" },
  { letter: "M", top: 76, left: 31, rotate: 24, size: "name" },
  { letter: "N", top: 91, left: 36, rotate: -19, size: "title" },
  { letter: "O", top: 78, left: 63, rotate: 7, size: "lead" },
  { letter: "P", top: 91, left: 70, rotate: -23, size: "title" },
  { letter: "R", top: 77, left: 81, rotate: 14, size: "name" },
  { letter: "S", top: 88, left: 89, rotate: -9, size: "lead" },
  { letter: "T", top: 71, left: 68, rotate: 30, size: "lead" },
  { letter: "U", top: 94, left: 52, rotate: 12, size: "lead" },

  { letter: "V", top: 38, left: 4, rotate: -16, size: "title", wideOnly: true },
  { letter: "W", top: 55, left: 10, rotate: 21, size: "name", wideOnly: true },
  { letter: "X", top: 36, left: 88, rotate: 13, size: "title", wideOnly: true },
  { letter: "Y", top: 60, left: 91, rotate: -27, size: "lead", wideOnly: true },
  { letter: "Z", top: 48, left: 3, rotate: 8, size: "lead", wideOnly: true },
];

const SIZE_CLASS = {
  lead: "text-lead",
  title: "text-title",
  name: "text-name",
} as const;

/**
 * The alphabet, dropped. Every letter but Q lies where it fell; Q is upright,
 * in the emphasis colour, still holding the position the whole site is an
 * argument about.
 *
 * The layer is decorative — the copy says everything this shows — so it is
 * hidden from assistive technology and cannot take a pointer event away from
 * the links underneath.
 */
export function ScatteredAlphabet() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
    >
      {DROPPED.map((entry, index) => (
        <span
          key={entry.letter}
          // The rise animation ends on `transform: none`, which would wipe a
          // rotation set on the same element. The outer span moves, the inner
          // one holds the angle.
          className={cn(
            "absolute rise-on-load text-muted-foreground/45",
            entry.wideOnly && "hidden lg:block",
          )}
          style={{
            top: `${entry.top}%`,
            left: `${entry.left}%`,
            animationDelay: `${60 + index * 22}ms`,
          }}
        >
          <span
            className={cn("block font-name", SIZE_CLASS[entry.size])}
            style={{ transform: `rotate(${entry.rotate}deg)` }}
          >
            {entry.letter}
          </span>
        </span>
      ))}

      <span
        className="absolute rise-on-load font-name text-name text-primary"
        style={{ top: "82%", left: "52%", animationDelay: "700ms" }}
      >
        Q
      </span>
    </div>
  );
}
