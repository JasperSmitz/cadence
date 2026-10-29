# Cadence

A local, single-user nutrition workspace with searchable Foods, creation/editing, and confirmed permanent deletion. Recipes, Planner, and Shopping remain informational placeholders.

## Setup

Use Node **24.22.2** (`.node-version`) and pnpm **12.8.1** (`packageManager`). With Corepack available:

```sh
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm db:migrate
pnpm dev
```

Open http://127.0.0.1:3000. Development and production servers bind to loopback by default. No accounts or external services are required. SQLite and native build dependencies need their installation scripts; permitted builds are listed in `pnpm-workspace.yaml`.

## Using Foods

Open Foods to search by name or add a food. Required nutrition values start blank and must be entered, including explicit zero where appropriate. Inputs are per 100 g in kcal and grams; use either a decimal point or comma (always interpreted as a decimal separator), without thousands grouping or scientific notation. Grams allow three decimal places and kcal two. Optional blanks become unknown/absent values; fiber zero remains known zero.

Edit any food to change its values, reference-serving conversion, package weight, or notes. A serving label requires a weight. Duplicate names are allowed; put preparation state in the name, such as “rice, dry.” Failed saves retain input. Delete requires confirmation and is permanent.

## Commands

| Command                             | Purpose                                            |
| ----------------------------------- | -------------------------------------------------- |
| `pnpm dev`                          | Development server                                 |
| `pnpm build` / `pnpm start`         | Production build / local server                    |
| `pnpm check`                        | Lint, typecheck, formatting check, and tests       |
| `pnpm lint` / `pnpm typecheck`      | Individual static checks                           |
| `pnpm format` / `pnpm format:check` | Apply / verify formatting                          |
| `pnpm test`                         | Vitest tests using temporary SQLite files          |
| `pnpm db:generate`                  | Generate committed migrations after schema changes |
| `pnpm db:migrate`                   | Apply committed migrations; safe to rerun          |

Run commands from the repository root. Database migrations load `.env.local` through Next's environment loader. Drizzle generation does not require a database connection. An explicitly supplied `DATABASE_PATH` overrides environment-file values:

```sh
DATABASE_PATH=/tmp/cadence-fresh.sqlite pnpm db:migrate
```

## Structure

- `src/app`: App Router pages and global styling.
- `src/components`: Navigation shell and shared placeholder UI.
- `src/features/foods`: Food presentation, exact parsing/validation, and server-only persistence.
- `src/app/foods/actions.ts`: Validated Server Actions with route revalidation.
- `src/db/schema.ts`: Drizzle schema with SQL constraints.
- `src/db/client.ts`: Lazy server-only application database entry point.
- `src/db/connection.ts`: SQLite configuration shared by server, migrations, and tests.
- `scripts/migrate.ts` and `drizzle/`: Explicit migration runner and committed migration history.
- `src/db/migrations.test.ts`: Fresh migration, persistence, and constraint verification.
- `AGENTS.md`: Persistent project guidance.

## Database conventions

Default database: `data/cadence.sqlite`, ignored by Git along with sidecars. Connections enable foreign keys, WAL, and a 5-second busy timeout. Page rendering never applies migrations; static builds do not open the application database.

Food nutrition is per 100 g, with carbohydrate excluding fiber. Unknown fiber is `NULL`. Grams are stored as integer milligrams (three decimal places), kcal as integer centi-kcal (two decimal places). Energy is supplied independently of macros. Serving information describes a reference conversion to grams. Notes are optional free text.

Database bounds: nutrients 0–100 g per 100 g, energy 0–1000 kcal per 100 g, serving/package weights greater than zero up to 1000 kg. Names are trimmed, 1–200 characters; serving labels 1–100; notes 1–2000. Nullable text uses `NULL` rather than an empty string. Food write functions generate UUIDs and UTC Unix millisecond timestamps on the server; edits preserve creation time. Mutation IDs are validated as UUIDs. Decimal text is parsed directly into scaled integers without floating-point multiplication; excess precision is rejected. There are no nutrition calculations or aggregations.

## Backup and restore

Stop all Cadence processes before copying or replacing the database. For a consistent backup of a database that may have WAL contents, use SQLite's backup command (SQLite CLI required):

```sh
sqlite3 data/cadence.sqlite ".backup '/absolute/path/cadence-backup.sqlite'"
```

To restore, keep the app stopped, move the current database and any `-wal`/`-shm` sidecars aside together, then copy the backup to the configured database path. Run `pnpm db:migrate` before restarting. Keep backups outside Git; they contain personal data.
