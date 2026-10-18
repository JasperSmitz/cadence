# Current design

## System overview and boundaries

Cadence is a local, single-user Next.js App Router application using React, strict TypeScript, and Tailwind. Development and production scripts bind to loopback. The executable components are the web application and an explicit database migration CLI; there are no external service integrations.

Pages and the root layout live in `src/app`. Shared presentation lives in `src/components`. Pages are Server Components; the client-side `AppShell` uses `usePathname` to mark the active navigation link and receives page content as children. The shell includes responsive navigation, a skip link, and focus styling.

Database infrastructure lives in `src/db`. The server-only client lazily opens and caches a Drizzle database on `globalThis`; the underlying connection factory is shared with migrations and tests. SQLite requires Node execution and must stay outside client bundles. No current page calls the database client, so rendering/building these pages does not open an application database.

There are no feature modules, pure domain modules, Server Actions, API handlers, user-input validation schemas, or nutrition calculation functions. Zod is installed but unused. The database constraints are the only implemented data-validation boundary. There are no shadcn components.

## Current application surface

| Route       | Implemented purpose                                  |
| ----------- | ---------------------------------------------------- |
| `/`         | Static introduction with a link to Foods; no metrics |
| `/foods`    | Informational placeholder; no food listing or CRUD   |
| `/recipes`  | Informational placeholder                            |
| `/planner`  | Informational placeholder                            |
| `/shopping` | Informational placeholder                            |

Placeholder route names do not represent implemented domain models or workflows.

## Food persistence model and semantics

Food is represented by a database schema, not an application editing workflow. A row contains a name, nutritional values, optional reference-serving information, optional package weight and notes, an ID, and timestamps.

- All nutrition is per **100 g**. Mass values use integer **milligrams**, encoding grams to three decimal places. Energy uses integer **centi-kcal**, encoding kcal to two decimal places.
- Carbohydrates exclude fiber (EU convention). Nullable fiber means unknown; zero means known zero.
- Energy is supplied independently of macros; the schema imposes no macro-to-energy equation or combined nutrient-mass equation.
- `servingSizeMg` and `servingLabel` describe a reference conversion to grams, not a preferred portion. A label requires a weight; a weight may exist without a label.
- Package weight is descriptive metadata. Notes are free text, with no preparation-state or source taxonomy.
- No decimal parsing, aggregation, or rounding implementation exists. Stored precision must not be mistaken for an implemented nutrition calculator.

## Persistence and migrations

Drizzle uses `better-sqlite3`. `DATABASE_PATH` selects the file; the default is `data/cadence.sqlite`. The connection factory creates parent directories, enables foreign keys and WAL, and sets a five-second busy timeout. Application connections are reused; migration and test connections are closed explicitly.

`src/db/schema.ts` defines one application table, `foods`, with a nonunique name index. Duplicate names are permitted. SQL constraints enforce:

- Required integer nutrition fields; nutrients between 0 and 100 g per 100 g and energy between 0 and 1000 kcal per 100 g.
- Optional serving/package weights greater than zero and no more than 1000 kg.
- Trimmed, nonempty text when supplied: name up to 200 characters, serving label up to 100, and notes up to 2000. Optional text uses `NULL` rather than empty text. SQL trimming uses SQLite's `trim` behavior.
- Required IDs with length 36, but no UUID-format check. The test supplies a UUID; the schema has no ID generator.
- Required integer timestamps interpreted as UTC Unix milliseconds, nonnegative creation time, update time at least creation time, and safe-integer bounds. No automatic timestamp defaults or update hooks exist; writers supply both values.

Generate SQL and Drizzle metadata with `pnpm db:generate`; apply committed migrations with `pnpm db:migrate`. The CLI loads environment files using Next's environment loader, opens the configured file, applies migrations from `drizzle/`, and closes the connection. Generation reads process environment directly and does not explicitly load local environment files. Commands resolve relative paths from the repository root. Migrations are never applied during page rendering. Database files and SQLite sidecars are ignored by Git.

## Testing strategy

Vitest runs `src/**/*.test.ts` in a Node environment. The current suite has one database integration test: it migrates an isolated temporary file, checks foreign-key/WAL settings, inserts scaled integers and nullable fiber, closes/reopens the file, and verifies persistence and repeat migration. It also exercises selected integer, negative-value, serving-label/weight, and timestamp constraints. Temporary database files are cleaned up; the local application database is not used.

The combined check runs lint, typecheck, formatting verification, and tests. Production compilation is a separate build command. Current tests do not cover browser behavior or every schema constraint; see [TECH_DEBT](TECH_DEBT.md).
