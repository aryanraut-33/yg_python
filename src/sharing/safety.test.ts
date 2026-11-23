import { describe, expect, it } from 'vitest';
import { scanChildText } from './safety';

describe('scanChildText', () => {
  it('allows normal kid titles and phrases', () => {
    expect(scanChildText('My Rocket Launch').safe).toBe(true);
    expect(scanChildText('Aarav light show for Dadi').safe).toBe(true);
    expect(scanChildText('Driving across Mars to find water!').safe).toBe(true);
  });

  it('detects Indian phone numbers', () => {
    expect(scanChildText('Call me at 9876543210').safe).toBe(false);
    expect(scanChildText('+91 98765 43210').safe).toBe(false);
  });

  it('detects email addresses', () => {
    expect(scanChildText('Email me at child@gmail.com').safe).toBe(false);
  });

  it('detects school names', () => {
    expect(scanChildText('Made at Delhi Public School').safe).toBe(false);
    expect(scanChildText('Kendriya Vidyalaya project').safe).toBe(false);
  });

  it('detects PIN codes with labels', () => {
    expect(scanChildText('Send it to pincode 560001').safe).toBe(false);
  });
});
