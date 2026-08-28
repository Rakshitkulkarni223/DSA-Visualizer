from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_syntax_error_reported_cleanly():
    bad_code = "def broken(:\n    pass\n"
    resp = client.post("/api/visualize", json={"code": bad_code, "input": {}})

    assert resp.status_code == 200  # contract: errors are HTTP 200 w/ status set
    data = resp.json()
    assert data["status"] == "syntax_error"
    assert data["line"] is not None
    assert "message" in data
