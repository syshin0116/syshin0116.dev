"""Per-account daily spend for signed-in runs."""

from __future__ import annotations

import time
from dataclasses import replace

import httpx
import jwt
import pytest
from starlette.responses import JSONResponse

from agent import http as http_extension
from agent.auth import AGENT_AUTH_SECRET, TOKEN_AUDIENCE, TOKEN_ISSUER
from agent.capabilities.budget import BudgetSnapshot
from agent.http import NativeThreadGuard
from agent.signed_in_budget import (
    DEFAULT_SIGNED_IN_DAILY_BUDGET_MICRO_USD,
    OPENAI_MODEL_RATES,
    SIGNED_IN_DAILY_BUDGET_ENV,
    SignedInBudgetConfigurationError,
    SignedInBudgetUnavailableError,
    SignedInDailyBudgetExhaustedError,
    model_rates,
    run_cost_micro_usd,
    settle_signed_in_run,
    signed_in_daily_limit_micro_usd,
)

_EMPTY = BudgetSnapshot(
    policy_id="owner-capability-lab-v4",
    model_calls=0,
    model_reservations_in_flight=0,
    tool_calls=0,
    quickjs_calls=0,
    quickjs_in_flight=0,
    quickjs_output_bytes=0,
    task_calls=0,
    tasks_in_flight=0,
    charged_tokens=0,
    count_risk_tokens=0,
    count_risk_tokens_in_flight=0,
    provider_input_tokens=None,
    provider_output_tokens=None,
    provider_cache_read_input_tokens=None,
    provider_cache_write_input_tokens=None,
    provider_usage_complete=False,
    elapsed_ms=0,
    exhausted=False,
    finalized=True,
)


def _authorization(subject="account-1"):
    now = int(time.time())
    token = jwt.encode(
        {
            "sub": subject,
            "iss": TOKEN_ISSUER,
            "aud": TOKEN_AUDIENCE,
            "iat": now,
            "exp": now + 900,
        },
        AGENT_AUTH_SECRET,
        algorithm="HS256",
    )
    return {"Authorization": f"Bearer {token}"}


class _Ledger:
    def __init__(self, error: Exception | None = None):
        self.error = error
        self.checked: list[str] = []
        self.settled: list[tuple[str, int]] = []

    async def ensure_available(self, identity):
        self.checked.append(identity)
        if self.error is not None:
            raise self.error

    async def settle(self, identity, cost_micro_usd):
        if self.error is not None:
            raise self.error
        self.settled.append((identity, cost_micro_usd))


def test_limit_defaults_to_five_dollars(monkeypatch):
    monkeypatch.delenv(SIGNED_IN_DAILY_BUDGET_ENV, raising=False)
    assert signed_in_daily_limit_micro_usd() == 5_000_000
    assert DEFAULT_SIGNED_IN_DAILY_BUDGET_MICRO_USD == 5_000_000


@pytest.mark.parametrize("raw", ["0", "05", "-1", "1.5", "abc", "99999999999"])
def test_limit_rejects_non_canonical_values(monkeypatch, raw):
    monkeypatch.setenv(SIGNED_IN_DAILY_BUDGET_ENV, raw)
    with pytest.raises(SignedInBudgetConfigurationError):
        signed_in_daily_limit_micro_usd()


def test_limit_reads_configured_value(monkeypatch):
    monkeypatch.setenv(SIGNED_IN_DAILY_BUDGET_ENV, "10000000")
    assert signed_in_daily_limit_micro_usd() == 10_000_000


def test_unknown_or_non_openai_models_are_priced_at_the_top_rate():
    top = OPENAI_MODEL_RATES["gpt-6.1-sol"]
    assert model_rates(None) is top
    assert model_rates("openai:gpt-unknown") is top
    assert model_rates("anthropic:claude") is top
    assert model_rates("openai:gpt-6-luna") is OPENAI_MODEL_RATES["gpt-6-luna"]


def test_complete_provider_usage_is_priced_per_bucket():
    snapshot = replace(
        _EMPTY,
        model_calls=2,
        provider_usage_complete=True,
        provider_input_tokens=10_000,
        provider_cache_read_input_tokens=20_000,
        provider_cache_write_input_tokens=1_000,
        provider_output_tokens=2_000,
        count_risk_tokens=5_000,
    )
    # Terra: 10k*1.00 + 20k*0.05 + 1k*2.50 + 2k*5.00 + 5k*1.00 per million.
    expected = 10_000 + 1_000 + 2_500 + 10_000 + 5_000
    assert run_cost_micro_usd(snapshot, OPENAI_MODEL_RATES["gpt-6.1-terra"]) == (
        expected
    )


