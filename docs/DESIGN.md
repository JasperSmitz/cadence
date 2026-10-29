# Current design

## System overview and boundaries

Cadence is a local, single-user Next.js App Router application using React, strict TypeScript, and Tailwind. Development and production scripts bind to loopback. The executable components are the web application and an explicit database migration CLI; there are no external service integrations.

Pages and the root layout live in `src/app`. Shared presentation lives in `src/components`. Pages are Server Components; the client-side `AppShell` uses `usePathname` to mark the active navigation link and receives page content as children. The shell includes responsive navigation, a skip link, and focus styling.

Database infrastructure lives in `src/db`. The server-only client lazily opens and caches a Drizzle database on `globalThis`; the underlying connection factory is shared with migrations and tests. SQLite requires Node execution and must stay outside client bundles. The Foods page reads the database at request time (`force-dynamic`, Node runtime). Other pages remain informational. Production builds do not query Foods data.

`src/features/foods` contains a client workspace, pure decimal parsing/validation, and server-only persistence functions that accept a database connection for isolated testing. Server Actions use the existing server-only client, validate untrusted field values and UUIDs, return field/form errors or success messages, and revalidate `/foods` on successful mutations. The client refreshes the route and keeps failed-save values intact. Missing/deleted rows return useful failures; unexpected database errors are logged server-side and receive generic messages.

Search uses a GET query parameter and literal substring matching with SQLite `lower`/`instr`, ordered by name and ID; duplicate names are allowed. It does not interpret search text as SQL wildcards. Native modal dialogs provide edit and permanent-delete confirmation. There are no API handlers, generic repositories, shadcn components, or nutrition calculation functions.

## Current application surface

| Route       | Implemented purpose                                              |
| ----------- | ---------------------------------------------------------------- |
| `/`         | Static introduction with a link to Foods; no metrics             |
| `/foods`    | Name search, list, creation/editing, and confirmed hard deletion |
| `/recipes`  | Informational placeholder                                        |
| `/planner`  | Informational placeholder                                        |
| `/shopping` | Informational placeholder                                        |

Placeholder route names do not represent implemented domain models or workflows.

## Food persistence model and semantics

Food is represented by a database schema and an editing workflow. A row contains a name, nutritional values, optional reference-serving information, optional package weight and notes, an ID, and timestamps.

- All nutrition is per **100 g**. Mass values use integer **milligrams**, encoding grams to three decimal places. Energy uses integer **centi-kcal**, encoding kcal to two decimal places.
- Carbohydrates exclude fiber (EU convention). Nullable fiber means unknown; zero means known zero.
- Energy is supplied independently of macros; the schema imposes no macro-to-energy equation or combined nutrient-mass equation.
- `servingSizeMg` and `servingLabel` describe a reference conversion to grams, not a preferred portion. A label requires a weight; a weight may exist without a label.
- Package weight is descriptive metadata. Notes are free text, with no preparation-state or source taxonomy.
- Decimal text is parsed using integer/BigInt arithmetic, accepting . or , as the decimal separator, never thousands grouping or scientific notation. Grams allow up to three decimal places and kcal two; excess precision is rejected. Required blank values are errors; optional blanks become `NULL`. Formatting preserves stored precision without rounding. No quantity calculation, aggregation, or rounding implementation exists.

## Persistence and migrations

Drizzle uses `better-sqlite3`. `DATABASE_PATH` selects the file; the default is `data/cadence.sqlite`. The connection factory creates parent directories, enables foreign keys and WAL, and sets a five-second busy timeout. Application connections are reused; migration and test connections are closed explicitly.

`src/db/schema.ts` defines one application table, `foods`, with a nonunique name index. Duplicate names are permitted. SQL constraints enforce:

- Required integer nutrition fields; nutrients between 0 and 100 g per 100 g and energy between 0 and 1000 kcal per 100 g.
- Optional serving/package weights greater than zero and no more than 1000 kg.
- Trimmed, nonempty text when supplied: name up to 200 characters, serving label up to 100, and notes up to 2000. Optional text uses `NULL` rather than empty text. SQL trimming uses SQLite's `trim` behavior.
- Required IDs with length 36, but no UUID-format check. Application mutation IDs are UUID-validated using Zod; server write functions generate UUIDs. The database constraint itself remains length-only.
- Required integer timestamps interpreted as UTC Unix milliseconds, nonnegative creation time, update time at least creation time, and safe-integer bounds. No database timestamp defaults or update hooks exist. Server writes supply timestamps; edits preserve creation time and do not move update time backwards.

Generate SQL and Drizzle metadata with `pnpm db:generate`; apply committed migrations with `pnpm db:migrate`. The CLI loads environment files using Next's environment loader, opens the configured file, applies migrations from `drizzle/`, and closes the connection. Generation reads process environment directly and does not explicitly load local environment files. Commands resolve relative paths from the repository root. Migrations are never applied during page rendering. Database files and SQLite sidecars are ignored by Git.

## Testing strategy

Vitest runs `src/**/*.test.ts` in a Node environment. The foundation database integration test migrates an isolated temporary file, checks foreign-key/WAL settings, inserts scaled integers and nullable fiber, closes/reopens the file, and verifies persistence and repeat migration. It also exercises selected integer, negative-value, serving-label/weight, and timestamp constraints. Temporary database files are cleaned up; the local application database is not used.

Food tests also cover exact decimal parsing/formatting, precision and bounds, null/zero and serving semantics, untrusted IDs/types, and isolated CRUD persistence including duplicate names, literal search, unchanged-edit round trips, and missing/deleted rows.

The combined check runs lint, typecheck, formatting verification, and tests. Production compilation is a separate build command. Current tests do not cover browser behavior or every schema constraint; see [TECH_DEBT](TECH_DEBT.md).
