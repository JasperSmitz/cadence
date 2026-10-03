# Current technical debt

Keep only unresolved limitations in the implemented system. Remove entries when resolved; Git history supplies the archive.

## Partial identifier validation

- **Area:** Food persistence constraints.
- **Limitation:** IDs must be unique, non-null, and 36 characters long, but the database accepts non-UUID strings of that length. Application writes now generate UUIDs and validate mutation IDs, but direct database writers bypass that protection.
- **Impact:** Direct writers can persist IDs inconsistent with the UUID convention described in the setup documentation.
- **Context / revisit:** Retained without a schema change because the application boundary validates IDs. Revisit if adding writers that bypass it or requiring database-level UUID guarantees.

## Narrow automated verification

- **Area:** Database and application tests.
- **Limitation:** Foundation and Foods tests cover parsing, validation, and CRUD persistence, but not every direct SQL constraint, and no automated tests exercise navigation, responsive layout, or keyboard behavior.
- **Impact:** Some schema or UI regressions can pass `pnpm check`; compilation does not establish interactive correctness.
- **Context / revisit:** The application uses a small shell and native-dialog Foods workflow. Revisit when changing affected constraints or shell behavior, or when manual verification misses regressions. Add targeted coverage for actual behavior rather than a speculative test framework.
