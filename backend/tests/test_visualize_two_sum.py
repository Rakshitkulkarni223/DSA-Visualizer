from fastapi.testclient import TestClient

from app.examples_data import EXAMPLES
from app.main import app

client = TestClient(app)


def _example(example_id: str) -> dict:
    return next(e for e in EXAMPLES if e["id"] == example_id)


def test_two_sum_end_to_end():
    example = _example("two-sum")
    resp = client.post(
        "/api/visualize",
        json={
            "language": "python",
            "code": example["code"],
            "input": example["input"],
            "expectedOutput": example["expectedOutput"],
        },
    )
    assert resp.status_code == 200
    data = resp.json()

    assert data["status"] == "success"
    assert data["output"] == [0, 1]
    assert data["outputMatches"] is True
    assert len(data["steps"]) > 0
    assert data["maxSteps"] == 10000

    detected_types = {d["type"] for d in data["detected"]}
    assert "array" in detected_types
    assert "two_pointer" in detected_types
