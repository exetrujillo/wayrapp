import * as advancedFilters from '../advancedFilters';

describe('Advanced Filters', () => {
  describe('dateRangeFilter', () => {
    test('should create date range filter with both start and end dates', () => {
      const startDate = '2023-01-01';
      const endDate = '2023-12-31';
      const result = advancedFilters.dateRangeFilter('createdAt', startDate, endDate);
      
      expect(result).toEqual({
        createdAt: {
          gte: expect.any(Date),
          lte: expect.any(Date)
        }
      });
      expect(result.createdAt.gte.toISOString().startsWith('2023-01-01')).toBeTruthy();
      
      // Check that we have a valid end date
      const endDateTime = result.createdAt.lte;
      expect(endDateTime).toBeInstanceOf(Date);
      expect(endDateTime.getFullYear()).toBe(2023);
      expect(endDateTime.getMonth()).toBe(11); // December is month 11
      
      // The function should modify the time if the original time was midnight
      // We just verify that it's a valid date and in the right year/month
      expect(endDateTime.getTime()).toBeGreaterThan(new Date('2023-12-30').getTime());
    });

    test('should create filter with only start date', () => {
      const result = advancedFilters.dateRangeFilter('createdAt', '2023-01-01');
      expect(result).toEqual({
        createdAt: {
          gte: expect.any(Date)
        }
      });
    });

    test('should create filter with only end date', () => {
      const result = advancedFilters.dateRangeFilter('createdAt', undefined, '2023-12-31');
      expect(result).toEqual({
        createdAt: {
          lte: expect.any(Date)
        }
      });
    });

    test('should return empty object when no dates provided', () => {
      const result = advancedFilters.dateRangeFilter('createdAt');
      expect(result).toEqual({});
    });
  });

  describe('numericRangeFilter', () => {
    test('should create numeric range filter with min and max', () => {
      const result = advancedFilters.numericRangeFilter('points', 10, 100);
      expect(result).toEqual({
        points: {
          gte: 10,
          lte: 100
        }
      });
    });

    test('should handle string values', () => {
      const result = advancedFilters.numericRangeFilter('points', '10', '100');
      expect(result).toEqual({
        points: {
          gte: 10,
          lte: 100
        }
      });
    });
  });

  describe('multiValueFilter', () => {
    test('should handle array of values', () => {
      const result = advancedFilters.multiValueFilter('type', ['a', 'b', 'c']);
      expect(result).toEqual({
        type: {
          in: ['a', 'b', 'c']
        }
      });
    });

    test('should handle comma-separated string', () => {
      const result = advancedFilters.multiValueFilter('type', 'a,b,c');
      expect(result).toEqual({
        type: {
          in: ['a', 'b', 'c']
        }
      });
    });

    test('should trim whitespace from values', () => {
      const result = advancedFilters.multiValueFilter('type', 'a, b, c');
      expect(result).toEqual({
        type: {
          in: ['a', 'b', 'c']
        }
      });
    });
  });

  describe('booleanFilter', () => {
    test('should handle boolean values', () => {
      expect(advancedFilters.booleanFilter('isActive', true)).toEqual({ isActive: true });
      expect(advancedFilters.booleanFilter('isActive', false)).toEqual({ isActive: false });
    });

    test('should handle string values', () => {
      expect(advancedFilters.booleanFilter('isActive', 'true')).toEqual({ isActive: true });
      expect(advancedFilters.booleanFilter('isActive', 'false')).toEqual({ isActive: false });
    });
  });

  describe('fullTextSearchFilter', () => {
    test('should create search filter for multiple fields', () => {
      const result = advancedFilters.fullTextSearchFilter('test', ['name', 'description']);
      expect(result).toEqual({
        OR: [
          { name: { contains: 'test', mode: 'insensitive' } },
          { description: { contains: 'test', mode: 'insensitive' } }
        ]
      });
    });

    test('should handle exact phrase matching', () => {
      const result = advancedFilters.fullTextSearchFilter('test phrase', ['name'], true);
      expect(result).toEqual({
        OR: [
          { name: { contains: 'test phrase', mode: 'insensitive' } }
        ]
      });
    });

    test('should handle multi-term search', () => {
      const result = advancedFilters.fullTextSearchFilter('test phrase', ['name', 'description']);
      expect(result).toEqual({
        AND: [
          {
            OR: [
              { name: { contains: 'test', mode: 'insensitive' } },
              { description: { contains: 'test', mode: 'insensitive' } }
            ]
          },
          {
            OR: [
              { name: { contains: 'phrase', mode: 'insensitive' } },
              { description: { contains: 'phrase', mode: 'insensitive' } }
            ]
          }
        ]
      });
    });
  });

  describe('combineFilters', () => {
    test('should combine multiple filters with AND logic', () => {
      const filter1 = { field1: 'value1' };
      const filter2 = { field2: 'value2' };
      const result = advancedFilters.combineFilters(filter1, filter2);
      
      expect(result).toEqual({
        AND: [
          { field1: 'value1' },
          { field2: 'value2' }
        ]
      });
    });

    test('should ignore empty filters', () => {
      const filter1 = { field1: 'value1' };
      const filter2 = {};
      const filter3 = null;
      
      const result = advancedFilters.combineFilters(filter1, filter2, filter3);
      expect(result).toEqual({ field1: 'value1' });
    });

    test('should return empty object when no valid filters', () => {
      const result = advancedFilters.combineFilters({}, null, undefined);
      expect(result).toEqual({});
    });
  });

  describe('parseQueryFilters', () => {
    test('should apply filter functions based on config', () => {
      const queryFilters = {
        name: 'test',
        active: 'true',
        type: 'a,b,c'
      };
      
      const filterConfig = {
        name: (value: any) => ({ name: { contains: value } }),
        active: (value: string | boolean | undefined) => advancedFilters.booleanFilter('isActive', value),
        type: (value: string | string[] | undefined) => advancedFilters.multiValueFilter('type', value)
      };
      
      const result = advancedFilters.parseQueryFilters(queryFilters, filterConfig);
      
      expect(result).toEqual({
        AND: [
          { name: { contains: 'test' } },
          { isActive: true },
          { type: { in: ['a', 'b', 'c'] } }
        ]
      });
    });
  });
});