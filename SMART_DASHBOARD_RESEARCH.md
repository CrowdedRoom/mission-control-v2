# Smart Dashboard Research

## Overview
A dashboard that moves beyond stats to provide actionable intelligence about work patterns, project momentum, and recommendations.

## Current Dashboard
- Task stats (total, in progress, review, done)
- High priority tasks list
- Recent activity feed
- Quick links and project status

**Problem:** Reactive view. Shows what exists but doesn't guide next action.

## Smart Dashboard Vision

### 1. Work Velocity & Trends
**What:** Show task completion rate over time with trajectory
- "Completed 12 tasks this week (↑20% vs last week)"
- Visual trend line: are we accelerating or slowing?
- Comparison: "Better than your 4-week average by 15%"

**Why:** Gives motivation + shows if pace is sustainable/slowing

**Implementation:**
- Track task completion timestamps
- Calculate weekly/monthly velocity
- Show trend indicator (↑↓→)
- Add small trend chart

### 2. Project Health Scorecard
**What:** Instead of just task count, show project momentum
- Green/yellow/red status based on:
  - Days since last activity
  - % tasks in "review" (stuck?)
  - Task completion velocity in THIS project
  - Open task count trending (↑ or ↓?)

**Why:** You juggle 4+ projects. Quick visual shows which ones need attention.

**Implementation:**
- Color-coded cards with emoji status
- Last activity timestamp
- "Stuck tasks" (>3 days in review)
- Recommendation: "Poker app: no activity in 7 days, consider sprint"

### 3. Smart Recommendations
**What:** Bot recommends next actions based on patterns
- "Focus: Mission Control (3 open, 2 in review, active today)"
- "Stagnant: Poker app (7 days quiet, 4 backlog tasks)"
- "Waiting: Chad's expense app (depends on specs)"
- "Blocked: Home Assistant (server down, waiting troubleshoot)"

**Why:** Reduces decision fatigue. You see what needs focus.

**Implementation:**
- Scoring algorithm: (activity_recency × task_count × priority) / days_inactive
- Group by status: "Focus Now" | "Next Priority" | "Waiting/Blocked"
- Refresh daily or on dashboard load

### 4. Time Insights (Future)
**What:** If we add time tracking to tasks:
- "Spent 8 hours on Mission Control, 3 on poker this week"
- "This task took 2x longer than similar ones — consider breaking it down"
- "You're most productive 10 PM - 2 AM (night shift verified)"

**Why:** Helps understand time allocation vs actual value.

## Technical Approach

### Phase 1 (Quick Win)
- Add velocity chart (7, 30 day views)
- Project health status with activity timestamps
- Hide projects with no activity

### Phase 2
- Smart recommendations component
- Task scoring algorithm
- Activity filtering

### Phase 3
- Time tracking integration
- Productivity patterns
- Predicted completion dates

## Database/Schema Needed
- Track `activity_at` on tasks (not just `updated_at`)
- Tag tasks with project accurately (currently may be missing)
- Optional: time tracking on tasks

## UI/UX Notes
- Keep it **glanceable** — 5-second understanding
- Use emoji + color heavily
- Avoid cognitive load with text
- Put recommendations in "inbox zero" style above fold

## Success Metrics
- Time to decision on "what to work on next" decreases
- More consistent project momentum
- Context switching reduces (focus area clearer)
