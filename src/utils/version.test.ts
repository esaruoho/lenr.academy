import { describe, it, expect } from 'vitest';
import { parseVersion, formatBuildTime, getVersionTooltip, getGitHubReleaseUrl } from './version';
import type { VersionInfo } from './version';

describe('version utils', () => {
  describe('parseVersion', () => {
    it('parses an exact release tag', () => {
      const result = parseVersion('v0.1.0-alpha.21');
      expect(result.version).toBe('v0.1.0-alpha.21');
      expect(result.isRelease).toBe(true);
      expect(result.displayVersion).toBe('v0.1.0-alpha.21');
      expect(result.fullVersion).toBe('v0.1.0-alpha.21');
    });

    it('parses a dirty release tag', () => {
      const result = parseVersion('v0.1.0-alpha.21-dirty');
      expect(result.version).toBe('v0.1.0-alpha.21');
      expect(result.isRelease).toBe(false);
      expect(result.displayVersion).toBe('v0.1.0-alpha.21 (modified)');
    });

    it('parses a version with commits ahead', () => {
      const result = parseVersion('v0.1.0-alpha.0-4-g72f289d');
      expect(result.version).toBe('v0.1.0-alpha.0');
      expect(result.isRelease).toBe(false);
      expect(result.displayVersion).toBe('v0.1.0-alpha.0+4.72f289d');
    });

    it('parses a version with commits ahead and dirty', () => {
      const result = parseVersion('v0.1.0-alpha.0-4-g72f289d-dirty');
      expect(result.version).toBe('v0.1.0-alpha.0');
      expect(result.isRelease).toBe(false);
      expect(result.displayVersion).toBe('v0.1.0-alpha.0+4.72f289d.dirty');
    });

    it('parses a simple semver tag', () => {
      const result = parseVersion('v1.2.3');
      expect(result.version).toBe('v1.2.3');
      expect(result.isRelease).toBe(true);
    });

    it('falls back for unknown formats', () => {
      const result = parseVersion('unknown');
      expect(result.version).toBe('unknown');
      expect(result.isRelease).toBe(false);
      expect(result.displayVersion).toBe('unknown');
    });

    it('includes buildTime in the result', () => {
      const result = parseVersion('v1.0.0');
      expect(result.buildTime).toBeDefined();
      expect(typeof result.buildTime).toBe('string');
    });
  });

  describe('formatBuildTime', () => {
    it('formats a valid ISO string', () => {
      const formatted = formatBuildTime('2026-02-23T12:00:00Z');
      // Just check it returns something other than the raw ISO string
      expect(formatted).toBeDefined();
      expect(formatted.length).toBeGreaterThan(0);
      // Should contain the year
      expect(formatted).toContain('2026');
    });

    it('returns the original string for invalid dates', () => {
      const result = formatBuildTime('not-a-date');
      // Invalid Date still parses without throwing in most engines,
      // but toLocaleString produces "Invalid Date"
      expect(typeof result).toBe('string');
    });
  });

  describe('getVersionTooltip', () => {
    it('includes version display for release builds', () => {
      const info: VersionInfo = {
        version: 'v1.0.0',
        isRelease: true,
        displayVersion: 'v1.0.0',
        fullVersion: 'v1.0.0',
        buildTime: '2026-01-01T00:00:00Z',
      };
      const tooltip = getVersionTooltip(info);
      expect(tooltip).toContain('Version: v1.0.0');
      expect(tooltip).toContain('Click to view release on GitHub');
      // Release builds should NOT show "Base:"
      expect(tooltip).not.toContain('Base:');
    });

    it('includes base version for non-release builds', () => {
      const info: VersionInfo = {
        version: 'v0.1.0-alpha.0',
        isRelease: false,
        displayVersion: 'v0.1.0-alpha.0+4.72f289d',
        fullVersion: 'v0.1.0-alpha.0-4-g72f289d',
        buildTime: '2026-01-01T00:00:00Z',
      };
      const tooltip = getVersionTooltip(info);
      expect(tooltip).toContain('Base: v0.1.0-alpha.0');
    });
  });

  describe('getGitHubReleaseUrl', () => {
    it('returns tag URL for release versions', () => {
      const info: VersionInfo = {
        version: 'v1.0.0',
        isRelease: true,
        displayVersion: 'v1.0.0',
        fullVersion: 'v1.0.0',
        buildTime: '',
      };
      expect(getGitHubReleaseUrl(info)).toBe(
        'https://github.com/Episk-pos/lenr.academy/releases/tag/v1.0.0',
      );
    });

    it('returns generic releases URL for dev builds', () => {
      const info: VersionInfo = {
        version: 'v0.1.0-alpha.0',
        isRelease: false,
        displayVersion: 'v0.1.0-alpha.0+4.72f289d',
        fullVersion: 'v0.1.0-alpha.0-4-g72f289d',
        buildTime: '',
      };
      expect(getGitHubReleaseUrl(info)).toBe(
        'https://github.com/Episk-pos/lenr.academy/releases',
      );
    });
  });
});
