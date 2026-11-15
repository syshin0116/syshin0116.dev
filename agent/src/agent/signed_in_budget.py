"""Per-account daily spend ledger for signed-in runs.

Signed-in runs keep every capability (model choice, saved threads, tools). Cost is
bounded per account and UTC day instead: a run may start only while the account's
settled spend for today is below the limit, and each finished run adds its priced
provider usage to the ledger. Admission and settlement are separate, so one account
can overshoot by at most the runs it had in flight when it crossed the limit.
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from typing import Protocol

from aegra_api.core.orm import get_session_maker
from sqlalchemy import text

from agent.capabilities.budget import BudgetSnapshot
from agent.guest_budget import MAX_GUEST_BUDGET_MICRO_USD

logger = logging.getLogger(__name__)

SIGNED_IN_DAILY_BUDGET_ENV = "SIGNED_IN_DAILY_BUDGET_MICRO_USD"
DEFAULT_SIGNED_IN_DAILY_BUDGET_MICRO_USD = 5_000_000
_MICRO_USD_PER_USD = 1_000_000


@dataclass(frozen=True, slots=True)
class ModelRates:
    """Standard-tier micro-dollar prices per million tokens."""

    input: int
    cached_input: int
    cache_write: int
    output: int


# https://developers.openai.com/api/docs/pricing (2026-11-16), short-context tier.
# Cache write uses the 12h rate, the higher of the two retention tiers.
OPENAI_MODEL_RATES: dict[str, ModelRates] = {
    "gpt-6-luna": ModelRates(100_000, 10_000, 250_000, 500_000),
    "gpt-6.1-terra": ModelRates(1_000_000, 50_000, 2_500_000, 5_000_000),
    "gpt-6.1-sol": ModelRates(2_000_000, 100_000, 5_000_000, 10_000_000),
}
# Unknown or unresolved models are priced as the most expensive one.
_FALLBACK_RATES = OPENAI_MODEL_RATES["gpt-6.1-sol"]

_SPENT_TODAY_SQL = text(
    """
    SELECT spent_micro_usd
    FROM agent_signed_in_daily_spend
    WHERE identity = :identity
        AND budget_date = CAST(timezone('UTC', CURRENT_TIMESTAMP) AS date)
    """
)

_SETTLE_SQL = text(
    """
    INSERT INTO agent_signed_in_daily_spend (
        identity,
        budget_date,
        spent_micro_usd,
        run_count,
        updated_at
    )
    VALUES (
        :identity,
        CAST(timezone('UTC', CURRENT_TIMESTAMP) AS date),
        :cost_micro_usd,
        1,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (identity, budget_date) DO UPDATE
    SET
        spent_micro_usd =
            agent_signed_in_daily_spend.spent_micro_usd
            + EXCLUDED.spent_micro_usd,
        run_count = agent_signed_in_daily_spend.run_count + 1,
        updated_at = CURRENT_TIMESTAMP
    """
)


class SignedInBudgetConfigurationError(RuntimeError):
    """The signed-in daily limit is malformed."""


class SignedInDailyBudgetExhaustedError(RuntimeError):
    """The account already spent its daily limit."""


class SignedInBudgetUnavailableError(RuntimeError):
    """The durable ledger could not be read or written."""


def signed_in_daily_limit_micro_usd() -> int:
    """Return the configured per-account daily limit, defaulting to $5."""
    raw = os.environ.get(SIGNED_IN_DAILY_BUDGET_ENV)
    if raw is None or raw == "":
        return DEFAULT_SIGNED_IN_DAILY_BUDGET_MICRO_USD
    if not raw.isascii() or not raw.isdecimal() or raw.startswith("0") or len(raw) > 10:
        raise SignedInBudgetConfigurationError(
            f"{SIGNED_IN_DAILY_BUDGET_ENV} must be a canonical positive integer"
        )
    value = int(raw)
    if value > MAX_GUEST_BUDGET_MICRO_USD:
        raise SignedInBudgetConfigurationError(
            f"{SIGNED_IN_DAILY_BUDGET_ENV} exceeds the reviewed configuration bound"
        )
    return value


def model_rates(model_spec: str | None) -> ModelRates:
    """Resolve rates from ``openai:<name>``; anything else gets the top rate."""
    if not model_spec:
        return _FALLBACK_RATES
    provider, _, name = model_spec.partition(":")
    if provider != "openai":
        return _FALLBACK_RATES
    return OPENAI_MODEL_RATES.get(name, _FALLBACK_RATES)


def run_cost_micro_usd(snapshot: BudgetSnapshot, rates: ModelRates) -> int:
    """Price one finished run, rounding up to a whole micro-dollar.

    Complete provider usage is priced per bucket. Without it, every charged token is
    priced at the output rate. Token-count requests are priced at the input rate,
    matching the guest ledger, until OpenAI documents their billing.
    """
    if snapshot.provider_usage_complete:
        numerator = (
            (snapshot.provider_input_tokens or 0) * rates.input
            + (snapshot.provider_cache_read_input_tokens or 0) * rates.cached_input
            + (snapshot.provider_cache_write_input_tokens or 0) * rates.cache_write
            + (snapshot.provider_output_tokens or 0) * rates.output
        )
    else:
        numerator = snapshot.charged_tokens * rates.output
    numerator += snapshot.count_risk_tokens * rates.input
    return (numerator + _MICRO_USD_PER_USD - 1) // _MICRO_USD_PER_USD


class SignedInSpendLedger(Protocol):
    """Async boundary used by the HTTP guard, the graph factory, and tests."""

    async def ensure_available(self, identity: str) -> None: ...

    async def settle(self, identity: str, cost_micro_usd: int) -> None: ...


class PostgresSignedInSpendLedger:
    """Per-account, per-UTC-day spend rows in the agent database."""

    def __init__(self, daily_limit_micro_usd: int) -> None:
        if (
            not isinstance(daily_limit_micro_usd, int)
            or isinstance(daily_limit_micro_usd, bool)
            or daily_limit_micro_usd < 1
        ):
            raise ValueError("daily limit must be a positive integer")
        self._limit = daily_limit_micro_usd

    async def ensure_available(self, identity: str) -> None:
        maker = get_session_maker()
        try:
            async with maker() as session:
                result = await session.execute(_SPENT_TODAY_SQL, {"identity": identity})
                spent = result.scalar_one_or_none()
        except Exception as exc:
            raise SignedInBudgetUnavailableError(
                "signed-in spend ledger read failed"
            ) from exc
        if spent is not None and spent >= self._limit:
            raise SignedInDailyBudgetExhaustedError(
                "signed-in daily spend is exhausted"
            )

    async def settle(self, identity: str, cost_micro_usd: int) -> None:
        if cost_micro_usd < 0:
            raise ValueError("run cost cannot be negative")
        maker = get_session_maker()
        try:
            async with maker() as session, session.begin():
                await session.execute(
                    _SETTLE_SQL,
                    {"identity": identity, "cost_micro_usd": cost_micro_usd},
                )
        except Exception as exc:
            raise SignedInBudgetUnavailableError(
                "signed-in spend ledger settlement failed"
            ) from exc


_default_ledger: PostgresSignedInSpendLedger | None = None


def default_signed_in_ledger() -> PostgresSignedInSpendLedger:
    """Process-wide ledger built from the environment on first use."""
    global _default_ledger
    if _default_ledger is None:
        _default_ledger = PostgresSignedInSpendLedger(signed_in_daily_limit_micro_usd())
    return _default_ledger


async def settle_signed_in_run(
    ledger: SignedInSpendLedger,
    *,
    identity: str,
    snapshot: BudgetSnapshot,
    model_spec: str | None,
) -> None:
    """Record a finished run; a ledger failure is logged, never raised."""
    if snapshot.model_calls == 0 and snapshot.count_risk_tokens == 0:
        return
    cost = run_cost_micro_usd(snapshot, model_rates(model_spec))
    try:
        await ledger.settle(identity, cost)
    except Exception as error:
        logger.error(
            "signed-in spend settlement failed error_type=%s cost_micro_usd=%d",
            type(error).__name__,
            cost,
        )


__all__ = [
    "DEFAULT_SIGNED_IN_DAILY_BUDGET_MICRO_USD",
    "OPENAI_MODEL_RATES",
    "SIGNED_IN_DAILY_BUDGET_ENV",
    "ModelRates",
    "PostgresSignedInSpendLedger",
    "SignedInBudgetConfigurationError",
    "SignedInBudgetUnavailableError",
    "SignedInDailyBudgetExhaustedError",
    "SignedInSpendLedger",
    "default_signed_in_ledger",
    "model_rates",
    "run_cost_micro_usd",
    "settle_signed_in_run",
    "signed_in_daily_limit_micro_usd",
]
