import pytest


@pytest.fixture(autouse=True)
def isolate_runtime_field_issues(tmp_path, monkeypatch):
    """Keep officer JSON persistence off the packaged seed file during tests."""
    runtime_path = tmp_path / ".runtime_field_issues.json"
    monkeypatch.setattr("backend.server.RUNTIME_FIELD_ISSUES_PATH", runtime_path, raising=False)
    try:
        import backend.server as srv

        monkeypatch.setattr(srv, "RUNTIME_FIELD_ISSUES_PATH", runtime_path)
        srv.IN_MEMORY_FIELD_ISSUES.clear()
    except Exception:
        pass
    yield
