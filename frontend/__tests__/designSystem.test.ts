import { describe, it, expect } from 'vitest';
import {
  colors,
  gradients,
  typography,
  spacing,
  borderRadius,
  componentStyles,
  layout,
  zIndex,
  animation,
  navigationItems,
  getChangeColor,
  formatChange,
  getBadgeStyle,
} from '../lib/designSystem';

describe('Design System', () => {
  describe('colors', () => {
    it('should have background colors', () => {
      expect(colors.background.primary).toBe('#0a0a0f');
      expect(colors.background.secondary).toBe('#0f1117');
      expect(colors.background.tertiary).toBe('#161921');
    });

    it('should have accent colors', () => {
      expect(colors.accent.primary).toBe('#10b981');
      expect(colors.accent.secondary).toBe('#06b6d4');
    });

    it('should have status colors', () => {
      expect(colors.status.positive).toBe('#22c55e');
      expect(colors.status.negative).toBe('#ef4444');
      expect(colors.status.warning).toBe('#f59e0b');
    });
  });

  describe('gradients', () => {
    it('should have gradient definitions', () => {
      expect(gradients.primary).toBe('from-emerald-500 to-teal-600');
      expect(gradients.secondary).toBe('from-cyan-500 to-blue-600');
    });

    it('should have glow shadows', () => {
      expect(gradients.glow.emerald).toContain('shadow');
      expect(gradients.glow.cyan).toContain('shadow');
    });
  });

  describe('typography', () => {
    it('should have font families', () => {
      expect(typography.fontFamily.sans).toContain('Inter');
      expect(typography.fontFamily.mono).toContain('JetBrains Mono');
    });

    it('should have font sizes', () => {
      expect(typography.fontSize.xs).toBe('0.75rem');
      expect(typography.fontSize.base).toBe('1rem');
      expect(typography.fontSize['4xl']).toBe('2.25rem');
    });
  });

  describe('spacing', () => {
    it('should have spacing values', () => {
      expect(spacing.section).toBe('24px');
      expect(spacing.card).toBe('16px');
      expect(spacing.micro).toBe('4px');
    });
  });

  describe('borderRadius', () => {
    it('should have border radius values', () => {
      expect(borderRadius.sm).toBe('4px');
      expect(borderRadius.md).toBe('8px');
      expect(borderRadius.full).toBe('9999px');
    });
  });

  describe('componentStyles', () => {
    it('should have nav styles', () => {
      expect(componentStyles.nav.container).toContain('fixed');
      expect(componentStyles.nav.link.active).toContain('emerald');
    });

    it('should have card styles', () => {
      expect(componentStyles.card.base).toContain('rounded-xl');
      expect(componentStyles.card.padding).toBe('p-5');
    });

    it('should have button styles', () => {
      expect(componentStyles.button.primary).toContain('bg-gradient-to-r');
      expect(componentStyles.button.secondary).toContain('border');
    });
  });

  describe('layout', () => {
    it('should have layout dimensions', () => {
      expect(layout.maxWidth).toBe('1920px');
      expect(layout.navHeight).toBe('64px');
      expect(layout.sidebarWidth).toBe('280px');
    });
  });

  describe('zIndex', () => {
    it('should have z-index scale in correct order', () => {
      expect(zIndex.base).toBeLessThan(zIndex.dropdown);
      expect(zIndex.dropdown).toBeLessThan(zIndex.modal);
      expect(zIndex.modal).toBeLessThan(zIndex.tooltip);
    });
  });

  describe('animation', () => {
    it('should have duration values', () => {
      expect(animation.duration.fast).toBe('150ms');
      expect(animation.duration.normal).toBe('200ms');
      expect(animation.duration.slow).toBe('300ms');
    });

    it('should have easing functions', () => {
      expect(animation.easing.default).toContain('cubic-bezier');
    });
  });

  describe('navigationItems', () => {
    it('should have navigation items', () => {
      expect(navigationItems.length).toBeGreaterThan(0);
    });

    it('should have required properties for each item', () => {
      navigationItems.forEach((item) => {
        expect(item).toHaveProperty('href');
        expect(item).toHaveProperty('label');
        expect(item).toHaveProperty('labelKo');
        expect(item).toHaveProperty('icon');
      });
    });

    it('should include dashboard in navigation', () => {
      const dashboard = navigationItems.find((item) => item.href === '/dashboard');
      expect(dashboard).toBeDefined();
      expect(dashboard?.label).toBe('Dashboard');
    });
  });
});

describe('Helper Functions', () => {
  describe('getChangeColor', () => {
    it('should return positive color for positive values', () => {
      const result = getChangeColor(5);
      expect(result).toContain('emerald');
    });

    it('should return negative color for negative values', () => {
      const result = getChangeColor(-5);
      expect(result).toContain('red');
    });

    it('should return neutral color for zero', () => {
      const result = getChangeColor(0);
      expect(result).toContain('gray');
    });
  });

  describe('formatChange', () => {
    it('should format positive change with plus sign', () => {
      expect(formatChange(5.5)).toBe('+5.50%');
    });

    it('should format negative change without plus sign', () => {
      expect(formatChange(-3.25)).toBe('-3.25%');
    });

    it('should format zero as 0.00%', () => {
      expect(formatChange(0)).toBe('0.00%');
    });

    it('should hide sign when showSign is false', () => {
      expect(formatChange(5.5, false)).toBe('5.50%');
      expect(formatChange(-3.25, false)).toBe('-3.25%');
    });
  });

  describe('getBadgeStyle', () => {
    it('should return success badge style', () => {
      const result = getBadgeStyle('success');
      expect(result).toContain('emerald');
    });

    it('should return danger badge style', () => {
      const result = getBadgeStyle('danger');
      expect(result).toContain('red');
    });

    it('should return warning badge style', () => {
      const result = getBadgeStyle('warning');
      expect(result).toContain('amber');
    });

    it('should return info badge style', () => {
      const result = getBadgeStyle('info');
      expect(result).toContain('blue');
    });

    it('should return neutral badge style', () => {
      const result = getBadgeStyle('neutral');
      expect(result).toContain('gray');
    });
  });
});
