// Loads every project from content/projects/ at build time.
import type { LoadedProject, ProjectManifest } from './types';
import { CATALOGUE } from '../catalogue/data';

const manifests = import.meta.glob<ProjectManifest>('/content/projects/*/project.json', {
  eager: true,
  import: 'default',
});
const pyFiles = import.meta.glob<string>('/content/projects/*/*.py', {
  eager: true,
  query: '?raw',
  import: 'default',
});

function folderOf(path: string): string {
  return path.split('/')[3];
}

export function loadProjects(): LoadedProject[] {
  return Object.entries(manifests).map(([path, manifest]) => {
    const folder = folderOf(path);
    const files: Record<string, string> = {};
    for (const [filePath, source] of Object.entries(pyFiles)) {
      if (folderOf(filePath) === folder) files[filePath.split('/').pop()!] = source;
    }
    return { manifest, files };
  });
}

let cache: LoadedProject[] | null = null;

/** Projects children can open, in catalogue order (easiest first). */
export function liveProjects(): LoadedProject[] {
  if (!cache) {
    const rank = (p: LoadedProject) => {
      const i = CATALOGUE.findIndex((c) => c.name === p.manifest.title);
      return i === -1 ? 999 : i;
    };
    cache = loadProjects()
      .filter((p) => !p.manifest.draft)
      .sort((a, b) => rank(a) - rank(b));
  }
  return cache;
}

/** The first project every child starts with. */
export const STARTER_ID = 'name-light-show';
