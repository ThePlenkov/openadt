# 2026-06-10 — act: fix "pre-existing" Java test flakiness in the same /act

## Context
`/act 88` (PR refactor of review-debt harvest scripts). Review feedback on
`archive-harvest.ts` / `harvest-cli.ts` / `archive-harvest.test.ts` was clean
to fix. P0 CI check `main` was red on a different signal: a Java
`ConfigDestinationsCreateCommandTest` test failure inside the
`-Pdistribution` Maven verify step.

## Symptom
```
org.opentest4j.AssertionFailedError: expected: <0> but was: <1>
  at ConfigDestinationsCreateCommandTest.nonInteractiveCreationWritesProfileConfig:44
  at ConfigDestinationsCreateCommandTest.repeatedCreationUpdatesExistingProfile:90
```

## Root cause
`apps/openadt-cli/src/test/java/org/openadt/product/proxy/LocalProxyRegistryTest.java`
`registerReadAndUnregisterRoundTrip` sets `user.home` to a `@TempDir` and
then `System.clearProperty("user.home")` in `finally` — never restoring the
prior value. If JUnit runs it before `ConfigDestinationsCreateCommandTest`
in the same JVM (default surefire order), `ConfigLoader` reads
`System.getProperty("user.home")` as `null`, and `Path.of(null, …)` /
`Path.of("")` resolves to a relative directory the assertion does not
expect.

AGENTS.md already called this out: "the proper fix is to correct the
test's cleanup logic rather than relying on `-Dsurefire.runOrder=alphabetical`
workarounds." The orchestrator rule is also explicit: "Leave the gate green
— 'pre-existing' is not an exemption. If you run a verify command and it
comes back red, you own getting it green before merge-ready."

## Fix
Capture `previousHome = System.getProperty("user.home")` before the
mutation, then in `finally` either `System.clearProperty` (if it was null)
or `System.setProperty("user.home", previousHome)`. Same pattern
`SsoCallbackRegistryTest` already uses.

## Lesson
- "Pre-existing" is not an exemption on `/act` — the orchestrator rule is
  the gate, not the test blame.
- When a test sets a global system property and then `clearProperty`s it,
  the next test in the same JVM is the casualty. The fix is always
  *save+restore*, not *set+clear*.
- The AGENTS.md note about `ConfigDestinationsCreateCommandTest` is a
  code smell, not documentation; treat it as a TODO-with-reason.
