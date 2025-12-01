"""
Report service for generating PDF exports and AI cost forecasts.
"""

from __future__ import annotations

import base64
import io
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional
from uuid import UUID

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.finance import Transaction
from app.models.game import GameSession
from app.models.pet import Pet
from app.schemas.analytics import CareReport, ExpenseCategory
from app.schemas.reports import CostForecast, ForecastDataPoint, PDFExportRequest
from app.services.analytics_service import (
    analytics_snapshot,
    end_of_day_report,
    expense_breakdown,
)


def _normalize_user_id(user_id: UUID | str) -> UUID:
    return user_id if isinstance(user_id, UUID) else UUID(str(user_id))


async def generate_pdf_report(
    session: AsyncSession,
    user_id: UUID | str,
    request: PDFExportRequest,
) -> bytes:
    """
    Generate a PDF report with analytics data.
    
    Args:
        session: Database session
        user_id: User ID
        request: PDF export request parameters
        
    Returns:
        PDF file as bytes
    """
    user_uuid = _normalize_user_id(user_id)
    
    # Create PDF buffer
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    story = []
    
    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=30,
    )
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#475569'),
        spaceAfter=12,
    )
    
    # Title
    story.append(Paragraph("Care Analytics Report", title_style))
    story.append(Paragraph(
        f"Period: {request.start_date.strftime('%B %d, %Y')} - {request.end_date.strftime('%B %d, %Y')}",
        styles['Normal']
    ))
    story.append(Spacer(1, 0.3 * inch))
    
    # Get analytics data
    reports = []
    current_date = request.start_date
    while current_date <= request.end_date:
        try:
            report = await end_of_day_report(session, user_uuid, current_date)
            reports.append(report)
        except Exception:
            pass  # Skip dates with no data
        current_date += timedelta(days=1)
    
    if not reports:
        story.append(Paragraph("No data available for the selected period.", styles['Normal']))
    else:
        # Summary statistics
        story.append(Paragraph("Summary Statistics", heading_style))
        total_coins_earned = sum(r.coins_earned for r in reports)
        total_coins_spent = sum(r.coins_spent for r in reports)
        total_games = sum(r.games_played for r in reports)
        total_actions = sum(r.pet_actions for r in reports)
        
        summary_data = [
            ['Metric', 'Value'],
            ['Total Coins Earned', str(total_coins_earned)],
            ['Total Coins Spent', str(total_coins_spent)],
            ['Net Coins', str(total_coins_earned - total_coins_spent)],
            ['Total Games Played', str(total_games)],
            ['Total Pet Actions', str(total_actions)],
        ]
        
        summary_table = Table(summary_data, colWidths=[3 * inch, 2 * inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 0.3 * inch))
        
        # Daily reports table
        if len(reports) <= 30:  # Only show table if reasonable number of days
            story.append(Paragraph("Daily Reports", heading_style))
            table_data = [['Date', 'Coins Earned', 'Coins Spent', 'Games', 'Actions']]
            for report in reports:
                table_data.append([
                    report.date.strftime('%Y-%m-%d'),
                    str(report.coins_earned),
                    str(report.coins_spent),
                    str(report.games_played),
                    str(report.pet_actions),
                ])
            
            daily_table = Table(table_data, colWidths=[1.5 * inch, 1 * inch, 1 * inch, 0.8 * inch, 0.8 * inch])
            daily_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
            ]))
            story.append(daily_table)
            story.append(Spacer(1, 0.3 * inch))
        
        # Expense breakdown
        expenses = await expense_breakdown(session, user_uuid)
        if expenses:
            story.append(Paragraph("Expense Breakdown", heading_style))
            expense_data = [['Category', 'Total']]
            for expense in expenses:
                expense_data.append([expense.category, f"${expense.total:.2f}"])
            
            expense_table = Table(expense_data, colWidths=[3 * inch, 2 * inch])
            expense_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
            ]))
            story.append(expense_table)
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer.read()


