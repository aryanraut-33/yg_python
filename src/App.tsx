import { useEffect } from 'react';
import { usePath } from './router';
import { Landing } from './landing/Landing';
import { liveProjects } from './content/projects';
import { Sandbox } from './sandbox/Sandbox';
import { Report } from './report/Report';
import { Playground } from './playground/Playground';
import { Onboarding } from './onboarding/Onboarding';
import { Catalogue } from './catalogue/Catalogue';
import { Family } from './account/FamilyPage';
import { ChildHome } from './account/ChildHome';
import { ProgressPage } from './account/ProgressPage';
import { LearnLessons } from './learn/LearnLessons';
import { Privacy } from './account/Privacy';
import { StudioPage } from './sharing/StudioPage';
import { PixelField } from './ui/fx';

const TITLES: Record<string, string> = {
  '/': 'Tinkora · Real Python for kids',
  '/family': 'Tinkora · Family',
  '/home': 'Tinkora · My projects',
  '/progress': 'Tinkora · Progress',
  '/learn': 'Tinkora · Learn lessons',
  '/privacy': 'Tinkora · Privacy',
  '/projects': 'Tinkora · All projects',
  '/report': 'Tinkora · Session report',
  '/playground': 'Tinkora · Playground',
  '/start': 'Tinkora · Meet Nix & Riff',
};

export function App() {
  const path = usePath();
  const play = path.match(/^\/play\/([a-z0-9-]+)\/?$/);
  const studio = path.match(/^\/s\/([a-zA-Z0-9_-]+)\/?$/);

  useEffect(() => {
    const project = play ? liveProjects().find((p) => p.manifest.id === play[1]) : null;
    document.title = play
      ? `Tinkora · ${project?.manifest.title ?? 'Project'}`
      : studio
      ? 'Tinkora · Family Studio'
      : (TITLES[path] ?? TITLES['/']);
  }, [path, play, studio]);

  let page;
  if (play) page = <Sandbox projectId={play[1]} />;
  else if (studio) page = <StudioPage token={studio[1]} />;
  else if (path === '/report') page = <Report />;
  else if (path === '/playground') page = <Playground />;
  else if (path === '/start') page = <Onboarding />;
  else if (path === '/projects') page = <Catalogue />;
  else if (path === '/family') page = <Family />;
  else if (path === '/home') page = <ChildHome />;
  else if (path === '/progress') page = <ProgressPage />;
  else if (path === '/learn') page = <LearnLessons />;
  else if (path === '/privacy') page = <Privacy />;
  else page = <Landing />;

  // The LED pixel field stays out of the coding workspace, where it would distract.
  const field = !play && path !== '/playground' && !studio;

  return (
    <div className="shell">
      {field && <PixelField />}
      <div className="bezel" aria-hidden="true" />
      {page}
    </div>
  );
}
