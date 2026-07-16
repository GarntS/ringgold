## ADDED Requirements

### Requirement: Solve exact-count nonadjacent layouts
The system SHALL use the bundled Z3 WebAssembly solver to find layouts for valid configurations. Every returned layout SHALL have the requested dimensions, use exactly the requested count of every type, and contain no orthogonally adjacent cells of the same type. Diagonal contact SHALL be allowed.

#### Scenario: Find a valid layout
- **WHEN** the user requests a solution for a satisfiable valid configuration
- **THEN** every returned layout uses all requested tile counts and has no equal-type horizontal or vertical neighbors

#### Scenario: Diagonal equal tiles
- **WHEN** two equal-type tiles touch only diagonally in a returned layout
- **THEN** the layout remains valid

### Requirement: Use an extensible adjacency model
The solver request SHALL represent adjacency through a symmetric type compatibility matrix. For the initial release, it SHALL forbid each type from touching itself and allow every distinct pair of types to touch.

#### Scenario: Initial compatibility configuration
- **WHEN** the solver receives a v1 configuration with types A and B
- **THEN** A-next-to-A and B-next-to-B are forbidden while A-next-to-B is allowed

### Requirement: Present several distinct solutions
The system SHALL request and present up to eight distinct valid layouts for a satisfiable configuration when that many can be found. Two presented layouts SHALL differ in at least one grid cell.

#### Scenario: Multiple layouts exist
- **WHEN** the solver finds more than one valid layout before the result limit
- **THEN** the user can view each distinct returned layout

#### Scenario: Fewer layouts exist than the limit
- **WHEN** the solver proves no further distinct layout exists before eight layouts are found
- **THEN** the system presents every layout found without treating the result limit as an error

### Requirement: Report impossible layouts accurately
The system SHALL display the message “Layout impossible with these counts and nonadjacent-square rules.” when Z3 proves a valid submitted configuration unsatisfiable.

#### Scenario: Solver proves unsatisfiable
- **WHEN** Z3 returns unsatisfiable for a configuration that passed client validation
- **THEN** the system displays the layout-impossible message

### Requirement: Keep solving responsive and controllable
The system SHALL execute Z3 WebAssembly solving outside the UI thread and SHALL allow an in-progress search to be cancelled. A cancellation, timeout, or solver runtime failure SHALL not be presented as proof that a layout is impossible.

#### Scenario: Cancel search
- **WHEN** the user cancels an in-progress search
- **THEN** the system reports that the search stopped before a layout was found and preserves any prior displayed solution

#### Scenario: Solver runtime failure
- **WHEN** the Z3 worker cannot initialize or execute a query
- **THEN** the system displays a solver-error message distinct from the layout-impossible message
