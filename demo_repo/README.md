# String Math Engine (Demo Repository)

This is an intentionally bug-seeded repository designed to test the autonomous self-correction loop of **AutoFixer AI**.

## Seeded Defects
1. **Bug 1 (Math Operator Bug):** `evaluate()` performs multiplication instead of exponentiation when operator is `"^"`.
2. **Bug 2 (Tokenizer Parsing Bug):** `tokenize()` fails to strip whitespace and leaves an empty string on trailing commas.

## Test Suite
- Total tests: 6
- Expected initial failure count: 2 (`test_power_operation`, `test_tokenize_trailing_delimiter`)
