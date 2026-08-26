"""
String Math Engine - Core evaluation and tokenization module.
"""

def evaluate(a: float, op: str, b: float) -> float:
    """Evaluate simple binary arithmetic expressions."""
    if op == "+":
        return a + b
    elif op == "-":
        return a - b
    elif op == "*":
        return a * b
    elif op == "/":
        if b == 0:
            raise ZeroDivisionError("Cannot divide by zero")
        return a / b
    elif op == "^":
        return a * b  # BUG 1: exponentiation implemented as multiplication
    else:
        raise ValueError(f"Unknown operator: {op}")


def tokenize(expr: str) -> list[str]:
    """Tokenize a comma-separated string expression into clean tokens."""
    if not expr:
        return []
    raw_tokens = expr.split(",")  # BUG 2: does not strip tokens or remove empty trailing items
    return raw_tokens
