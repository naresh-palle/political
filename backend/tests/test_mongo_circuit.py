import logging

from backend import server as srv


def test_timeout_error_trips_circuit_without_warning(monkeypatch, caplog):
    monkeypatch.setattr(srv, "_mongo_circuit_open", False)
    monkeypatch.setattr(srv, "_mongo_offline_logged", False)
    monkeypatch.setattr(srv, "client", None)
    monkeypatch.setattr(srv, "db", srv.db)

    caplog.set_level(logging.DEBUG)
    srv.log_mongo_notice("get_field_issues", TimeoutError())

    assert srv._mongo_circuit_open is True
    warning_text = "".join(r.getMessage() for r in caplog.records if r.levelno >= logging.WARNING)
    assert "MongoDB warning" not in warning_text
    assert "Topology Description" not in caplog.text
    assert any("not reachable" in r.getMessage() for r in caplog.records if r.levelno == logging.INFO)


def test_connection_refused_does_not_dump_topology(monkeypatch, caplog):
    monkeypatch.setattr(srv, "_mongo_circuit_open", False)
    monkeypatch.setattr(srv, "_mongo_offline_logged", False)
    monkeypatch.setattr(srv, "client", None)
    monkeypatch.setattr(srv, "db", srv.db)

    dump = (
        "localhost:27017: [Errno 111] Connection refused "
        "(configured timeouts: socketTimeoutMS: 20000.0ms, connectTimeoutMS: 20000.0ms), "
        "Timeout: 15.0s, Topology Description: <TopologyDescription id: abc>"
    )
    caplog.set_level(logging.WARNING)
    srv.log_mongo_notice("update issue status on assign-notify", Exception(dump))

    assert srv._mongo_circuit_open is True
    assert "Topology Description" not in caplog.text
    assert "Connection refused" not in caplog.text
    assert "MongoDB warning" not in caplog.text


def test_empty_timeout_message_does_not_warn(monkeypatch, caplog):
    monkeypatch.setattr(srv, "_mongo_circuit_open", False)
    monkeypatch.setattr(srv, "_mongo_offline_logged", True)
    monkeypatch.setattr(srv, "client", None)
    monkeypatch.setattr(srv, "db", srv.db)

    caplog.set_level(logging.WARNING)
    srv.log_mongo_notice("get_field_notifications extra", TimeoutError())
    srv.log_mongo_notice("notifications ticket lookup", TimeoutError())

    assert "MongoDB warning (get_field_notifications extra)" not in caplog.text
    assert "MongoDB warning (notifications ticket lookup)" not in caplog.text


def test_mongo_wait_timeout_trips_circuit(monkeypatch, caplog):
    import asyncio

    monkeypatch.setattr(srv, "_mongo_circuit_open", False)
    monkeypatch.setattr(srv, "_mongo_offline_logged", False)
    monkeypatch.setattr(srv, "client", None)
    monkeypatch.setattr(srv, "db", srv.db)

    async def hang():
        await asyncio.sleep(10)

    caplog.set_level(logging.WARNING)
    result = asyncio.run(
        srv.mongo_wait(hang(), timeout=0.05, fallback=[], tag="get_field_issues")
    )
    assert result == []
    assert srv._mongo_circuit_open is True
    assert "MongoDB warning" not in caplog.text


def test_mongo_wait_skips_when_circuit_open(monkeypatch):
    import asyncio

    monkeypatch.setattr(srv, "_mongo_circuit_open", True)

    async def boom():
        raise AssertionError("should not be awaited")

    result = asyncio.run(srv.mongo_wait(boom(), fallback=["ok"], tag="get_field_issues"))
    assert result == ["ok"]
