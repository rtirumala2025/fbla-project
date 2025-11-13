"""
Analytics service aggregates finance, gameplay, and pet stats for reporting.
"""

from __future__ import annotations

import csv
import io
from datetime import date, datetime, timedelta, timezone
from typing import Iterable
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analytics import (
    AnalyticsDailySnapshot,
    AnalyticsMonthlySnapshot,
    AnalyticsNotification,
    AnalyticsWeeklySnapshot,
)
from app.models.finance import Transaction
from app.models.game import GameSession
from app.models.pet import Pet
from app.schemas.analytics import (
    AnalyticsCSVResponse,
    AnalyticsSnapshot,
    CareReport,
    ExpenseCategory,
    SnapshotNotification,
    SnapshotSummary,
    TrendSeries,
    WeeklySummary,
)


def _normalize_user_id(user_id: UUID | str) -> UUID:
    return user_id if isinstance(user_id, UUID) else UUID(str(user_id))


def _daterange(start: date, end: date) -> Iterable[date]:
    current = start
    while current <= end:
        yield current
        current += timedelta(days=1)


async def _get_pet(session: AsyncSession, user_id: UUID | str) -> Pet | None:
    user_uuid = _normalize_user_id(user_id)
    result = await session.execute(select(Pet).where(Pet.user_id == user_uuid))
    return result.scalar_one_or_none()


async def end_of_day_report(session: AsyncSession, user_id: UUID | str, target_date: date | None = None) -> CareReport:
    user_uuid = _normalize_user_id(user_id)
    target_date = target_date or datetime.now(tz=timezone.utc).date()
    start_dt = datetime.combine(target_date, datetime.min.time(), tzinfo=timezone.utc)
    end_dt = start_dt + timedelta(days=1)

    tx_stmt = (
        select(Transaction.transaction_type, func.coalesce(func.sum(Transaction.amount), 0))
        .where(
            Transaction.user_id == user_uuid,
            Transaction.created_at >= start_dt,
            Transaction.created_at < end_dt,
        )
        .group_by(Transaction.transaction_type)
    )
    totals = dict((await session.execute(tx_stmt)).all())

    games_stmt = select(func.count(GameSession.id)).where(
        GameSession.user_id == user_uuid,
        GameSession.created_at >= start_dt,
        GameSession.created_at < end_dt,
    )
    games_played = (await session.execute(games_stmt)).scalar_one()

    pet_stmt = select(Pet).where(Pet.user_id == user_uuid)
    pet = (await session.execute(pet_stmt)).scalar_one_or_none()

    happiness_gain = 0
    health_change = 0
    pet_actions = 0
    if pet:
        if pet.last_played and start_dt <= pet.last_played <= end_dt:
            happiness_gain += 10
            pet_actions += 1
        if pet.last_fed and start_dt <= pet.last_fed <= end_dt:
            health_change += 5
            pet_actions += 1
        if pet.last_bathed and start_dt <= pet.last_bathed <= end_dt:
            pet_actions += 1
        if pet.last_slept and start_dt <= pet.last_slept <= end_dt:
            pet_actions += 1

    return CareReport(
        date=target_date,
        coins_earned=int(totals.get("income", 0)),
        coins_spent=int(totals.get("expense", 0)),
        happiness_gain=happiness_gain,
        health_change=health_change,
        games_played=int(games_played or 0),
        pet_actions=pet_actions,
    )


async def _fetch_daily_snapshot(session: AsyncSession, user_id: UUID, target_date: date) -> AnalyticsDailySnapshot | None:
    stmt = select(AnalyticsDailySnapshot).where(
        AnalyticsDailySnapshot.user_id == user_id,
        AnalyticsDailySnapshot.snapshot_date == target_date,
    )
    return (await session.execute(stmt)).scalar_one_or_none()


async def _previous_daily_snapshot(
    session: AsyncSession,
    user_id: UUID,
    target_date: date,
) -> AnalyticsDailySnapshot | None:
    stmt = (
        select(AnalyticsDailySnapshot)
        .where(
            AnalyticsDailySnapshot.user_id == user_id,
            AnalyticsDailySnapshot.snapshot_date < target_date,
        )
        .order_by(AnalyticsDailySnapshot.snapshot_date.desc())
    )
    return (await session.execute(stmt)).scalars().first()


