## ADDED Requirements

### Requirement: Installable offline application
The system SHALL provide a valid web app manifest, application icons, and service-worker-backed assets so it can be installed as a PWA and launched without a network connection.

#### Scenario: Install application
- **WHEN** a supported browser offers installation for the application
- **THEN** the user can install and launch it as a standalone web app

#### Scenario: Launch offline
- **WHEN** the application has been installed or loaded successfully and the device is offline
- **THEN** the user can launch the application and use its configuration and solver features without a network request

### Requirement: Bundle solver assets for offline use
The system SHALL package the Z3 WebAssembly binary, its required JavaScript glue, and solver worker assets with the application and precache them for offline execution.

#### Scenario: Solve after offline launch
- **WHEN** the device is offline after application assets have been cached
- **THEN** the user can request a layout and the Z3 WebAssembly solver runs locally

### Requirement: Avoid remote service dependencies
The system SHALL not require authentication, a server API, analytics endpoint, or remote solver service for normal configuration, persistence, or solving.

#### Scenario: Normal use without connectivity
- **WHEN** a user edits a configuration, saves local state, and finds a solution while offline
- **THEN** those actions complete without contacting a remote service
