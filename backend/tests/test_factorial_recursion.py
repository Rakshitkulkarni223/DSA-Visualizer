from fastapi.testclient import TestClient

from app.examples_data import EXAMPLES
from app.main import app

client = TestClient(app)


def _example(example_id: str) -> dict:
    return next(e for e in EXAMPLES if e["id"] == example_id)


def test_factorial_recursion_call_stack_depth():
    example = _example("factorial-recursion")
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
    assert data["output"] == 120

    n = example["input"]["n"]
    max_depth = max((len(step["callStack"]) for step in data["steps"]), default=0)
    assert max_depth >= n

    detected_types = {d["type"] for d in data["detected"]}
    assert "recursion" in detected_types
