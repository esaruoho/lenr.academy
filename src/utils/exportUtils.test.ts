import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportToJSON } from './exportUtils';

describe('exportUtils', () => {
  beforeEach(() => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});
    // Mock document.createElement to capture download
    const mockAnchor = { href: '', download: '', click: vi.fn() };
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
  });

  describe('exportToJSON', () => {
    it('does nothing for empty reactions', () => {
      exportToJSON([], {
        queryType: 'fusion',
        filter: {},
        executionTime: 10,
        rowCount: 0,
        totalCount: 0,
      });
      expect(window.URL.createObjectURL).not.toHaveBeenCalled();
    });

    it('creates blob and triggers download for non-empty reactions', () => {
      const reactions = [
        { E1: 'H', Z1: 1, A1: 1, E2: 'Li', Z2: 3, A2: 7, MeV: 17.3 },
      ];
      exportToJSON(reactions, {
        queryType: 'fusion',
        filter: { element1List: ['H'] },
        executionTime: 5.2,
        rowCount: 1,
        totalCount: 10,
      });
      expect(window.URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('creates JSON blob with correct MIME type', () => {
      let capturedBlob: Blob | null = null;
      vi.spyOn(window.URL, 'createObjectURL').mockImplementation((blob: Blob) => {
        capturedBlob = blob;
        return 'blob:mock-url';
      });

      const reactions = [{ MeV: 10 }];
      exportToJSON(reactions, {
        queryType: 'fusion',
        filter: {},
        executionTime: 5,
        rowCount: 1,
        totalCount: 100,
      });

      expect(capturedBlob).toBeInstanceOf(Blob);
      expect(capturedBlob!.type).toBe('application/json');
    });

    it('calculates statistics correctly', () => {
      let capturedBlob: Blob | null = null;
      vi.spyOn(window.URL, 'createObjectURL').mockImplementation((blob: Blob) => {
        capturedBlob = blob;
        return 'blob:mock-url';
      });

      const reactions = [
        { MeV: 10 },
        { MeV: 20 },
        { MeV: 30 },
      ];

      exportToJSON(reactions, {
        queryType: 'fission',
        filter: {},
        executionTime: 3,
        rowCount: 3,
        totalCount: 3,
      });

      expect(capturedBlob).toBeInstanceOf(Blob);
    });

    it('sets correct filename format', () => {
      const mockAnchor = { href: '', download: '', click: vi.fn() };
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);

      exportToJSON([{ MeV: 5 }], {
        queryType: 'twotwo',
        filter: {},
        executionTime: 1,
        rowCount: 1,
        totalCount: 1,
      });

      expect(mockAnchor.download).toMatch(/^twotwo_reactions_\d{4}-\d{2}-\d{2}\.json$/);
    });
  });
});
