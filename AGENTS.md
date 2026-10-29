# Cadence agent guidance

Cadence is a personal nutrition / meal-prep / fitness application. The implemented surface is currently an application shell, Foods CRUD, and database infrastructure. Work only within implemented functionality and the scope explicitly requested by the task. Code is the ultimate source of truth; documentation does not replace inspection.

## Workflow

1. Read this file.
2. Read relevant portions of [DESIGN](docs/DESIGN.md).
3. Check [TECH_DEBT](docs/TECH_DEBT.md) for relevant constraints.
4. Inspect the actual code related to the task.
5. Make the smallest coherent change that satisfies the request.
6. Add or update tests where behavior warrants it.
7. Update DESIGN or TECH_DEBT in the same change if implementation changes their facts. Remove resolved debt; do not document plans or session history. Keep README setup/use instructions accurate where affected.
8. Run required verification.
9. Report changes, checks actually run, and remaining relevant limitations. Explicitly explain any required check that could not run; never claim an unrun or unsuccessful check passed.

## Development principles

- Prefer simple, explicit code. Do not build speculative abstractions or infrastructure for hypothetical requirements.
- Inspect and follow existing naming, formatting, testing, and architectural patterns unless there is a concrete reason to change them. Extend existing domain concepts rather than creating parallel abstractions.
- Keep business logic separate from presentation where useful. Keep database access server-side through the server-only client; never import SQLite into Client Components.
- Persisted units, nutrition conventions, null semantics, and established calculation rules are domain contracts. Do not silently change them; inspect DESIGN and the schema before touching them.
- Avoid unrelated refactors. Add dependencies only when they provide clear value for the requested task.
- Do not commit secrets, runtime databases, SQLite sidecars, or build output.

## Commands

Run from the repository root using the Node/pnpm versions specified in `.node-version` and `package.json`. `package.json` is authoritative for scripts.

| Command                             | Purpose                                    |
| ----------------------------------- | ------------------------------------------ |
| `pnpm dev`                          | Local development server                   |
| `pnpm build` / `pnpm start`         | Production build / local production server |
| `pnpm lint`                         | ESLint, with zero warnings allowed         |
| `pnpm typecheck`                    | TypeScript check                           |
| `pnpm format` / `pnpm format:check` | Apply / check Prettier formatting          |
| `pnpm test`                         | Run Vitest                                 |
| `pnpm db:generate`                  | Generate SQL migrations and metadata       |
| `pnpm db:migrate`                   | Apply committed migrations                 |
| `pnpm check`                        | Lint, typecheck, format check, and tests   |

## Definition of done

- Run relevant focused tests while working, then `pnpm check` before considering implementation complete.
- Run `pnpm build` when a change could affect compilation or application runtime behavior. Verify UI changes in a browser when available; report verification limits.
- Schema changes require generated, committed SQL migrations and metadata. Verify application to an isolated fresh database, repeat application, and an existing-schema upgrade when applicable; update meaningful constraint/persistence tests.
- Apply migrations explicitly with `pnpm db:migrate`. Never mutate application schema during page rendering or replace this workflow with schema push.
- Tests must use isolated databases, never the developer's personal/local application database. Database files and sidecars remain untracked.
- Update DESIGN and TECH_DEBT atomically with code when their documented facts change, not merely because something is planned.
