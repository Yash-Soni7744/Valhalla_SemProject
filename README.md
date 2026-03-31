# Miestilo Leads CRM

A modern, frontend-only **Leads & Customer Relationship Management (CRM)** dashboard built using **Next.js 14 (App Router)**.  
This project functions as an MVP-style CRM with authentication, lead management, follow-ups, and dashboard analytics — all powered by **browser LocalStorage** (no backend required).

---

## ✨ Features

- 🔐 Authentication (Admin – LocalStorage based)
- 📊 Dashboard overview
- 🧾 Lead management (create, view, edit leads)
- 👥 Customer management
- ⏰ Follow-ups tracking
- 👤 User management (Admin only)
- 📦 Product-based lead categorization
- 📁 CSV import support (UI-level)
- 🎨 Clean, responsive UI

---

## 🧠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State & Data**: Browser LocalStorage (mock backend)
- **Auth**: Custom client-side authentication
- **Linting**: ESLint

---

## 🚀 Getting Started (Run Locally)

### 1️⃣ Clone the repository
```bash
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>

## Default Login
The app will automatically seed an Admin user on first load.
- **Email**: `admin@miestilo.com`
- **Password**: `admin`

## Database Schema
A `schema.sql` file is included in the root directory for reference if you wish to connect this to a real PostgreSQL/Supabase backend in the future.

The frontend is currently using `services/api.ts` to mock these tables using `localStorage`. To connect to a real backend, replace the functions in `services/api.ts` with actual API calls.
