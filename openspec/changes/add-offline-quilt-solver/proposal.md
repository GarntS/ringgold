## Why

Quilt makers need a simple, portable way to arrange exact quantities of colored squares without allowing matching squares to share an edge. A fully offline, installable iPad-friendly app makes this calculation usable at the worktable without accounts or connectivity.

## What Changes

- Add an offline-first PWA for defining rectangular quilt grids up to 20×20 tiles and a variable set of square types.
- Provide touch-friendly controls for grid dimensions, named/color-coded square types, exact per-type counts, and automatic proportional count redistribution when grid dimensions or types change.
- Validate configuration totals and known impossible per-type counts before enabling layout searches; preserve and visibly mark stale displayed solutions after inputs change.
- Integrate a Z3 WebAssembly solver to find multiple layouts that use every requested tile and prevent orthogonally adjacent tiles of the same type.
- Persist the current configuration and most recent solution locally, and present clear invalid-input, impossible-layout, cancelled, and solver-error states.
- Structure adjacency checking around an internal compatibility matrix so future cross-type adjacency rules can be added without changing the solver model boundary.

## Capabilities

### New Capabilities
- `quilt-pattern-configuration`: Create, edit, validate, persist, and display rectangular quilt pattern inputs and prior solutions.
- `nonadjacent-layout-solving`: Find and present multiple exact-count rectangular layouts using the offline Z3 WebAssembly solver.
- `offline-pwa-delivery`: Install and run the quilt pattern application entirely offline.

### Modified Capabilities

None.

## Impact

- Adds a new vanilla TypeScript web application, touch-oriented interface, local persistence, PWA manifest/service worker, and bundled Z3 WebAssembly artifacts.
- Adds no server-side API, authentication, or network dependency.
- Introduces a Web Worker boundary for asynchronous solver execution and cancellation.
