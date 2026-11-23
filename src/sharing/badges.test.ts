import { describe, expect, it } from 'vitest';
import { calculateAppreciationBadges } from './badges';
import type { ChildAppreciation } from './publish';

describe('calculateAppreciationBadges', () => {
  it('returns locked badges when there are 0 appreciations', () => {
    const summary = calculateAppreciationBadges([]);
    expect(summary.uniquePeopleCount).toBe(0);
    expect(summary.badges.every((b) => !b.unlocked)).toBe(true);
    expect(summary.latestUnlockedBadge).toBeNull();
  });

  it('deduplicates multiple cheers from the same recipient', () => {
    const data: ChildAppreciation[] = [
      { id: 1, recipientName: 'Papa', projectTitle: 'Story Machine', preset: 'love', createdAt: '' },
      { id: 2, recipientName: 'Papa', projectTitle: 'Rocket Launch', preset: 'rocket', createdAt: '' },
      { id: 3, recipientName: 'papa', projectTitle: 'Story Machine', preset: 'applause', createdAt: '' },
    ];
    const summary = calculateAppreciationBadges(data);
    expect(summary.uniquePeopleCount).toBe(1);
    expect(summary.badges[0].unlocked).toBe(false);
    expect(summary.badges[0].current).toBe(1);
    expect(summary.badges[0].percent).toBe(33);
  });

  it('unlocks First Fans badge when 3 distinct people cheer', () => {
    const data: ChildAppreciation[] = [
      { id: 1, recipientName: 'Papa', projectTitle: 'Story Machine', preset: 'love', createdAt: '' },
      { id: 2, recipientName: 'Mummy', projectTitle: 'Story Machine', preset: 'applause', createdAt: '' },
      { id: 3, recipientName: 'Santosh Mama', projectTitle: 'Rocket Launch', preset: 'rocket', createdAt: '' },
    ];
    const summary = calculateAppreciationBadges(data);
    expect(summary.uniquePeopleCount).toBe(3);
    expect(summary.badges[0].unlocked).toBe(true);
    expect(summary.badges[0].percent).toBe(100);
    expect(summary.badges[1].unlocked).toBe(false); // Crowd Pleaser (10)
    expect(summary.latestUnlockedBadge?.id).toBe('first-fans');
  });

  it('unlocks Crowd Pleaser at 10 people and Family Famous at 25', () => {
    const data: ChildAppreciation[] = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      recipientName: `Relative ${i}`,
      projectTitle: 'Story Machine',
      preset: 'love',
      createdAt: '',
    }));
    const summary = calculateAppreciationBadges(data);
    expect(summary.uniquePeopleCount).toBe(12);
    expect(summary.badges[0].unlocked).toBe(true);
    expect(summary.badges[1].unlocked).toBe(true);
    expect(summary.badges[2].unlocked).toBe(false); // Family Famous (25)
    expect(summary.latestUnlockedBadge?.id).toBe('crowd-pleaser');
  });
});
