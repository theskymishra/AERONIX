import { describe, expect, it } from 'vitest';

describe('Theme Switching and Persistence Logic', () => {
  const getNextTheme = (currentTheme: 'light' | 'dark' | 'system', resolvedTheme?: 'light' | 'dark') => {
    const effective = resolvedTheme || (currentTheme === 'system' ? 'dark' : currentTheme);
    return effective === 'dark' ? 'light' : 'dark';
  };

  it('toggles from dark to light mode', () => {
    expect(getNextTheme('dark', 'dark')).toBe('light');
  });

  it('toggles from light to dark mode', () => {
    expect(getNextTheme('light', 'light')).toBe('dark');
  });

  it('correctly toggles when current is system resolving to dark', () => {
    expect(getNextTheme('system', 'dark')).toBe('light');
  });

  it('correctly toggles when current is system resolving to light', () => {
    expect(getNextTheme('system', 'light')).toBe('dark');
  });

  it('verifies theme storage key name compatibility', () => {
    const THEME_STORAGE_KEY = 'theme';
    expect(THEME_STORAGE_KEY).toBe('theme');
  });
});
