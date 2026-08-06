import { describe, expect, it } from "vitest";
import { invertSymmetric } from "./matrix";

describe("invertSymmetric", () => {
  it("inverts the identity to itself", () => {
    const identity = new Float64Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    expect(Array.from(invertSymmetric(identity, 3))).toEqual([
      1, 0, 0, 0, 1, 0, 0, 0, 1,
    ]);
  });

  it("inverts a known 2x2", () => {
    // [[4,1],[1,3]] has inverse [[3,-1],[-1,4]] / 11
    const result = invertSymmetric(new Float64Array([4, 1, 1, 3]), 2);
    expect(result[0]).toBeCloseTo(3 / 11, 10);
    expect(result[1]).toBeCloseTo(-1 / 11, 10);
    expect(result[3]).toBeCloseTo(4 / 11, 10);
  });

  it("multiplies back to the identity", () => {
    const a = new Float64Array([5, 2, 1, 2, 6, 3, 1, 3, 7]);
    const inverse = invertSymmetric(a, 3);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        let sum = 0;
        for (let k = 0; k < 3; k++) sum += a[i * 3 + k] * inverse[k * 3 + j];
        expect(sum).toBeCloseTo(i === j ? 1 : 0, 10);
      }
    }
  });

  it("does not modify its input", () => {
    const a = new Float64Array([4, 1, 1, 3]);
    invertSymmetric(a, 2);
    expect(Array.from(a)).toEqual([4, 1, 1, 3]);
  });

  it("throws on a singular matrix rather than returning nonsense", () => {
    expect(() => invertSymmetric(new Float64Array([0, 0, 0, 0]), 2)).toThrow();
  });
});
