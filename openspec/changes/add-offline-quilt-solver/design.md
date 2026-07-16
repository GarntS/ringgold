## Context

The repository has no application implementation. This change establishes a standalone, vanilla TypeScript application for planning rectangular quilt layouts. It must be comfortable on an iPad, installable as a PWA, and usable without a network connection. A layout must use the requested integer count of every square type and must not place equal types on orthogonally adjacent cells. The grid is limited to 20×20.

The application must retain the last successful layout while users adjust inputs, clearly indicating when that layout no longer corresponds to the active configuration.

## Goals / Non-Goals

**Goals:**
- Provide an offline, touch-oriented configuration and layout experience.
- Produce up to eight distinct valid layouts with Z3 compiled to WebAssembly.
- Keep the UI responsive by executing solver work outside the UI thread.
- Make square-count redistribution deterministic, integer-safe, and total-preserving.
- Encapsulate adjacency as a compatibility matrix, initially configured to disallow only same-type orthogonal neighbors.

**Non-Goals:**
- Cross-type adjacency rules or a UI to configure them.
- Diagonal adjacency restrictions.
- Server synchronization, accounts, cloud storage, collaboration, printing, or export.
- Guaranteeing an optimal aesthetic layout; returned layouts need only satisfy constraints.
- Supporting dimensions greater than 20 in either direction.

## Decisions

### Vanilla TypeScript application with local state and persistence

Use a small vanilla TypeScript application with an explicit configuration model, a solution model, and DOM-rendered controls/grid. Persist the active configuration and most recent successful solution locally (IndexedDB, with a simple local-storage fallback only if needed). This meets the offline requirement without a framework runtime or server.

Alternatives considered:
- React: useful for larger component ecosystems, but not necessary for this isolated, new application.
- Server-backed application: conflicts with offline-first operation and adds no required capability.

### Stable configuration fingerprint for stale-solution state

A successful result records a canonical fingerprint of the dimensions, ordered type IDs/counts, and solver-relevant compatibility settings used to produce it. The result remains rendered after changes. A compact stale notice is visible whenever the active configuration fingerprint differs from the result fingerprint.

### Integer redistribution using largest remainder

When dimensions change, multiply existing counts by `newTotal / oldTotal`. When a type is added, target the new type at `newTotal / newTypeCount` and proportionally reduce existing types to the remaining total. In both cases, use floor values followed by allocation of remaining cells to largest fractional remainders, with a stable type-order tie break. The result is integral, non-negative, and totals exactly to the grid area.

Removing a type proportionally redistributes its count across remaining types using the same allocation method. The UI prevents removal of the final type.

### Parameterized compatibility matrix behind a simple v1 rule

The solver request carries a symmetric `allowed[typeA][typeB]` matrix. In v1, diagonal entries are false and all off-diagonal entries true, so only equal types are prevented from sharing an edge. Keeping this boundary supports future cross-type rules without changing the worker protocol or core constraint generation.

### Z3 WebAssembly in a dedicated worker, using SMT-LIB queries

Bundle a Z3 WASM distribution based on `z3.wasm` with the PWA. A dedicated Web Worker builds and executes a parameterized SMT-LIB2 query: one finite-domain integer per cell, exact cardinality constraints for each type, and compatibility constraints for horizontal and vertical neighbor pairs. The worker parses models into type IDs and returns them to the UI.

To enumerate distinct results, after each model add a blocking clause requiring at least one cell to differ, then solve again. Stop after eight results, cancellation, timeout, or unsatisfiability. Worker messages distinguish solved, unsatisfiable, cancelled/timed-out, and runtime-error outcomes. The UI remains responsive and ignores responses for superseded requests.

Alternatives considered:
- Run WASM on the main thread: risks freezing touch interaction.
- Write a bespoke backtracking solver: violates the requested Z3 approach and would require maintaining pruning logic.
- Use diagonal neighbor constraints: explicitly outside the selected v1 rule.

### Explain only deterministic impossibility checks

The UI validates dimensions, type metadata, non-negative integer counts, exact count total, and each count against `ceil(width × height / 2)`. The latter is an explainable necessary bound for a type forbidden from touching itself orthogonally. Z3 remains the authority for all other combinations: an `unsat` answer displays “Layout impossible with these counts and nonadjacent-square rules.” The app must not infer a misleading detailed reason from a generic unsat result.

### Offline PWA asset strategy

A web manifest, icons, and service worker make the app installable. The application shell, generated JavaScript/CSS, worker bundle, Z3 JavaScript glue, and WASM binary are precached during installation. Runtime behavior makes no network calls; cache versioning permits atomic upgrades when an online update is available.

## Risks / Trade-offs

- [Z3 WASM bundle size and browser compatibility] → Pin and test a supported `z3.wasm` build; include its binary and glue in the precache manifest.
- [Enumerating many models can be slow] → Limit results to eight, use a worker, expose cancellation, and distinguish timeout from impossibility.
- [Some valid totals remain unsatisfiable] → Use the solver as the final authority and give a clear generic impossible-layout message.
- [Integer rescaling may alter individual proportions slightly] → Use deterministic largest-remainder allocation and always preserve exact totals.
- [iOS may evict offline website data] → Keep state compact and let the UI recover gracefully when no saved state remains.
- [Color-only identification is inaccessible] → Render the ordinal letter and name alongside each configured color and in solution legends.

## Migration Plan

This is a new application with no existing users or deployed data. Deploy as static assets. A new service-worker cache version replaces old precached assets on activation; locally persisted configurations use a versioned schema and fall back to a default configuration if they cannot be read. Removing the service worker and static deployment rolls back the application.

## Open Questions

- Whether a future release should allow users to choose the number of returned layouts instead of using the initial cap of eight.
- Whether local import/export is needed for sharing saved quilts.
