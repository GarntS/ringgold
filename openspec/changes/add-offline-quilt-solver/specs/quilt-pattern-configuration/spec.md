## ADDED Requirements

### Requirement: Configure bounded rectangular grids
The system SHALL allow the user to set integer grid width and height in tiles, each from 1 through 20 inclusive, and SHALL derive the required tile total as width × height.

#### Scenario: Valid grid dimensions
- **WHEN** the user enters width 12 and height 10
- **THEN** the system sets the required total to 120 tiles

#### Scenario: Dimension exceeds limit
- **WHEN** the user enters a width or height greater than 20
- **THEN** the system marks the dimension invalid and disables layout search

### Requirement: Manage square types
The system SHALL display each square type with a stable ordinal label (A, B, C, and subsequent ordinal labels), an editable name, an editable color through a color picker, and an editable non-negative integer count. The system SHALL allow adding and removing types while retaining at least one type.

#### Scenario: Add square type
- **WHEN** the user selects the add-type control
- **THEN** the system adds a new square type with the next ordinal label, editable name and color, and redistributed counts

#### Scenario: Remove square type
- **WHEN** the user selects the remove control for a type while more than one type exists
- **THEN** the system removes that type and redistributes its tiles among the remaining types

#### Scenario: Attempt to remove final type
- **WHEN** only one square type remains
- **THEN** the system does not allow the final type to be removed

### Requirement: Redistribute integer counts exactly
The system SHALL proportionally redistribute counts whenever grid dimensions change, a type is added, or a type is removed. Redistribution SHALL produce non-negative integers totaling the new grid area; additions SHALL initially allocate the new type approximately one equal share of the grid and reduce existing types proportionally. Ties in fractional allocation SHALL be resolved deterministically.

#### Scenario: Resize grid
- **WHEN** the user changes the grid area
- **THEN** all type counts are proportionally rescaled as integers and sum exactly to the new area

#### Scenario: Add type to uneven counts
- **WHEN** the user adds a square type to a configuration whose area is not evenly divisible by the new type count
- **THEN** the system allocates integer counts using deterministic proportional rounding and preserves the exact total

### Requirement: Validate configuration before search
The system SHALL validate required type names, colors, non-negative integer counts, dimensions, and the equality of summed counts to grid area. The system SHALL mark a type count exceeding ceil(grid area / 2) as impossible under the v1 same-type nonadjacency rule. The Find solution control SHALL be disabled while any validation fails.

#### Scenario: Counts do not total grid area
- **WHEN** configured type counts do not equal the grid area
- **THEN** the system displays an invalid-count indication and disables Find solution

#### Scenario: Single type exceeds independent-set bound
- **WHEN** a square type count exceeds ceil(width × height / 2)
- **THEN** the system explains that the type has too many tiles to avoid edge adjacency and disables Find solution

### Requirement: Retain and identify stale solutions
The system SHALL retain and render the most recent successful solution after editable parameters change. It SHALL display a visible, compact indication whenever active parameters differ from the parameters that produced the rendered solution.

#### Scenario: Edit after a successful solution
- **WHEN** the user changes a type count after a solution is displayed
- **THEN** the previous grid remains visible and a stale-parameters indication is displayed

#### Scenario: Restore matching parameters
- **WHEN** active parameters again exactly match the displayed solution parameters
- **THEN** the stale-parameters indication is removed

### Requirement: Persist local working state
The system SHALL persist the active configuration and most recent successful solution locally on the device and restore them without requiring an account or network access.

#### Scenario: Reopen application
- **WHEN** the user reopens the application after saving configuration and a solution locally
- **THEN** the system restores the configuration and most recent solution

### Requirement: Provide touch-friendly pattern controls
The system SHALL provide controls and tap targets suitable for iPad touch interaction and SHALL identify types using ordinal labels and names in addition to color.

#### Scenario: Identify a type without color
- **WHEN** a solution grid and its legend are displayed
- **THEN** the user can identify every square type by its ordinal label and name without relying solely on color
