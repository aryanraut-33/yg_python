import {
  CATEGORIES,
  CHECK_KINDS,
  LEVELS,
  NEEDS,
  STEP_TYPES,
  SUPPORT_LEVELS,
  type ProjectManifest,
} from './types';

const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Checks a project manifest and the files it references.
 * Returns a list of problems; an empty list means the project is valid.
 */
export function validateProject(raw: unknown, files: Record<string, string>, folder: string): string[] {
  const errors: string[] = [];
  const err = (path: string, msg: string) => errors.push(`${folder}: ${path} ${msg}`);
  const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
  const str = (v: unknown, path: string) => {
    if (typeof v !== 'string' || v.trim() === '') err(path, 'must be a non-empty string');
  };
  const oneOf = (v: unknown, options: readonly unknown[], path: string) => {
    if (!options.includes(v)) err(path, `must be one of ${options.map((o) => JSON.stringify(o)).join(', ')}`);
  };
  const fileRef = (v: unknown, path: string) => {
    str(v, path);
    if (typeof v === 'string' && !(v in files)) err(path, `points to "${v}", which is not in the project folder`);
  };

  if (!isObj(raw)) {
    err('project.json', 'must be a JSON object');
    return errors;
  }
  const p = raw as Partial<ProjectManifest> & Record<string, unknown>;

  if (p.formatVersion !== 1) err('formatVersion', 'must be 1');
  str(p.id, 'id');
  if (typeof p.id === 'string' && !ID.test(p.id)) err('id', 'must be kebab-case, e.g. "name-light-show"');
  if (typeof p.id === 'string' && p.id !== folder) err('id', `must match its folder name "${folder}"`);
  str(p.title, 'title');
  str(p.pitch, 'pitch');
  oneOf(p.level, LEVELS, 'level');
  oneOf(p.category, CATEGORIES, 'category');
  oneOf(p.support, SUPPORT_LEVELS, 'support');
  if (typeof p.sessions !== 'number' || p.sessions < 1) err('sessions', 'must be a number of 1 or more');
  if (!Array.isArray(p.concepts) || p.concepts.length === 0) err('concepts', 'must list at least one concept');
  if (!Array.isArray(p.needs)) err('needs', 'must be a list');
  else p.needs.forEach((n, i) => oneOf(n, NEEDS, `needs[${i}]`));
  if (typeof p.phoneFriendly !== 'boolean') err('phoneFriendly', 'must be true or false');

  if (!isObj(p.files)) err('files', 'must name the starter and solution files');
  else {
    fileRef(p.files.starter, 'files.starter');
    fileRef(p.files.solution, 'files.solution');
  }

  if (!Array.isArray(p.milestones) || p.milestones.length === 0) {
    err('milestones', 'must have at least one milestone');
    return errors;
  }
  if (!p.draft && (p.milestones.length < 3 || p.milestones.length > 6)) {
    err('milestones', `must have 3 to 6 milestones (has ${p.milestones.length}); mark the project "draft": true while writing it`);
  }

  const seen = new Set<string>();
  p.milestones.forEach((m, mi) => {
    const mp = `milestones[${mi}]`;
    if (!isObj(m)) return err(mp, 'must be an object');
    str(m.id, `${mp}.id`);
    if (typeof m.id === 'string') {
      if (seen.has(m.id)) err(`${mp}.id`, `"${m.id}" is used twice`);
      seen.add(m.id);
    }
    str(m.title, `${mp}.title`);
    str(m.goal, `${mp}.goal`);
    if (!Array.isArray(m.concepts)) err(`${mp}.concepts`, 'must be a list');
    if (!Array.isArray(m.steps) || m.steps.length === 0) return err(`${mp}.steps`, 'must have at least one step');
    m.steps.forEach((s: unknown, si: number) => {
      const sp = `${mp}.steps[${si}]`;
      if (!isObj(s)) return err(sp, 'must be an object');
      str(s.id, `${sp}.id`);
      if (typeof s.id === 'string') {
        if (seen.has(s.id)) err(`${sp}.id`, `"${s.id}" is used twice`);
        seen.add(s.id);
      }
      oneOf(s.type, STEP_TYPES, `${sp}.type`);
      str(s.instruction, `${sp}.instruction`);
      if (s.code !== undefined) fileRef(s.code, `${sp}.code`);
      if (!Array.isArray(s.hints) || s.hints.length !== 5) err(`${sp}.hints`, 'must have exactly 5 hints (the hint ladder)');
      else s.hints.forEach((h: unknown, hi: number) => str(h, `${sp}.hints[${hi}]`));
      if (s.check !== undefined) {
        if (!isObj(s.check)) return err(`${sp}.check`, 'must be an object');
        oneOf(s.check.kind, CHECK_KINDS, `${sp}.check.kind`);
        str(s.check.description, `${sp}.check.description`);
        if (s.check.kind === 'output-contains' || s.check.kind === 'output-matches') str(s.check.value, `${sp}.check.value`);
        if (s.check.kind === 'output-matches' && typeof s.check.value === 'string') {
          try {
            new RegExp(s.check.value);
          } catch {
            err(`${sp}.check.value`, 'is not a valid regular expression');
          }
        }
        if (s.check.kind === 'python') fileRef(s.check.file, `${sp}.check.file`);
      }
    });
  });

  return errors;
}
