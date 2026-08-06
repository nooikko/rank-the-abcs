/**
 * Gauss-Jordan inverse with partial pivoting, for the ~29x29 penalised
 * information matrix. Small enough that a dedicated Cholesky routine would buy
 * nothing; the same inverse serves as both the Newton step and the source of
 * the standard errors.
 *
 * `matrix` is row-major and is not modified.
 */
export function invertSymmetric(
  matrix: Float64Array,
  size: number,
): Float64Array {
  const a = Float64Array.from(matrix);
  const inverse = new Float64Array(size * size);
  for (let i = 0; i < size; i++) inverse[i * size + i] = 1;

  for (let column = 0; column < size; column++) {
    let pivotRow = column;
    let best = Math.abs(a[column * size + column]);
    for (let row = column + 1; row < size; row++) {
      const candidate = Math.abs(a[row * size + column]);
      if (candidate > best) {
        best = candidate;
        pivotRow = row;
      }
    }
    if (best === 0) throw new Error("Matrix is singular");

    if (pivotRow !== column) {
      for (let k = 0; k < size; k++) {
        const tmpA = a[column * size + k];
        a[column * size + k] = a[pivotRow * size + k];
        a[pivotRow * size + k] = tmpA;
        const tmpI = inverse[column * size + k];
        inverse[column * size + k] = inverse[pivotRow * size + k];
        inverse[pivotRow * size + k] = tmpI;
      }
    }

    const pivot = a[column * size + column];
    for (let k = 0; k < size; k++) {
      a[column * size + k] /= pivot;
      inverse[column * size + k] /= pivot;
    }

    for (let row = 0; row < size; row++) {
      if (row === column) continue;
      const factor = a[row * size + column];
      if (factor === 0) continue;
      for (let k = 0; k < size; k++) {
        a[row * size + k] -= factor * a[column * size + k];
        inverse[row * size + k] -= factor * inverse[column * size + k];
      }
    }
  }

  return inverse;
}
