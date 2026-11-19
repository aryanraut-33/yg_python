// The project file format (formatVersion 1).
// Each project is a folder in content/projects/<id>/ containing project.json
// plus the Python files it names. See content/README.md.

export const LEVELS = [1, 2, 3, 4] as const;
export type Level = (typeof LEVELS)[number];

export const CATEGORIES = [
  'art',
  'games',
  'space',
  'robots',
  'camera',
  'ai',
  'data',
  'words',
] as const;
export type Category = (typeof CATEGORIES)[number];

/** Independence ladder: how much help the project gives. */
export const SUPPORT_LEVELS = ['follow', 'fill', 'fix', 'extend', 'create'] as const;
export type SupportLevel = (typeof SUPPORT_LEVELS)[number];

/** Platform pieces a project depends on. */
export const NEEDS = ['stage', 'turtle', 'robot-sim', 'camera', 'hand-tracking', 'sound', 'dataset', 'scikit-learn'] as const;
export type Need = (typeof NEEDS)[number];

export const STEP_TYPES = ['predict', 'build', 'fill', 'parsons', 'fix', 'make-it-yours', 'recall'] as const;
export type StepType = (typeof STEP_TYPES)[number];

export const CHECK_KINDS = ['runs', 'output-contains', 'output-matches', 'python'] as const;
export type CheckKind = (typeof CHECK_KINDS)[number];

/** A behaviour check run after the child's code. Checks behaviour, never exact wording. */
export interface Check {
  kind: CheckKind;
  /** Text to find (output-contains) or a regular expression (output-matches). */
  value?: string;
  /** For kind "python": a .py file in the project folder that inspects the child's program. */
  file?: string;
  /** What success looks like, in kid language. Shown when the check passes or fails. */
  description: string;
}

export interface Step {
  id: string;
  type: StepType;
  /** Instruction shown to the child (short Markdown). */
  instruction: string;
  /** For predict/fill/fix/parsons: a .py file with the code this step starts from. */
  code?: string;
  check?: Check;
  /** The 5-level hint ladder: where to look, concept reminder, worked example, solution with blanks, full solution. */
  hints: [string, string, string, string, string];
}

export interface Milestone {
  id: string;
  title: string;
  /** One sentence the child sees before starting: what they'll have made. */
  goal: string;
  /** Concept ids this milestone teaches or practises. */
  concepts: string[];
  steps: Step[];
}

export interface ProjectManifest {
  formatVersion: 1;
  id: string;
  title: string;
  /** One-line, kid-facing pitch. */
  pitch: string;
  level: Level;
  category: Category;
  support: SupportLevel;
  /** Expected sittings of 30-40 minutes. */
  sessions: number;
  concepts: string[];
  needs: Need[];
  phoneFriendly: boolean;
  /** Draft projects are hidden from children. */
  draft?: boolean;
  files: {
    starter: string;
    solution: string;
  };
  milestones: Milestone[];
}

export interface LoadedProject {
  manifest: ProjectManifest;
  /** Every .py file in the project folder, keyed by file name. */
  files: Record<string, string>;
}
