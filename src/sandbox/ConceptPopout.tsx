// "New idea!" pop-out: Nix explains a concept in plain words the first time a project uses it.
import { useEffect } from 'react';
import glossaryJson from '../../content/concepts.json';
import type { ConceptIntro } from '../content/types';
import { MascotImg } from '../onboarding/mascots';
import { RichText } from '../ui/RichText';

export const GLOSSARY = glossaryJson as Record<string, ConceptIntro>;

export function ConceptPopout({ id, onClose }: { id: string; onClose(): void }) {
  const c = GLOSSARY[id];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  if (!c) return null;
  return (
    <div className="pop-backdrop" onClick={onClose}>
      <div className="pop" role="dialog" aria-modal="true" aria-labelledby="pop-title" onClick={(e) => e.stopPropagation()}>
        <MascotImg who="nix" pose="teaching" className="pop-mascot" />
        <div className="pop-body">
          <p className="pop-eyebrow">New idea · Nix explains</p>
          <h2 id="pop-title" className="pop-title">
            {c.title}
          </h2>
          <div className="pop-lines">
            {c.lines.map((l, i) => (
              <p key={i} className="pop-line" style={{ animationDelay: `${0.15 + i * 0.35}s` }}>
                <RichText text={l} />
              </p>
            ))}
          </div>
          <div className="pop-example">
            <div>
              <p className="pop-label">Example</p>
              <pre className="pop-code">{c.code}</pre>
            </div>
            <div>
              <p className="pop-label">What it shows</p>
              <pre className="pop-output">{c.output}</pre>
            </div>
          </div>
          <button className="btn btn-primary" onClick={onClose} autoFocus>
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
