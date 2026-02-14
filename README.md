# HR Attendance Frontend

Frontend dashboard for managing employees and attendance records.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- ESLint 9 (`eslint-config-next`)
- Vercel (deployment target)

## Features

- Dashboard with attendance trend overview
- Attendance page with Present/Absent updates
- All Employ page with search and CRUD actions (view, add, edit, delete)
- Server-side data fetching from backend API
- Next.js API proxy routes for secure backend calls

## Environment Variables

Create a `.env.local` file:

```bash
API_BASE=http://194.164.148.182/api
```

Notes:

- `API_BASE` is used for server-side API proxy routes.
- `NEXT_PUBLIC_API_BASE` is still supported as fallback, but `API_BASE` is recommended.

## Getting Started

Install dependencies and run dev server:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

- `npm run dev` - start development server
- `npm run build` - create production build
- `npm run start` - run production server
- `npm run lint` - run ESLint

## Deploy on Vercel

1. Import this project in Vercel.
2. Add environment variable in Vercel project settings:
   - `API_BASE=http://194.164.148.182/api`
3. Deploy.

If your API is HTTP-only, calls still work because requests are made from server-side routes/functions.
