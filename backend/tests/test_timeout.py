from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_infinite_loop_is_bounded():
    code = (
        "def infinite():\n"
        "    x = 0\n"
        "    while True:\n"
        "        x += 1\n"
        "    return x\n"
    )
    resp = client.post("/api/visualize", json={"code": code, "input": {}})

    assert resp.status_code == 200
    data = resp.json()
    # MAX_STEPS (10000) fires well within the 5s wall-clock timeout for a
    # tight loop, but assert against either sentinel so this isn't flaky if
    # the machine running it is unusually slow.
    assert data["status"] in ("step_limit_exceeded", "timeout")
