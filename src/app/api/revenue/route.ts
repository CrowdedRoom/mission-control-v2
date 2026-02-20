import { NextResponse } from 'next/server'
import { getRevenueGoal, upsertRevenueGoal } from '@/lib/db'

const DEFAULT_GOAL = {
  label: 'Financial Independence',
  monthly_revenue: 0,
  target_monthly: 20833,
  apps_live: 0,
  notes: 'Target: replace $250k/yr Meta salary with passive app income by age 50'
}

export async function GET() {
  try {
    let goal = getRevenueGoal()

    // Seed with default if none exists
    if (!goal) {
      goal = upsertRevenueGoal(DEFAULT_GOAL)
    }

    return NextResponse.json(goal)
  } catch (error) {
    console.error('Error fetching revenue goal:', error)
    return NextResponse.json({ error: 'Failed to fetch revenue goal' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    // Get existing goal or use defaults
    const existing = getRevenueGoal() ?? DEFAULT_GOAL

    const goal = upsertRevenueGoal({
      label: body.label ?? existing.label,
      monthly_revenue: body.monthly_revenue ?? existing.monthly_revenue,
      target_monthly: body.target_monthly ?? existing.target_monthly,
      apps_live: body.apps_live ?? existing.apps_live,
      notes: body.notes !== undefined ? body.notes : existing.notes
    })

    return NextResponse.json(goal)
  } catch (error) {
    console.error('Error updating revenue goal:', error)
    return NextResponse.json({ error: 'Failed to update revenue goal' }, { status: 500 })
  }
}
