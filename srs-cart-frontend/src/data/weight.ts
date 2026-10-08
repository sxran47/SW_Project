export const MAX_ORDER_WEIGHT_GRAM = 20_000;

export function totalWeightGram(lines: readonly { weightGram: number; quantity: number }[]) {
  return lines.reduce((sum, line) => sum + line.weightGram * line.quantity, 0);
}
