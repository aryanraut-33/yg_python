// Family Appreciation Badges (Social reward loop for Phase 3).
// Measures distinct people cheering the child's Python creations across their family circle.
import type { ChildAppreciation } from './publish';

export interface AppreciationBadge {
  id: string;
  title: string;
  target: number;
  icon: string;
  image: string;
  description: string;
  unlocked: boolean;
  current: number;
  percent: number;
}

export const BADGE_TIERS: ReadonlyArray<{
  id: string;
  title: string;
  target: number;
  icon: string;
  image: string;
  description: string;
}> = [
  {
    id: 'first-fans',
    title: 'First Fans',
    target: 3,
    icon: '🌱',
    image: '/badges/first_fans.png',
    description: '3 different family members cheered your Python creations!',
  },
  {
    id: 'crowd-pleaser',
    title: 'Crowd Pleaser',
    target: 10,
    icon: '🚀',
    image: '/badges/crowd_pleaser.png',
    description: '10 different family members played and loved your projects!',
  },
  {
    id: 'family-famous',
    title: 'Family Famous',
    target: 25,
    icon: '👑',
    image: '/badges/family_fav.png',
    description: '25 different family members cheered your code across the family circle!',
  },
];

export interface BadgeSummary {
  uniquePeopleCount: number;
  uniquePeopleNames: string[];
  badges: AppreciationBadge[];
  totalCheeredProjects: number;
  latestUnlockedBadge: AppreciationBadge | null;
}

export function calculateAppreciationBadges(appreciations: ChildAppreciation[]): BadgeSummary {
  // Count unique family members who have reacted
  const peopleSet = new Set<string>();
  const projectSet = new Set<string>();

  for (const a of appreciations) {
    if (a.recipientName && a.recipientName.trim()) {
      peopleSet.add(a.recipientName.trim().toLowerCase());
    }
    if (a.projectTitle) {
      projectSet.add(a.projectTitle);
    }
  }

  const uniquePeopleCount = peopleSet.size;
  const uniquePeopleNames = Array.from(peopleSet).map(
    (name) => name.charAt(0).toUpperCase() + name.slice(1),
  );

  let latestUnlocked: AppreciationBadge | null = null;

  const badges: AppreciationBadge[] = BADGE_TIERS.map((tier) => {
    const unlocked = uniquePeopleCount >= tier.target;
    const current = Math.min(uniquePeopleCount, tier.target);
    const percent = Math.min(100, Math.round((uniquePeopleCount / tier.target) * 100));

    const badge: AppreciationBadge = {
      id: tier.id,
      title: tier.title,
      target: tier.target,
      icon: tier.icon,
      image: tier.image,
      description: tier.description,
      unlocked,
      current,
      percent,
    };

    if (unlocked) {
      latestUnlocked = badge;
    }

    return badge;
  });

  return {
    uniquePeopleCount,
    uniquePeopleNames,
    badges,
    totalCheeredProjects: projectSet.size,
    latestUnlockedBadge: latestUnlocked,
  };
}
