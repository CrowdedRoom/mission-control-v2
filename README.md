# 🦝 Mission Control Dashboard v2

A full-stack project management dashboard for DJ White and Larry to track development work together. Now with **local JSON database** — no external services required!

## ✨ Features

- 🎯 **Kanban Board** — Drag & drop tasks between columns
- 💾 **Local Database** — JSON file storage, no Supabase needed
- 📝 **Full CRUD** — Create, edit, delete tasks
- 👥 **Assignees** — Assign tasks to DJ or Larry
- 🏷️ **Projects** — Tag tasks by project with colors
- 🔥 **Priority Levels** — Low, Medium, High
- 📊 **Activity Feed** — Action logging
- 📈 **Stats Dashboard** — Track progress
- 🌙 **Dark Mode** — Sleek, modern UI

## 🛠 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Local JSON file (Node.js fs)
- **Styling:** Tailwind CSS
- **Drag & Drop:** @dnd-kit
- **Icons:** Lucide React
- **Dates:** date-fns

## 🚀 Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://http://localhost:3000) 🎉

That's it! No database setup required — data is stored in `data/db.json`.

## 📁 Project Structure

```
mission-control/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── tasks/         # Task CRUD API
│   │   │   └── activity/      # Activity feed API
│   │   ├── page.tsx           # Main dashboard
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── KanbanColumn.tsx   # Column container
│   │   ├── TaskCard.tsx       # Task card with drag
│   │   ├── TaskModal.tsx      # Add/edit modal
│   │   ├── ActivityFeed.tsx   # Activity sidebar
│   │   └── StatsBar.tsx       # Stats at top
│   └── lib/
│       └── db.ts              # Local JSON database
├── data/                      # Local database storage
│   └── db.json               # Auto-created on first run
└── package.json
```

## 🎯 Usage

1. **Create Tasks** — Click "New Task" or "Add task" in any column
2. **Drag & Drop** — Move tasks between columns to update status
3. **Edit Tasks** — Hover over a task and click the pencil icon
4. **Delete Tasks** — Hover and click the trash icon
5. **View Activity** — See recent actions in the sidebar

## 💾 Database

Data is stored in `data/db.json` as plain JSON:

```json
{
  "tasks": [
    {
      "id": "...",
      "title": "Task name",
      "description": "Task details",
      "status": "in_progress",
      "assignee": "dj",
      "project": "clayboss",
      "priority": "high",
      "created_at": "...",
      "updated_at": "..."
    }
  ],
  "activity": [
    {
      "id": "...",
      "task_id": "...",
      "action": "created task \"Task name\"",
      "actor": "dj",
      "timestamp": "..."
    }
  ]
}
```

### Backup & Migration

- **Backup:** Copy `data/db.json` to backup
- **Migration:** JSON format makes it easy to migrate data if needed
- **Git:** Add `data/` to `.gitignore` if you don't want to commit data

## 🚀 Deploy to Vercel

```bash
vercel login
vercel --prod
```

Note: Since this uses local file storage, it works best as a **local development tool**. For serverless deployments, you'd need to switch to a proper database.

## 👥 Team

- **DJ White** — Product owner, lead developer
- **Larry** 🦝 — AI assistant, night shift worker

---

*Built with Next.js + Local JSON by Larry for DJ*
