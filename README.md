# 🦝 Mission Control Dashboard v2

A full-stack project management dashboard for DJ White and Larry to track development work together.

## ✨ Features

- 🎯 **Kanban Board** — Drag & drop tasks between columns
- 💾 **Real Database** — Supabase PostgreSQL backend
- 📝 **Full CRUD** — Create, edit, delete tasks
- 👥 **Assignees** — Assign tasks to DJ or Larry
- 🏷️ **Projects** — Tag tasks by project with colors
- 🔥 **Priority Levels** — Low, Medium, High
- 📊 **Activity Feed** — Real-time action logging
- 📈 **Stats Dashboard** — Track progress
- 🌙 **Dark Mode** — Sleek, modern UI

## 🛠 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS
- **Drag & Drop:** @dnd-kit
- **Icons:** Lucide React
- **Dates:** date-fns

## 🚀 Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, run the contents of `supabase/schema.sql`
3. Go to Settings → API and copy:
   - Project URL
   - Anon/public key

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install & Run

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## 📁 Project Structure

```
mission-control-v2/
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
│       └── supabase.ts        # Supabase client
├── supabase/
│   └── schema.sql             # Database schema
└── .env.example
```

## 🎯 Usage

1. **Create Tasks** — Click "New Task" or "Add task" in any column
2. **Drag & Drop** — Move tasks between columns to update status
3. **Edit Tasks** — Hover over a task and click the pencil icon
4. **Delete Tasks** — Hover and click the trash icon
5. **View Activity** — See recent actions in the sidebar

## 🚀 Deploy to Vercel

```bash
vercel login
vercel --prod
```

Add your environment variables in the Vercel dashboard.

## 👥 Team

- **DJ White** — Product owner, lead developer
- **Larry** 🦝 — AI assistant, night shift worker

---

*Built with Next.js + Supabase by Larry for DJ*
