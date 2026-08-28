from fastapi.testclient import TestClient

from app.examples_data import EXAMPLES
from app.main import app

client = TestClient(app)


def _example(example_id: str) -> dict:
    return next(e for e in EXAMPLES if e["id"] == example_id)


def test_binary_search_end_to_end():
    example = _example("binary-search")
    resp = client.post(
        "/api/visualize",
        json={
            "code": example["code"],
            "input": example["input"],
            "expectedOutput": example["expectedOutput"],
        },
    )
    assert resp.status_code == 200
    data = resp.json()

    assert data["status"] == "success"
    assert data["output"] == 3
    assert data["outputMatches"] is True

    detected_types = {d["type"] for d in data["detected"]}
    assert "binary_search" in detected_types
    assert "array" in detected_types
