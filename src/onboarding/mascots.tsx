// Nix (fox) and Riff (tiger): pose library from assets/mascot, served as WebP from /mascots.
export type Who = 'nix' | 'riff';
export type Pose =
  | 'welcome'
  | 'teaching'
  | 'celebrating'
  | 'thinking'
  | 'coding'
  | 'encouraging'
  | 'surprised'
  | 'error'
  | 'confused'
  | 'sleeping'
  | 'reading'
  | 'level-up'
  | 'idle'
  | 'pointing'
  | 'mobile';

const POSES: Record<Who, Pose[]> = {
  nix: ['welcome', 'teaching', 'celebrating', 'thinking', 'coding', 'encouraging', 'surprised', 'error', 'confused', 'sleeping', 'reading', 'level-up', 'idle', 'mobile'],
  riff: ['welcome', 'teaching', 'celebrating', 'thinking', 'coding', 'encouraging', 'error', 'confused', 'sleeping', 'reading', 'level-up', 'pointing'],
};

// Poses one mascot doesn't have fall back to the closest one.
const FALLBACK: Partial<Record<Pose, Pose>> = { surprised: 'celebrating', idle: 'welcome', pointing: 'teaching', mobile: 'coding' };

export const NAMES: Record<Who, string> = { nix: 'Nix', riff: 'Riff' };

export function poseUrl(who: Who, pose: Pose): string {
  const p = POSES[who].includes(pose) ? pose : (FALLBACK[pose] ?? 'welcome');
  return `/mascots/${who}/${p}.webp`;
}

/** Warm the browser cache so pose changes never flicker. */
export function preloadMascots() {
  for (const who of ['nix', 'riff'] as Who[]) {
    for (const pose of POSES[who]) {
      const img = new Image();
      img.src = poseUrl(who, pose);
    }
  }
}

export function MascotImg({ who, pose, className }: { who: Who; pose: Pose; className?: string }) {
  return <img className={`mascot-img mascot-${who} ${className ?? ''}`} src={poseUrl(who, pose)} alt="" draggable={false} />;
}