def test_incomplete_usage_prices_every_charged_token_at_the_output_rate():
    snapshot = replace(_EMPTY, model_calls=1, charged_tokens=3_001)
    # 3001 * 10.00 per million = 30010 micro-dollars, exactly.
    assert run_cost_micro_usd(snapshot, OPENAI_MODEL_RATES["gpt-6.1-sol"]) == 30_010
    # Rounds up rather than dropping a fraction of a micro-dollar.
    one = replace(_EMPTY, model_calls=1, charged_tokens=1)
    assert run_cost_micro_usd(one, OPENAI_MODEL_RATES["gpt-6-luna"]) == 1


async def test_settlement_records_priced_usage_for_the_account():
    ledger = _Ledger()
    snapshot = replace(_EMPTY, model_calls=1, charged_tokens=1_000)
    await settle_signed_in_run(
        ledger,
        identity="account-1",
        snapshot=snapshot,
        model_spec="openai:gpt-6-luna",
    )
    assert ledger.settled == [("account-1", 500)]


async def test_settlement_skips_runs_that_never_called_a_model():
    ledger = _Ledger()
    await settle_signed_in_run(
        ledger, identity="account-1", snapshot=_EMPTY, model_spec=None
    )
    assert ledger.settled == []


async def test_settlement_failure_is_logged_not_raised(caplog):
    ledger = _Ledger(SignedInBudgetUnavailableError("down"))
    snapshot = replace(_EMPTY, model_calls=1, charged_tokens=10)
    await settle_signed_in_run(
        ledger, identity="account-1", snapshot=snapshot, model_spec=None
    )
    assert "signed-in spend settlement failed" in caplog.text


async def _post_command(app, method="run.start"):
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        return await client.post(
            "/threads/thread-1/commands",
            headers=_authorization(),
            json={"id": 1, "method": method, "params": {}},
        )


@pytest.fixture
def owned_idle_thread(monkeypatch):
    async def status(_thread_id, _user_id):
        return True, "idle"

    monkeypatch.setattr(http_extension, "_owned_or_new_thread_status", status)


@pytest.mark.parametrize("method", ["run.start", "input.respond"])
async def test_exhausted_account_gets_429_before_the_native_route(
    owned_idle_thread, method
):
    called = False

    async def downstream(scope, receive, send):
        nonlocal called
        called = True
        await JSONResponse({"ok": True})(scope, receive, send)

    ledger = _Ledger(SignedInDailyBudgetExhaustedError("spent"))
    # 2026-11-16T15:00:00Z, nine hours before the next UTC day.
    app = NativeThreadGuard(
        downstream,
        signed_in_ledger=ledger,
        wall_clock=lambda: 1_794_841_200.0,
    )
    response = await _post_command(app, method)

    assert response.status_code == 429
    assert response.json() == {
        "error": "daily_budget_exhausted",
        "message": "Signed-in daily budget is exhausted",
    }
    assert response.headers["Retry-After"] == str(9 * 3600)
    assert ledger.checked == ["account-1"]
    assert not called


async def test_unreadable_ledger_fails_closed_with_503(owned_idle_thread):
    ledger = _Ledger(SignedInBudgetUnavailableError("down"))

    async def downstream(scope, receive, send):
        raise AssertionError("a run must not start without a ledger read")

    response = await _post_command(
        NativeThreadGuard(downstream, signed_in_ledger=ledger)
    )
    assert response.status_code == 503
    assert response.json()["error"] == "service_unavailable"


async def test_account_under_its_limit_reaches_the_native_route(owned_idle_thread):
    ledger = _Ledger()

    async def downstream(scope, receive, send):
        await JSONResponse({"ok": True})(scope, receive, send)

    response = await _post_command(
        NativeThreadGuard(downstream, signed_in_ledger=ledger)
    )
    assert response.status_code == 200
    assert ledger.checked == ["account-1"]


async def test_non_spending_commands_do_not_read_the_ledger():
    ledger = _Ledger(AssertionError("must not be read"))

    async def downstream(scope, receive, send):
        await JSONResponse({"ok": True})(scope, receive, send)

    response = await _post_command(
        NativeThreadGuard(downstream, signed_in_ledger=ledger),
        method="subscription.subscribe",
    )
    assert response.status_code == 200
    assert ledger.checked == []


def test_browser_can_read_retry_after_on_cross_origin_rejections():
    import json
    from pathlib import Path

    config = json.loads(
        (Path(__file__).resolve().parents[3] / "aegra.json").read_text("utf-8")
    )
    cors = config["http"]["cors"]
    # Keep Aegra's defaults for SDK stream reconnection alongside Retry-After.
    assert {"Content-Location", "Location", "Retry-After"} <= set(
        cors["expose_headers"]
    )
    assert cors["allow_origins"] == ["*"]
    assert cors["allow_credentials"] is False
