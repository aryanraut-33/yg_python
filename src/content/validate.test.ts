import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateProject } from './validate';

const root = join(__dirname, '..', '..', 'content', 'projects');
const folders = readdirSync(root).filter((f) => statSync(join(root, f)).isDirectory());

function load(folder: string) {
  const dir = join(root, folder);
  const files: Record<string, string> = {};
  for (const f of readdirSync(dir)) if (f.endsWith('.py')) files[f] = readFileSync(join(dir, f), 'utf8');
  return { manifest: JSON.parse(readFileSync(join(dir, 'project.json'), 'utf8')) as unknown, files };
}

describe('content/projects', () => {
  it('has at least one project', () => {
    expect(folders.length).toBeGreaterThan(0);
  });

  for (const folder of folders) {
    it(`${folder} is a valid project`, () => {
      const { manifest, files } = load(folder);
      expect(validateProject(manifest, files, folder)).toEqual([]);
    });
  }
});

describe('validateProject', () => {
  it('reports missing files, bad ids and short hint ladders', () => {
    const errors = validateProject(
      {
        formatVersion: 1,
        id: 'Bad Id',
        title: 'X',
        pitch: 'Y',
        level: 9,
        category: 'art',
        support: 'follow',
        sessions: 1,
        concepts: ['loops'],
        needs: ['stage'],
        phoneFriendly: true,
        files: { starter: 'missing.py', solution: 'solution.py' },
        milestones: [{ id: 'm', title: 'M', goal: 'G', concepts: [], steps: [{ id: 's', type: 'build', instruction: 'Do it', hints: ['a'] }] }],
      },
      { 'solution.py': '' },
      'bad-id',
    );
    expect(errors.join('\n')).toMatch(/id must be kebab-case/);
    expect(errors.join('\n')).toMatch(/level must be one of/);
    expect(errors.join('\n')).toMatch(/missing\.py/);
    expect(errors.join('\n')).toMatch(/exactly 5 hints/);
    expect(errors.join('\n')).toMatch(/3 to 6 milestones/);
  });
});