def _pet_stat_averages(pet: Pet | None) -> tuple[float, float, float, float]:
    if pet is None:
        return 0.0, 0.0, 0.0, 0.0
    return (
        float(pet.happiness or 0),
        float(pet.health or 0),
        float(pet.energy or 0),
        float(pet.cleanliness or 0),
    )


def _compose_daily_summary(report: CareReport, happiness: float, health: float) -> str:
    parts: list[str] = []
    net = report.coins_earned - report.coins_spent
    if net >= 0:
        parts.append(f"Positive coin flow of +{net}.")
    else:
        parts.append(f"Coin deficit of {net}. Focus on income tasks.")
    if report.happiness_gain > 0:
        parts.append(f"Happiness improved by {report.happiness_gain}.")
    if report.health_change > 0:
        parts.append(f"Health increased by {report.health_change}.")
    if not parts:
        parts.append("Stable day with no major changes.")
    if health < 45:
        parts.append("Health averages are trending low; plan recovery actions.")
    if happiness < 45:
        parts.append("Mood indicators suggest the pet needs more playtime.")
    return " ".join(parts)


async def _create_notifications(
    session: AsyncSession,
    user_id: UUID,
    snapshot: AnalyticsDailySnapshot,
    previous: AnalyticsDailySnapshot | None,
) -> None:
    if previous is None:
        return

    changes = [
        ("net_coins", snapshot.net_coins - previous.net_coins, 60.0),
        ("avg_health", snapshot.avg_health - previous.avg_health, 8.0),
        ("avg_happiness", snapshot.avg_happiness - previous.avg_happiness, 10.0),
    ]

    for stat, delta, threshold in changes:
        if abs(delta) < threshold:
            continue

        severity = "success" if delta > 0 else "critical" if stat == "avg_health" and delta < 0 else "warning"
        direction = "rose" if delta > 0 else "fell"
        message = f"{stat.replace('_', ' ').title()} {direction} by {abs(delta):.0f} compared to yesterday."

        exists_stmt = select(AnalyticsNotification).where(
            AnalyticsNotification.user_id == user_id,
            AnalyticsNotification.reference_date == snapshot.snapshot_date,
            AnalyticsNotification.stat == stat,
        )
        if (await session.execute(exists_stmt)).scalar_one_or_none():
            continue

        notification = AnalyticsNotification(
            user_id=user_id,
            daily_snapshot_id=snapshot.id,
            period_type="daily",
            reference_date=snapshot.snapshot_date,
            stat=stat,
            change=float(delta),
            severity=severity,
            message=message,
        )
        session.add(notification)


async def generate_daily_snapshot(
    session: AsyncSession,
    user_id: UUID,
    target_date: date | None = None,
) -> AnalyticsDailySnapshot:
    target_date = target_date or datetime.now(tz=timezone.utc).date()

    existing = await _fetch_daily_snapshot(session, user_id, target_date)
    previous = await _previous_daily_snapshot(session, user_id, target_date)

    report = await end_of_day_report(session, user_id, target_date)
    pet = await _get_pet(session, user_id)
    avg_happiness, avg_health, avg_energy, avg_cleanliness = _pet_stat_averages(pet)
    net_coins = report.coins_earned - report.coins_spent
    summary = _compose_daily_summary(report, avg_happiness, avg_health)

    if existing:
        existing.coins_earned = report.coins_earned
        existing.coins_spent = report.coins_spent
        existing.net_coins = net_coins
        existing.happiness_gain = report.happiness_gain
        existing.health_change = report.health_change
        existing.games_played = report.games_played
        existing.pet_actions = report.pet_actions
        existing.avg_happiness = avg_happiness
        existing.avg_health = avg_health
        existing.avg_energy = avg_energy
        existing.avg_cleanliness = avg_cleanliness
        existing.ai_summary = summary
        snapshot = existing
    else:
        snapshot = AnalyticsDailySnapshot(
            user_id=user_id,
            snapshot_date=target_date,
            coins_earned=report.coins_earned,
            coins_spent=report.coins_spent,
            net_coins=net_coins,
            happiness_gain=report.happiness_gain,
            health_change=report.health_change,
            games_played=report.games_played,
            pet_actions=report.pet_actions,
            avg_happiness=avg_happiness,
            avg_health=avg_health,
            avg_energy=avg_energy,
            avg_cleanliness=avg_cleanliness,
            ai_summary=summary,
        )
        session.add(snapshot)
        await session.flush()

    await _create_notifications(session, user_id, snapshot, previous)
    return snapshot


