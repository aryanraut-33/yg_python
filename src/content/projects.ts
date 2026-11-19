// Loads every project from content/projects/ at build time.
import type { LoadedProject, ProjectManifest } from './types';

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
