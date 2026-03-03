import { describe, it, expect } from 'vitest';
import { EXAMPLE_QUERIES } from './exampleQueries';

describe('exampleQueries', () => {
  it('has a non-empty set of queries', () => {
    expect(EXAMPLE_QUERIES.length).toBeGreaterThan(0);
  });

  it('all entries have required fields', () => {
    EXAMPLE_QUERIES.forEach(query => {
      expect(query.name).toBeTruthy();
      expect(query.description).toBeTruthy();
      expect(['fusion', 'fission', 'twotwo']).toContain(query.queryType);
      expect(query.filter).toBeDefined();
    });
  });

  it('includes fusion examples', () => {
    const fusion = EXAMPLE_QUERIES.filter(q => q.queryType === 'fusion');
    expect(fusion.length).toBeGreaterThan(0);
  });

  it('includes fission examples', () => {
    const fission = EXAMPLE_QUERIES.filter(q => q.queryType === 'fission');
    expect(fission.length).toBeGreaterThan(0);
  });

  it('includes twotwo examples', () => {
    const twotwo = EXAMPLE_QUERIES.filter(q => q.queryType === 'twotwo');
    expect(twotwo.length).toBeGreaterThan(0);
  });

  it('includes H-Li fusion example', () => {
    const hli = EXAMPLE_QUERIES.find(q =>
      q.element1List?.includes('H') && q.element2List?.includes('Li')
    );
    expect(hli).toBeDefined();
    expect(hli!.queryType).toBe('fusion');
  });

  it('includes high-energy fusion example', () => {
    const highE = EXAMPLE_QUERIES.find(q => q.filter.minMeV && q.filter.minMeV >= 10);
    expect(highE).toBeDefined();
  });
});
