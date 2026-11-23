// Mobile Touch Controls for Tinkora Stage.
// Simulates directional arrow keys and action buttons for smartphones and touchscreens.
import { useCallback, useState } from 'react';
import { buzz } from '../ui/fx';
import './touch.css';

interface Props {
  onTapCanvas?: (x: number, y: number) => void;
  className?: string;
  defaultVisible?: boolean;
}

export function TouchControls({ className = '', defaultVisible = true }: Props) {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const triggerPress = useCallback((key: string, code: string) => {
    setActiveKey(key);
    buzz(8);
    const event = new KeyboardEvent('keydown', {
      key,
      code,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);
    document.dispatchEvent(event);
  }, []);

  const triggerRelease = useCallback((key: string, code: string) => {
    setActiveKey(null);
    const event = new KeyboardEvent('keyup', {
      key,
      code,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);
    document.dispatchEvent(event);
  }, []);

  const createTouchHandlers = (key: string, code: string) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      triggerPress(key, code);
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      triggerRelease(key, code);
    },
    onPointerCancel: (e: React.PointerEvent) => {
      e.preventDefault();
      triggerRelease(key, code);
    },
  });

  if (!defaultVisible) return null;

  return (
    <div className={`touch-controller ${className}`} role="region" aria-label="Mobile Touch Controls">
      {/* Directional Pad */}
      <div className="touch-dpad">
        <button
          type="button"
          className={`touch-btn touch-up${activeKey === 'ArrowUp' ? ' is-active' : ''}`}
          aria-label="Up"
          {...createTouchHandlers('ArrowUp', 'ArrowUp')}
        >
          ▲
        </button>
        <div className="touch-dpad-middle">
          <button
            type="button"
            className={`touch-btn touch-left${activeKey === 'ArrowLeft' ? ' is-active' : ''}`}
            aria-label="Left"
            {...createTouchHandlers('ArrowLeft', 'ArrowLeft')}
          >
            ◀
          </button>
          <div className="touch-dpad-center" aria-hidden="true" />
          <button
            type="button"
            className={`touch-btn touch-right${activeKey === 'ArrowRight' ? ' is-active' : ''}`}
            aria-label="Right"
            {...createTouchHandlers('ArrowRight', 'ArrowRight')}
          >
            ▶
          </button>
        </div>
        <button
          type="button"
          className={`touch-btn touch-down${activeKey === 'ArrowDown' ? ' is-active' : ''}`}
          aria-label="Down"
          {...createTouchHandlers('ArrowDown', 'ArrowDown')}
        >
          ▼
        </button>
      </div>

      {/* Action Buttons */}
      <div className="touch-actions">
        <button
          type="button"
          className={`touch-btn touch-action${activeKey === ' ' ? ' is-active' : ''}`}
          aria-label="Action"
          {...createTouchHandlers(' ', 'Space')}
        >
          ACTION
        </button>
        <button
          type="button"
          className={`touch-btn touch-enter${activeKey === 'Enter' ? ' is-active' : ''}`}
          aria-label="Enter"
          {...createTouchHandlers('Enter', 'Enter')}
        >
          ENTER
        </button>
      </div>
    </div>
  );
}
