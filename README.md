# MUBAS Smart Hostels

Student residence operations portal built with Next.js, Drizzle ORM, and PostgreSQL.

## Setup

1. Install the dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to your PostgreSQL connection string. Set `SESSION_SECRET` to a long, random value. Configure the `SEED_ADMIN_PASSWORD`; configure the `SEED_STUDENT_PASSWORD` if you want a student account created at seed time.
3. Create or update the database schema with `npm run db:push`.
4. Create the configured initial account(s) with `npm run db:seed`.
5. Start the app with `npm run dev`.

The initial administrator email defaults to `admin@mubas.ac.mw`. The password is taken from `SEED_ADMIN_PASSWORD`, not hard-coded. The optional student account defaults to `student@mubas.ac.mw` and is only created when `SEED_STUDENT_PASSWORD` is set. After starting the app, `GET /api/health` reports whether PostgreSQL is configured and reachable.

`npm run db:generate` generates SQL migrations in `drizzle/`; `npm run db:push` applies the current Drizzle schema directly to the configured PostgreSQL database.

## Included workflows

- Student login with a signed, HTTP-only session cookie and hostel-office credential issuance.
- Digital gate check-in/check-out history tied to the student's current room assignment.
- Room check-in/check-out inspection submissions with 1–4 photo records.
- Office-issued payment receipts with unique verification tracking numbers.
- Student maintenance reports and votes, with administrator status/verification updates.
- Room transfer requests; approval changes the student's active room assignment.
- Anonymous noise complaint submission and administrator review.
- Lost-and-found listings, photo attachments, and student item claims.
- Administrator views for students, inspection submissions, pending work, and receipts.

The anonymous complaint endpoint deliberately does not associate a complaint with an account. Inspection and lost-and-found photos are stored as data URLs in PostgreSQL (up to four images of 700 KB each for an inspection); plan external object storage if the deployment needs larger photo volumes.

## API resources

- `GET /api/health`, `POST /api/auth/login`, `POST /api/auth/logout`
- `/api/hostel/assignment`, `/api/hostel/checkins`, `/api/hostel/inspections`
- `/api/hostel/receipts`, `/api/hostel/maintenance`, `/api/hostel/transfers`
- `/api/hostel/noise`, `/api/hostel/lost-found`, `/api/hostel/students`, `/api/hostel/summary`
- `GET` and `POST /api/admin/credentials` for office-issued student accounts

Authenticated endpoints enforce the user role on the server. The database must be reachable and migrated before authenticated portal data can load.
