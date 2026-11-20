export interface CatalogueProject {
  id: string;
  name: string;
  level: 1 | 2 | 3 | 4 | number;
  levelName: string;
  /** In the landing-page hero originally (⭐ in the catalogue doc). */
  hero: boolean;
  /** Shown on the home page's project board. */
  featured: boolean;
  category: string;
  sessions: number;
  phone: string;
  phoneFriendly: boolean;
  pitch: string;
  build: string;
  wow: string;
  /** Python ideas, with `code` markup. */
  python: string;
  steps: string[];
  hook: string;
  needs: string;
  /** Route if playable now, otherwise it's coming soon. */
  href: string | null;
}