async def ensure_daily_snapshots(session: AsyncSession, user_id: UUID, start: date, end: date) -> None:
    for day in _daterange(start, end):
        await generate_daily_snapshot(session, user_id, day)


def _aggregate_period(snapshots: list[AnalyticsDailySnapshot]) -> dict[str, float]:
    if not snapshots:
        return {
            "coins_earned": 0,
            "coins_spent": 0,
            "net_coins": 0,
            "avg_happiness": 0.0,
            "avg_health": 0.0,
            "avg_energy": 0.0,
            "avg_cleanliness": 0.0,
            "happiness_gain": 0,
            "health_change": 0,
            "games_played": 0,
            "pet_actions": 0,
        }

    total_days = len(snapshots)
    sums = {
        "coins_earned": sum(s.coins_earned for s in snapshots),
        "coins_spent": sum(s.coins_spent for s in snapshots),
        "net_coins": sum(s.net_coins for s in snapshots),
        "avg_happiness": sum(s.avg_happiness for s in snapshots) / total_days,
        "avg_health": sum(s.avg_health for s in snapshots) / total_days,
        "avg_energy": sum(s.avg_energy for s in snapshots) / total_days,
        "avg_cleanliness": sum(s.avg_cleanliness for s in snapshots) / total_days,
        "happiness_gain": sum(s.happiness_gain for s in snapshots),
        "health_change": sum(s.health_change for s in snapshots),
        "games_played": sum(s.games_played for s in snapshots),
        "pet_actions": sum(s.pet_actions for s in snapshots),
    }
    return sums


def _compose_period_summary(
    period_name: str,
    metrics: dict[str, float],
) -> str:
    net = metrics["net_coins"]
    sentiment = "Positive" if net >= 0 else "Negative"
    summary = [
        f"{period_name.title()} overview: {sentiment} coin balance ({net:+.0f}).",
        f"Average health {metrics['avg_health']:.0f} | happiness {metrics['avg_happiness']:.0f}.",
    ]
    if metrics["health_change"] < 0:
        summary.append("Health declined overall; schedule rest or feeding.")
    if metrics["happiness_gain"] > 0:
        summary.append("Great job keeping your pet engaged!")
    if metrics["games_played"] == 0:
        summary.append("No games played. Consider a mini-game session.")
    return " ".join(summary)


async def generate_period_snapshot(
    session: AsyncSession,
    user_id: UUID,
    period: str,
    end_date: date,
) -> AnalyticsWeeklySnapshot | AnalyticsMonthlySnapshot:
    if period == "weekly":
        model = AnalyticsWeeklySnapshot
        window = 6
    elif period == "monthly":
        model = AnalyticsMonthlySnapshot
        window = 29
    else:  # pragma: no cover - defensive
        raise ValueError("Unsupported period")

    start_date = end_date - timedelta(days=window)
    await ensure_daily_snapshots(session, user_id, start_date, end_date)

    daily_stmt = (
        select(AnalyticsDailySnapshot)
        .where(
            AnalyticsDailySnapshot.user_id == user_id,
            AnalyticsDailySnapshot.snapshot_date >= start_date,
            AnalyticsDailySnapshot.snapshot_date <= end_date,
        )
        .order_by(AnalyticsDailySnapshot.snapshot_date)
    )
    snapshots = (await session.execute(daily_stmt)).scalars().all()
    metrics = _aggregate_period(snapshots)
    summary = _compose_period_summary(period, metrics)

    existing_stmt = select(model).where(
        model.user_id == user_id,
        model.period_start == start_date,
    )
    existing = (await session.execute(existing_stmt)).scalar_one_or_none()

    if existing:
        existing.period_end = end_date
        existing.coins_earned = int(metrics["coins_earned"])
        existing.coins_spent = int(metrics["coins_spent"])
        existing.net_coins = int(metrics["net_coins"])
        existing.avg_happiness = float(metrics["avg_happiness"])
        existing.avg_health = float(metrics["avg_health"])
        existing.avg_energy = float(metrics["avg_energy"])
        existing.avg_cleanliness = float(metrics["avg_cleanliness"])
        existing.total_happiness_gain = int(metrics["happiness_gain"])
        existing.total_health_change = int(metrics["health_change"])
        existing.total_games_played = int(metrics["games_played"])
        existing.total_pet_actions = int(metrics["pet_actions"])
        existing.ai_summary = summary
        return existing

    snapshot = model(
        user_id=user_id,
        period_start=start_date,
        period_end=end_date,
        coins_earned=int(metrics["coins_earned"]),
        coins_spent=int(metrics["coins_spent"]),
        net_coins=int(metrics["net_coins"]),
        avg_happiness=float(metrics["avg_happiness"]),
        avg_health=float(metrics["avg_health"]),
        avg_energy=float(metrics["avg_energy"]),
        avg_cleanliness=float(metrics["avg_cleanliness"]),
        total_happiness_gain=int(metrics["happiness_gain"]),
        total_health_change=int(metrics["health_change"]),
        total_games_played=int(metrics["games_played"]),
        total_pet_actions=int(metrics["pet_actions"]),
        ai_summary=summary,
    )
    session.add(snapshot)
    await session.flush()
    return snapshot


