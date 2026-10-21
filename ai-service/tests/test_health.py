from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_returns_service_metadata() -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["version"]
    assert body["environment"]


def test_root_points_to_health_and_docs() -> None:
    response = client.get("/")

    assert response.status_code == 200
    body = response.json()
    assert body["docs"] == "/docs"
    assert body["health"] == "/api/v1/health"
