import { describe, expect, it } from "vitest";
import {
  allPairKeys,
  answerOptions,
  cellKey,
  interpretAnswer,
  LETTERS,
  otherLetter,
  pairKey,
  parsePairKey,
  TEMPLATES,
} from "./alphabet";

describe("pairs", () => {
  it("has 26 letters", () => {
    expect(LETTERS).toHaveLength(26);
  });

  it("builds a canonical key regardless of argument order", () => {
    expect(pairKey("Q", "E")).toBe("E:Q");
    expect(pairKey("E", "Q")).toBe("E:Q");
  });

  it("rejects a pair of the same letter", () => {
    expect(() => pairKey("A", "A")).toThrow();
  });

  it("round-trips a key", () => {
    expect(parsePairKey("E:Q")).toEqual(["E", "Q"]);
  });

  it("enumerates every unordered pair exactly once", () => {
    const keys = allPairKeys();
    expect(keys).toHaveLength(325);
    expect(new Set(keys).size).toBe(325);
  });

  it("returns the opposite letter of a pair", () => {
    expect(otherLetter("E:Q", "Q")).toBe("E");
    expect(otherLetter("E:Q", "E")).toBe("Q");
  });

  it("builds a distinct cell key per phrasing", () => {
    const keys = new Set<string>();
    for (const template of TEMPLATES) {
      for (const first of ["E", "Q"] as const) {
        keys.add(cellKey("E:Q", template, first));
      }
    }
    expect(keys.size).toBe(6);
  });
});

describe("answer interpretation", () => {
  it("WHICH_FIRST: the chosen letter wins", () => {
    expect(interpretAnswer("WHICH_FIRST", "Q", "E", "Q")).toBe("Q");
    expect(interpretAnswer("WHICH_FIRST", "Q", "E", "E")).toBe("E");
  });

  it("SHOULD_BEFORE: yes means the first letter wins", () => {
    expect(interpretAnswer("SHOULD_BEFORE", "Q", "E", "YES")).toBe("Q");
    expect(interpretAnswer("SHOULD_BEFORE", "Q", "E", "NO")).toBe("E");
  });

  it("SHOULD_AFTER: yes means the second letter wins", () => {
    expect(interpretAnswer("SHOULD_AFTER", "Q", "E", "YES")).toBe("E");
    expect(interpretAnswer("SHOULD_AFTER", "Q", "E", "NO")).toBe("Q");
  });

  it("SHOULD_BEFORE(a,b) and SHOULD_AFTER(b,a) agree — they are the same claim", () => {
    expect(interpretAnswer("SHOULD_BEFORE", "T", "V", "YES")).toBe(
      interpretAnswer("SHOULD_AFTER", "V", "T", "YES"),
    );
  });

  it("rejects an answer the template does not permit", () => {
    expect(() => interpretAnswer("WHICH_FIRST", "Q", "E", "YES")).toThrow();
    expect(() => interpretAnswer("SHOULD_BEFORE", "Q", "E", "Q")).toThrow();
    expect(() => interpretAnswer("WHICH_FIRST", "Q", "E", "Z")).toThrow();
  });

  it("offers two options whose values interpret cleanly", () => {
    for (const template of TEMPLATES) {
      const options = answerOptions(template, "Q", "E");
      expect(options).toHaveLength(2);
      const winners = options.map((o) =>
        interpretAnswer(template, "Q", "E", o.value),
      );
      expect(new Set(winners)).toEqual(new Set(["Q", "E"]));
    }
  });
});
