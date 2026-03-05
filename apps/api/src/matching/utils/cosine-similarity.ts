export function cosineSimilarity(
  left: Map<string, number>,
  right: Map<string, number>,
): number {
  if (left.size === 0 || right.size === 0) {
    return 0;
  }

  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (const [, value] of left) {
    leftNorm += value * value;
  }

  for (const [key, value] of right) {
    rightNorm += value * value;
    const paired = left.get(key) ?? 0;
    dot += value * paired;
  }

  if (leftNorm === 0 || rightNorm === 0) {
    return 0;
  }

  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}
