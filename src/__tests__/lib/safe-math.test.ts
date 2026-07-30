import { safeEvaluate } from '@/lib/safe-math';

describe('safeEvaluate', () => {
  // ─── Basic Arithmetic ──────────────────────────────────────────
  test('adds two numbers', () => {
    expect(safeEvaluate('2+3')).toBe(5);
  });

  test('subtracts two numbers', () => {
    expect(safeEvaluate('10-4')).toBe(6);
  });

  test('multiplies two numbers', () => {
    expect(safeEvaluate('6*7')).toBe(42);
  });

  test('divides two numbers', () => {
    expect(safeEvaluate('20/4')).toBe(5);
  });

  // ─── Order of Operations ───────────────────────────────────────
  test('respects operator precedence', () => {
    expect(safeEvaluate('2+3*4')).toBe(14);
  });

  test('respects parentheses', () => {
    expect(safeEvaluate('(2+3)*4')).toBe(20);
  });

  test('nested parentheses', () => {
    expect(safeEvaluate('((2+3)*4)+1')).toBe(21);
  });

  // ─── Decimal Numbers ───────────────────────────────────────────
  test('handles decimal numbers', () => {
    expect(safeEvaluate('1.5+2.5')).toBe(4);
  });

  test('handles decimal multiplication', () => {
    expect(safeEvaluate('2.5*4')).toBe(10);
  });

  // ─── Unary Minus ───────────────────────────────────────────────
  test('handles unary minus', () => {
    expect(safeEvaluate('-5+10')).toBe(5);
  });

  test('handles unary minus with parentheses', () => {
    expect(safeEvaluate('-(3+2)')).toBe(-5);
  });

  // ─── Whitespace ────────────────────────────────────────────────
  test('ignores whitespace', () => {
    expect(safeEvaluate(' 2 + 3 * 4 ')).toBe(14);
  });

  // ─── Edge Cases & Errors ───────────────────────────────────────
  test('throws on division by zero', () => {
    expect(() => safeEvaluate('10/0')).toThrow('Division by zero');
  });

  test('throws on invalid characters', () => {
    expect(() => safeEvaluate('2+3; DROP TABLE')).toThrow('Invalid characters');
  });

  test('throws on letter characters', () => {
    expect(() => safeEvaluate('abc')).toThrow('Invalid characters');
  });

  test('throws on empty expression', () => {
    expect(() => safeEvaluate('')).toThrow();
  });

  test('handles single number', () => {
    expect(safeEvaluate('42')).toBe(42);
  });

  // ─── POS-relevant calculations ─────────────────────────────────
  test('calculates total with tax (15%)', () => {
    expect(safeEvaluate('100*1.15')).toBeCloseTo(115, 2);
  });

  test('calculates discount', () => {
    expect(safeEvaluate('250-(250*0.10)')).toBeCloseTo(225, 2);
  });

  test('complex POS scenario: subtotal - discount + tax', () => {
    // Subtotal: 500, Discount 10%: 50, Tax 15% on discounted: 67.5
    expect(safeEvaluate('500-50+(450*0.15)')).toBeCloseTo(517.5, 2);
  });
});