async def generate_cost_forecast(
    session: AsyncSession,
    user_id: UUID | str,
    forecast_days: int = 30,
) -> CostForecast:
    """
    Generate AI-powered cost forecast based on historical spending patterns.
    
    Args:
        session: Database session
        user_id: User ID
        forecast_days: Number of days to forecast (default 30)
        
    Returns:
        CostForecast with predictions and insights
    """
    user_uuid = _normalize_user_id(user_id)
    today = datetime.now(tz=timezone.utc).date()
    start_date = today - timedelta(days=30)  # Use last 30 days for training
    
    # Get historical expense data
    start_dt = datetime.combine(start_date, datetime.min.time(), tzinfo=timezone.utc)
    end_dt = datetime.combine(today, datetime.max.time(), tzinfo=timezone.utc)
    
    tx_stmt = (
        select(
            func.date(Transaction.created_at).label('date'),
            func.sum(Transaction.amount).label('daily_total')
        )
        .where(
            Transaction.user_id == user_uuid,
            Transaction.transaction_type == 'expense',
            Transaction.created_at >= start_dt,
            Transaction.created_at <= end_dt,
        )
        .group_by(func.date(Transaction.created_at))
    )
    
    results = await session.execute(tx_stmt)
    historical_data = {row.date: float(row.daily_total) for row in results}
    
    # Calculate average daily cost
    if historical_data:
        avg_daily_cost = sum(historical_data.values()) / len(historical_data)
    else:
        avg_daily_cost = 0.0
    
    # Simple forecasting: use moving average with trend
    # In a production system, this would use more sophisticated ML models
    forecast_points: List[ForecastDataPoint] = []
    predicted_avg = avg_daily_cost
    
    # Apply a simple trend (slight increase/decrease based on recent pattern)
    if len(historical_data) >= 7:
        recent_avg = sum(list(historical_data.values())[-7:]) / 7
        trend_factor = (recent_avg - avg_daily_cost) / avg_daily_cost if avg_daily_cost > 0 else 0
        predicted_avg = avg_daily_cost * (1 + trend_factor * 0.5)  # Dampen trend
    
    for i in range(forecast_days):
        forecast_date = today + timedelta(days=i + 1)
        # Add some variance
        variance = predicted_avg * 0.1  # 10% variance
        predicted_cost = max(0, predicted_avg + (variance * (i % 3 - 1) / 3))
        
        forecast_points.append(ForecastDataPoint(
            date=forecast_date,
            predicted_cost=predicted_cost,
            confidence_interval_lower=max(0, predicted_cost - variance),
            confidence_interval_upper=predicted_cost + variance,
        ))
    
    total_predicted = sum(p.predicted_cost for p in forecast_points)
    
    # Generate insights
    insights = []
    if avg_daily_cost > 0:
        if predicted_avg > avg_daily_cost * 1.1:
            insights.append(f"Forecast indicates a {((predicted_avg / avg_daily_cost - 1) * 100):.1f}% increase in daily spending.")
        elif predicted_avg < avg_daily_cost * 0.9:
            insights.append(f"Forecast indicates a {((1 - predicted_avg / avg_daily_cost) * 100):.1f}% decrease in daily spending.")
        else:
            insights.append("Spending patterns are expected to remain relatively stable.")
        
        insights.append(f"Projected total cost over {forecast_days} days: ${total_predicted:.2f}")
        insights.append(f"Average daily cost: ${predicted_avg:.2f}")
    else:
        insights.append("No historical spending data available. Forecast based on zero baseline.")
    
    return CostForecast(
        forecast_period_start=today + timedelta(days=1),
        forecast_period_end=today + timedelta(days=forecast_days),
        current_average_daily_cost=avg_daily_cost,
        predicted_average_daily_cost=predicted_avg,
        total_predicted_cost=total_predicted,
        forecast_points=forecast_points,
        insights=insights,
        generated_at=datetime.now(tz=timezone.utc),
    )
