export const CONFIG_VERSION = 1 as const;
export const MAX_GRID_DIMENSION = 20;
export const MAX_SOLUTIONS = 16;

export interface SquareType {
  id: string;
  name: string;
  color: string;
  count: number;
}

/** `allowed[a][b]` is true when types a and b may share an orthogonal edge. */
export type CompatibilityMatrix = Record<string, Record<string, boolean>>;

export interface QuiltConfiguration {
  version: typeof CONFIG_VERSION;
  width: number;
  height: number;
  squareTypes: SquareType[];
  compatibility: CompatibilityMatrix;
}

export interface QuiltLayout {
  cells: string[];
}

export interface QuiltSolution {
  version: typeof CONFIG_VERSION;
  /** Immutable input snapshot used to render retained layouts after edits. */
  configuration: QuiltConfiguration;
  configurationFingerprint: string;
  layouts: QuiltLayout[];
  createdAt: string;
}

export interface PersistedState {
  version: typeof CONFIG_VERSION;
  configuration: QuiltConfiguration;
  solution: QuiltSolution | null;
}

export type ValidationIssueCode =
  | 'width'
  | 'height'
  | 'type-name'
  | 'type-color'
  | 'type-count'
  | 'count-total'
  | 'independent-set-bound';

export interface ValidationIssue {
  code: ValidationIssueCode;
  message: string;
  typeId?: string;
}

export interface ConfigurationValidation {
  valid: boolean;
  issues: ValidationIssue[];
}

export interface SolveRequest {
  kind: 'solve';
  requestId: string;
  configuration: QuiltConfiguration;
  timeoutMs: number;
  maxSolutions: number;
}

export interface CancelRequest {
  kind: 'cancel';
  requestId: string;
}

export type SolverWorkerRequest = SolveRequest | CancelRequest;

export interface SolvedResponse {
  kind: 'solved';
  requestId: string;
  layouts: QuiltLayout[];
}

export interface UnsatisfiableResponse {
  kind: 'unsatisfiable';
  requestId: string;
}

export interface StoppedResponse {
  kind: 'cancelled' | 'timeout';
  requestId: string;
}

export interface SolverErrorResponse {
  kind: 'error';
  requestId: string;
  message: string;
}

export type SolverWorkerResponse =
  | SolvedResponse
  | UnsatisfiableResponse
  | StoppedResponse
  | SolverErrorResponse;
