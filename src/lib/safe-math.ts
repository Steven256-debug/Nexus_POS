/**
 * Safe mathematical expression evaluator using recursive descent parsing.
 * Supports: numbers, +, -, *, /, parentheses, and decimal points.
 * No dynamic code execution — no eval(), no Function(), no new Function().
 */

export function safeEvaluate(expression: string): number {
  const sanitized = expression.replace(/\s+/g, '');

  if (!/^[0-9+\-*/.()]+$/.test(sanitized)) {
    throw new Error('Invalid characters in expression');
  }

  let pos = 0;

  function parseExpression(): number {
    let result = parseTerm();
    while (pos < sanitized.length) {
      if (sanitized[pos] === '+') {
        pos++;
        result += parseTerm();
      } else if (sanitized[pos] === '-') {
        pos++;
        result -= parseTerm();
      } else {
        break;
      }
    }
    return result;
  }

  function parseTerm(): number {
    let result = parseFactor();
    while (pos < sanitized.length) {
      if (sanitized[pos] === '*') {
        pos++;
        result *= parseFactor();
      } else if (sanitized[pos] === '/') {
        pos++;
        const divisor = parseFactor();
        if (divisor === 0) throw new Error('Division by zero');
        result /= divisor;
      } else {
        break;
      }
    }
    return result;
  }

  function parseFactor(): number {
    // Handle unary minus
    if (sanitized[pos] === '-') {
      pos++;
      return -parseFactor();
    }

    // Handle parentheses
    if (sanitized[pos] === '(') {
      pos++; // skip '('
      const result = parseExpression();
      if (sanitized[pos] === ')') {
        pos++; // skip ')'
      }
      return result;
    }

    // Parse number (integer or decimal)
    const start = pos;
    while (pos < sanitized.length && (/[0-9.]/).test(sanitized[pos])) {
      pos++;
    }

    const numStr = sanitized.slice(start, pos);
    if (numStr === '') throw new Error('Unexpected end of expression');

    const num = parseFloat(numStr);
    if (isNaN(num)) throw new Error(`Invalid number: ${numStr}`);

    return num;
  }

  const result = parseExpression();

  if (pos < sanitized.length) {
    throw new Error(`Unexpected character: ${sanitized[pos]}`);
  }

  return result;
}
