# Current technical debt

Keep only unresolved limitations in the implemented system. Remove entries when resolved; Git history supplies the archive.

## Partial identifier validation

- **Area:** Food persistence constraints.
- **Limitation:** IDs must be unique, non-null, and 36 characters long, but the database accepts non-UUID strings of that length. There is no application validation or ID-generation path; the test supplies `randomUUID()`.
- **Impact:** Direct writers can persist IDs inconsistent with the UUID convention described in the setup documentation.
- **Context / revisit:** The current boundary is a foundation schema with no application write workflow. Revisit when adding or changing writers or when UUID format becomes a relied-upon invariant.

## Narrow automated verification

- **Area:** Database and application tests.
- **Limitation:** One integration test exercises selected database invariants. Several bounds/text/ID constraints are not tested, and no automated tests exercise navigation, responsive layout, or keyboard behavior.
- **Impact:** Some schema or UI regressions can pass `pnpm check`; compilation does not establish interactive correctness.
- **Context / revisit:** The current application is a small informational shell. Revisit when changing affected constraints or shell behavior, or when manual verification misses regressions. Add targeted coverage for actual behavior rather than a speculative test framework.