async def weekly_summary(session: AsyncSession, user_id: UUID | str, end_date: date | None = None) -> WeeklySummary:
    user_uuid = _normalize_user_id(user_id)
    end_date = end_date or datetime.now(tz=timezone.utc).date()
    start_date = end_date - timedelta(days=6)
    await ensure_daily_snapshots(session, user_uuid, start_date, end_date)

    stmt = (
        select(AnalyticsDailySnapshot)
        .where(
            AnalyticsDailySnapshot.user_id == user_uuid,
            AnalyticsDailySnapshot.snapshot_date >= start_date,
            AnalyticsDailySnapshot.snapshot_date <= end_date,
        )
        .order_by(AnalyticsDailySnapshot.snapshot_date)
    )
    snapshots = (await session.execute(stmt)).scalars().all()

    reports = [
        CareReport(
            date=snapshot.snapshot_date,
            coins_earned=snapshot.coins_earned,
            coins_spent=snapshot.coins_spent,
            happiness_gain=snapshot.happiness_gain,
            health_change=snapshot.health_change,
            games_played=snapshot.games_played,
            pet_actions=snapshot.pet_actions,
        )
        for snapshot in snapshots
    ]

    return WeeklySummary(start_date=start_date, end_date=end_date, reports=reports)


async def _daily_snapshots_range(
    session: AsyncSession,
    user_id: UUID,
    start: date,
    end: date,
) -> list[AnalyticsDailySnapshot]:
    await ensure_daily_snapshots(session, user_id, start, end)
    stmt = (
        select(AnalyticsDailySnapshot)
        .where(
            AnalyticsDailySnapshot.user_id == user_id,
            AnalyticsDailySnapshot.snapshot_date >= start,
            AnalyticsDailySnapshot.snapshot_date <= end,
        )
        .order_by(AnalyticsDailySnapshot.snapshot_date)
    )
    return (await session.execute(stmt)).scalars().all()


def _trend_from_snapshots(
    snapshots: list[AnalyticsDailySnapshot],
    metric: str,
    label: str,
) -> TrendSeries:
    values = []
    for snapshot in snapshots:
        if metric == "net_coins":
            value = float(snapshot.net_coins)
        elif metric == "avg_health":
            value = float(snapshot.avg_health)
        elif metric == "happiness_gain":
            value = float(snapshot.happiness_gain)
        else:
            value = float(snapshot.health_change)
        timestamp = datetime.combine(snapshot.snapshot_date, datetime.min.time(), tzinfo=timezone.utc)
        values.append({"timestamp": timestamp, "value": value})
    return TrendSeries(label=label, points=values)


async def monthly_trend(session: AsyncSession, user_id: UUID) -> TrendSeries:
    end_date = datetime.now(tz=timezone.utc).date()
    start_date = end_date - timedelta(days=29)
    snapshots = await _daily_snapshots_range(session, user_id, start_date, end_date)
    return _trend_from_snapshots(snapshots, "net_coins", "monthly_net_coins")


