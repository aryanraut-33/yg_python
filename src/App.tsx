import { useEffect } from 'react';
import { usePath } from './router';
import { Landing } from './landing/Landing';
import { Sandbox } from './sandbox/Sandbox';
import { Report } from './report/Report';
import { Playground } from './playground/Playground';
import { Onboarding } from './onboarding/Onboarding';
import { Catalogue } from './catalogue/Catalogue';
import { PixelField } from './ui/fx';

const TITLES: Record<string, string> = {
  '/': 'yg python · Real Python for kids',
  '/projects': 'yg python · All projects',
  '/report': 'yg python · Session report',
  '/playground': 'yg python · Playground',
  '/start': 'yg python · Meet Nix & Riff',
};

export function App() {
  const path = usePath();
  const play = path.match(/^\/play\/([a-z0-9-]+)\/?$/);

  useEffect(() => {
    document.title = play ? 'yg python · Name Light Show' : (TITLES[path] ?? TITLES['/']);
  }, [path, play]);

  let page;
  if (play) page = <Sandbox projectId={play[1]} />;
  else if (path === '/report') page = <Report />;
  else if (path === '/playground') page = <Playground />;
  else if (path === '/start') page = <Onboarding />;
  else if (path === '/projects') page = <Catalogue />;
  else page = <Landing />;

  // The LED pixel field stays out of the coding workspace, where it would distract.
  const field = !play && path !== '/playground';

  return (
    <div className="shell">
      {field && <PixelField />}
      <div className="bezel" aria-hidden="true" />
      {page}
    </div>
  );
}
