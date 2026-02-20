import { NextResponse } from 'next/server'
import { getPipelineApps, upsertPipelineApp, PipelineApp } from '@/lib/db-sqlite'

const DEFAULT_APPS: Omit<PipelineApp, "created_at" | "updated_at">[] = [
  {
    id: "clayboss",
    name: "ClayBoss",
    emoji: "🏺",
    color: "#a855f7",
    stack: "React Native / Expo",
    phase: "app-store",
    phases: ["build", "test", "app-store", "live", "revenue"],
    blocker: "Needs App Store Connect sandbox tester + RevenueCat testing",
    next_action: "DJ to set up sandbox tester in App Store Connect",
    assignee: "dj",
    notes: "Phases 1-5 complete, 13 bug fixes. RevenueCat wired. Bundle: com.clayboss.app",
    store_url: null,
    github_url: null,
    revenue_monthly: 0,
  },
  {
    id: "poker-tracker",
    name: "Poker Tracker",
    emoji: "🎴",
    color: "#3b82f6",
    stack: "Web (Netlify)",
    phase: "live",
    phases: ["build", "test", "live", "revenue"],
    blocker: "Poker group not using it yet",
    next_action: "Larry to research poker group adoption strategies",
    assignee: "larry",
    notes: "Deployed on Netlify. Needs real users.",
    store_url: "https://poker-sesh.netlify.app",
    github_url: null,
    revenue_monthly: 0,
  },
  {
    id: "expendo",
    name: "Expendo",
    emoji: "💸",
    color: "#22c55e",
    stack: "React Native",
    phase: "test",
    phases: ["build", "test", "live", "revenue"],
    blocker: "Waiting on Chad feedback",
    next_action: "Follow up with Chad",
    assignee: "dj",
    notes: "Business expense app for Chad. Phases 1-3 done.",
    store_url: null,
    github_url: null,
    revenue_monthly: 0,
  },
  {
    id: "sticker-app",
    name: "Sticker App",
    emoji: "🎨",
    color: "#eab308",
    stack: "Web / React Native",
    phase: "test",
    phases: ["build", "test", "live", "revenue"],
    blocker: "Needs polish before launch",
    next_action: "Larry to review and identify polish items",
    assignee: "larry",
    notes: "AI-powered sticker generation, e-commerce ready.",
    store_url: null,
    github_url: null,
    revenue_monthly: 0,
  },
]

export async function GET() {
  try {
    let apps = getPipelineApps()

    // Seed with default apps if empty
    if (apps.length === 0) {
      for (const app of DEFAULT_APPS) {
        upsertPipelineApp(app)
      }
      apps = getPipelineApps()
    }

    return NextResponse.json(apps)
  } catch (error) {
    console.error('Error fetching pipeline apps:', error)
    return NextResponse.json({ error: 'Failed to fetch pipeline apps' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    if (!body.id || !body.name) {
      return NextResponse.json({ error: 'App id and name are required' }, { status: 400 })
    }

    const app = upsertPipelineApp({
      id: body.id,
      name: body.name,
      emoji: body.emoji || '📱',
      color: body.color || '#3b82f6',
      stack: body.stack || null,
      phase: body.phase || 'build',
      phases: body.phases || ['build', 'test', 'live', 'revenue'],
      blocker: body.blocker || null,
      next_action: body.next_action || null,
      assignee: body.assignee || 'larry',
      notes: body.notes || null,
      store_url: body.store_url || null,
      github_url: body.github_url || null,
      revenue_monthly: body.revenue_monthly || 0,
    })

    return NextResponse.json(app, { status: 201 })
  } catch (error) {
    console.error('Error creating pipeline app:', error)
    return NextResponse.json({ error: 'Failed to create pipeline app' }, { status: 500 })
  }
}