async def health_progression(session: AsyncSession, user_id: UUID) -> TrendSeries:
    end_date = datetime.now(tz=timezone.utc).date()
    start_date = end_date - timedelta(days=14)
    snapshots = await _daily_snapshots_range(session, user_id, start_date, end_date)
    return _trend_from_snapshots(snapshots, "avg_health", "health")


async def weekly_trend(session: AsyncSession, user_id: UUID, end_date: date) -> TrendSeries:
    start_date = end_date - timedelta(days=6)
    snapshots = await _daily_snapshots_range(session, user_id, start_date, end_date)
    return _trend_from_snapshots(snapshots, "net_coins", "weekly_net_coins")


async def expense_breakdown(session: AsyncSession, user_id: UUID, days: int = 30) -> list[ExpenseCategory]:
    start_dt = datetime.now(tz=timezone.utc) - timedelta(days=days)
    stmt = (
        select(Transaction.category, func.coalesce(func.sum(Transaction.amount), 0))
        .where(
            Transaction.user_id == user_id,
            Transaction.transaction_type == "expense",
            Transaction.created_at >= start_dt,
        )
        .group_by(Transaction.category)
    )
    result = await session.execute(stmt)
    return [
        ExpenseCategory(category=row[0] or "unknown", total=float(row[1]))
        for row in result.all()
    ]


async def _latest_notifications(session: AsyncSession, user_id: UUID, limit: int = 10) -> list[SnapshotNotification]:
    stmt = (
        select(AnalyticsNotification)
        .where(AnalyticsNotification.user_id == user_id)
        .order_by(AnalyticsNotification.created_at.desc())
        .limit(limit)
    )
    records = (await session.execute(stmt)).scalars().all()
    return [
        SnapshotNotification(
            id=str(notification.id),
            period_type=notification.period_type,
            reference_date=notification.reference_date,
            stat=notification.stat,
            change=notification.change,
            severity=notification.severity,
            message=notification.message,
            is_read=notification.is_read,
            created_at=notification.created_at,
        )
        for notification in records
    ]


def _snapshot_summary_from_daily(snapshot: AnalyticsDailySnapshot) -> SnapshotSummary:
    return SnapshotSummary(
        period="daily",
        start_date=snapshot.snapshot_date,
        end_date=snapshot.snapshot_date,
        coins_earned=snapshot.coins_earned,
        coins_spent=snapshot.coins_spent,
        net_coins=snapshot.net_coins,
        avg_happiness=snapshot.avg_happiness,
        avg_health=snapshot.avg_health,
        avg_energy=snapshot.avg_energy,
        avg_cleanliness=snapshot.avg_cleanliness,
        happiness_gain=snapshot.happiness_gain,
        health_change=snapshot.health_change,
        games_played=snapshot.games_played,
        pet_actions=snapshot.pet_actions,
        ai_summary=snapshot.ai_summary,
    )


def _snapshot_summary_from_period(
    period: str,
    snapshot: AnalyticsWeeklySnapshot | AnalyticsMonthlySnapshot,
) -> SnapshotSummary:
    return SnapshotSummary(
        period=period,
        start_date=snapshot.period_start,
        end_date=snapshot.period_end,
        coins_earned=snapshot.coins_earned,
        coins_spent=snapshot.coins_spent,
        net_coins=snapshot.net_coins,
        avg_happiness=snapshot.avg_happiness,
        avg_health=snapshot.avg_health,
        avg_energy=snapshot.avg_energy,
        avg_cleanliness=snapshot.avg_cleanliness,
        happiness_gain=snapshot.total_happiness_gain,
        health_change=snapshot.total_health_change,
        games_played=snapshot.total_games_played,
        pet_actions=snapshot.total_pet_actions,
        ai_summary=snapshot.ai_summary,
    )


