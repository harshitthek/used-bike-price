import numpy as np

from src.monitoring import _psi, _reference_distributions, load_reference_distributions


def test_psi_identical_distributions():
    data = np.random.normal(100, 15, 1000)
    psi_val = _psi(data, data)
    assert psi_val == 0.0 or psi_val < 0.01


def test_psi_empty_distributions():
    empty = np.array([])
    valid = np.array([1.0, 2.0, 3.0])
    assert _psi(empty, valid) == 0.0
    assert _psi(valid, empty) == 0.0
    assert _psi(empty, empty) == 0.0


def test_psi_shifted_distribution():
    base = np.random.normal(100, 10, 1000)
    shifted = np.random.normal(200, 10, 1000)
    psi_val = _psi(base, shifted)
    assert psi_val > 0.25  # Substantial drift detected


def test_psi_constant_value_array():
    constant = np.array([5.0, 5.0, 5.0])
    assert _psi(constant, constant) == 0.0


def test_load_reference_distributions():
    load_reference_distributions()
    assert "bike" in _reference_distributions or "car" in _reference_distributions
    if "bike" in _reference_distributions:
        assert "price" in _reference_distributions["bike"]
        assert len(_reference_distributions["bike"]["price"]) > 0
