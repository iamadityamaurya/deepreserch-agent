import { evaluate } from "mathjs";

/**
 * Safely evaluates mathematical calculations using mathjs parser.
 * Completely avoids eval() to protect against code injection.
 */
export function calculateExpression(expression: string): { result?: string; error?: string } {
  if (!expression || typeof expression !== "string") {
    return { error: "No calculation expression provided" };
  }

  try {
    const cleanExpr = expression.trim();
    const evaluated = evaluate(cleanExpr);
    return { result: String(evaluated) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Calculation failed";
    return { error: message };
  }
}