def _compile_ai_insights(
    daily_summary: SnapshotSummary,
    weekly_summary: SnapshotSummary,
    monthly_summary: SnapshotSummary,
    health_trend: TrendSeries,
) -> list[str]:
    insights: list[str] = []

    if daily_summary.net_coins < 0:
        insights.append("You spent more than you earned today. Consider completing daily rewards before big purchases.")
    if daily_summary.health_change < 0 or daily_summary.avg_health < 45:
        insights.append("Pet health is dropping; schedule rest or feeding to recover.")
    if weekly_summary.net_coins > 0 and weekly_summary.happiness_gain > 0:
        insights.append("Great job! Weekly care routine kept coins positive and happiness rising.")
    if monthly_summary.net_coins < 0:
        insights.append("Monthly trend shows a coin deficit. Review spending categories in the expense chart.")
    if health_trend.points:
        latest_point = health_trend.points[-1]
        if isinstance(latest_point, dict):
            latest_value = latest_point.get("value")
        else:
            latest_value = getattr(latest_point, "value", None)
        if latest_value is not None and latest_value < 50:
            insights.append("Health trend is dipping. Queue up rest, feeding, or play sessions to recover momentum.")

    for summary in (daily_summary, weekly_summary, monthly_summary):
        if summary.ai_summary:
            insights.append(summary.ai_summary)

    # Deduplicate while preserving order
    seen: set[str] = set()
    unique_insights: list[str] = []
    for insight in insights:
        if insight not in seen:
            seen.add(insight)
            unique_insights.append(insight)
    return unique_insights[:8]


async def analytics_snapshot(session: AsyncSession, user_id: UUID | str) -> AnalyticsSnapshot:
    user_uuid = _normalize_user_id(user_id)
    today = datetime.now(tz=timezone.utc).date()

    daily_snapshot = await generate_daily_snapshot(session, user_uuid, today)
    weekly_snapshot = await generate_period_snapshot(session, user_uuid, "weekly", today)
    monthly_snapshot = await generate_period_snapshot(session, user_uuid, "monthly", today)

    weekly_trend_series = await weekly_trend(session, user_uuid, today)
    monthly_trend_series = await monthly_trend(session, user_uuid)
    health_series = await health_progression(session, user_uuid)
    expenses = await expense_breakdown(session, user_uuid)
    notifications = await _latest_notifications(session, user_uuid)

    daily_summary = _snapshot_summary_from_daily(daily_snapshot)
    weekly_summary_obj = _snapshot_summary_from_period("weekly", weekly_snapshot)
    monthly_summary_obj = _snapshot_summary_from_period("monthly", monthly_snapshot)
    ai_insights = _compile_ai_insights(daily_summary, weekly_summary_obj, monthly_summary_obj, health_series)

    return AnalyticsSnapshot(
        end_of_day=CareReport(
            date=daily_snapshot.snapshot_date,
            coins_earned=daily_snapshot.coins_earned,
            coins_spent=daily_snapshot.coins_spent,
            happiness_gain=daily_snapshot.happiness_gain,
            health_change=daily_snapshot.health_change,
            games_played=daily_snapshot.games_played,
            pet_actions=daily_snapshot.pet_actions,
        ),
        daily_summary=daily_summary,
        weekly_summary=weekly_summary_obj,
        monthly_summary=monthly_summary_obj,
        weekly_trend=weekly_trend_series,
        monthly_trend=monthly_trend_series,
        expenses=expenses,
        health_progression=health_series,
        ai_insights=ai_insights,
        notifications=notifications,
    )


async def export_reports_csv(session: AsyncSession, user_id: UUID | str, start: date, end: date) -> AnalyticsCSVResponse:
    if start > end:  # pragma: no cover - validated upstream, defensive
        raise ValueError("Start date must be before end date.")

    user_uuid = _normalize_user_id(user_id)
    await ensure_daily_snapshots(session, user_uuid, start, end)
    snapshots = await _daily_snapshots_range(session, user_uuid, start, end)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "date",
            "coins_earned",
            "coins_spent",
            "happiness_gain",
            "health_change",
            "games_played",
            "pet_actions",
        ]
    )
    for snapshot in snapshots:
        writer.writerow(
            [
                snapshot.snapshot_date.isoformat(),
                snapshot.coins_earned,
                snapshot.coins_spent,
                snapshot.happiness_gain,
                snapshot.health_change,
                snapshot.games_played,
                snapshot.pet_actions,
            ]
        )
    filename = f"care-report-{start.isoformat()}-to-{end.isoformat()}.csv"
    return AnalyticsCSVResponse(filename=filename, content=output.getvalue())

