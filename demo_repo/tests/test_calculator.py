import pytest
from string_engine.calculator import evaluate, tokenize


def test_basic_addition():
    assert evaluate(5, "+", 3) == 8


def test_subtraction():
    assert evaluate(10, "-", 4) == 6


def test_multiplication():
    assert evaluate(4, "*", 3) == 12


def test_division():
    assert evaluate(20, "/", 5) == 4


def test_power_operation():
    # Tests power calculation 2^3 == 8, 3^2 == 9
    assert evaluate(2, "^", 3) == 8
    assert evaluate(3, "^", 2) == 9


def test_tokenize_trailing_delimiter():
    # Tests that trailing delimiters and extra whitespace are cleanly handled
    result = tokenize("apple, banana, cherry, ")
    assert result == ["apple", "banana", "cherry"]
