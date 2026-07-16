## 1. Application Foundation

- [x] 1.1 Initialize the vanilla TypeScript web application, development/build tooling, and static asset structure.
- [x] 1.2 Define versioned configuration, square-type, compatibility, solution, validation, and solver-worker message models.
- [x] 1.3 Implement local persistence and restoration for configuration and latest successful solution.

## 2. Pattern Configuration

- [x] 2.1 Implement grid width and height inputs with 1–20 bounds and derived tile-total display.
- [x] 2.2 Implement touch-friendly square-type controls with ordinal labels, editable names, color pickers, counts, and add/remove actions.
- [x] 2.3 Implement deterministic largest-remainder redistribution for resizing grids and adding/removing types.
- [x] 2.4 Implement configuration validation, including exact totals, required metadata, integer/range checks, and per-type independent-set bound messaging.
- [x] 2.5 Disable Find solution for invalid state and implement configuration fingerprints plus stale-solution notices.

## 3. Z3 Layout Solver

- [x] 3.1 Add and bundle the selected z3.wasm distribution, including its WebAssembly and JavaScript assets.
- [x] 3.2 Implement the parameterized SMT-LIB layout query with finite tile domains, exact counts, and compatibility-matrix constraints for horizontal and vertical neighbors.
- [x] 3.3 Implement a dedicated solver worker that initializes Z3, executes queries, parses models, supports cancellation/timeout, and reports typed outcomes.
- [x] 3.4 Implement distinct-model enumeration with blocking clauses and an eight-layout result cap.
- [x] 3.5 Add solver unit/integration tests for exact counts, orthogonal nonadjacency, allowed diagonal matches, compatibility defaults, unsatisfiable inputs, and distinct-result enumeration.

## 4. Solution Experience

- [x] 4.1 Implement Find solution, in-progress, cancellation, impossible-layout, timeout/cancelled, and solver-error states.
- [x] 4.2 Render the retained solution grid and accessible ordinal/name legend using configured colors.
- [x] 4.3 Implement browsing for multiple returned layouts while preserving the result configuration fingerprint.
- [x] 4.4 Add UI tests for redistribution, validation gating, stale-solution behavior, solution-state messaging, and touch-control accessibility.

## 5. Offline PWA Delivery

- [x] 5.1 Add manifest, icons, and iPad-oriented metadata for installation and standalone operation.
- [ ] 5.2 Implement a versioned service worker that precaches the application shell, worker, Z3 glue, and WASM binary.
- [x] 5.3 Verify build output has no required network dependency and add offline install/reload/solve test coverage.

## 6. Verification

- [x] 6.1 Run linting, type checks, unit tests, integration tests, and production build validation.
- [x] 6.2 Manually verify installation, offline launch, solver execution, and touch usability on an iPad-compatible browser viewport.
