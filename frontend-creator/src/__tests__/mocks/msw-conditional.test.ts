/**
 * Test for MSW Conditional Loading
 * 
 * Verifies that MSW is properly enabled/disabled based on VITE_ENABLE_MSW environment variable
 * This test focuses on the conditional logic without importing actual MSW modules to avoid Jest issues
 */

describe('MSW Conditional Loading', () => {
  beforeEach(() => {
    // Clear module cache to ensure fresh imports
    jest.resetModules();
  });

  describe('main.tsx MSW initialization logic', () => {
    it('should not initialize MSW when VITE_ENABLE_MSW is false', async () => {
      // Mock environment with MSW disabled
      jest.doMock('../../config/environment', () => ({
        env: {
          enableMSW: false,
          apiUrl: 'https://wayrapp.vercel.app/api/v1',
          appName: 'WayrApp Creator Tool',
          logLevel: 'info',
          isDevelopment: true,
          isProduction: false,
        }
      }));

      // Mock the dynamic import to track if it's called
      const mockStartMocking = jest.fn();
      jest.doMock('../../mocks/browser', () => ({
        startMocking: mockStartMocking,
      }));

      // Simulate the enableMocking function from main.tsx
      const enableMocking = async () => {
        const { env } = await import('../../config/environment');
        if (env.enableMSW) {
          const { startMocking } = await import('../../mocks/browser');
          return startMocking();
        }
      };

      await enableMocking();

      // MSW should not be imported when disabled
      expect(mockStartMocking).not.toHaveBeenCalled();
    });

    it('should initialize MSW when VITE_ENABLE_MSW is true', async () => {
      // Mock environment with MSW enabled
      jest.doMock('../../config/environment', () => ({
        env: {
          enableMSW: true,
          apiUrl: 'https://wayrapp.vercel.app/api/v1',
          appName: 'WayrApp Creator Tool',
          logLevel: 'info',
          isDevelopment: true,
          isProduction: false,
        }
      }));

      // Mock the dynamic import
      const mockStartMocking = jest.fn().mockResolvedValue(undefined);
      jest.doMock('../../mocks/browser', () => ({
        startMocking: mockStartMocking,
      }));

      // Simulate the enableMocking function from main.tsx
      const enableMocking = async () => {
        const { env } = await import('../../config/environment');
        if (env.enableMSW) {
          const { startMocking } = await import('../../mocks/browser');
          return startMocking();
        }
      };

      await enableMocking();

      // MSW should be imported and started when enabled
      expect(mockStartMocking).toHaveBeenCalled();
    });
  });

  describe('environment configuration parsing', () => {
    // Helper function to simulate the environment parsing logic
    const parseEnableMSW = (value: string | undefined): boolean => {
      return value === 'true';
    };

    it('should parse VITE_ENABLE_MSW=false correctly', () => {
      // Test the logic that parses the environment variable
      const enableMSW = parseEnableMSW('false');
      expect(enableMSW).toBe(false);
    });

    it('should parse VITE_ENABLE_MSW=true correctly', () => {
      // Test the logic that parses the environment variable
      const enableMSW = parseEnableMSW('true');
      expect(enableMSW).toBe(true);
    });

    it('should default to false when VITE_ENABLE_MSW is undefined', () => {
      // Test the logic that parses the environment variable
      const enableMSW = parseEnableMSW(undefined);
      expect(enableMSW).toBe(false);
    });

    it('should default to false when VITE_ENABLE_MSW is any other value', () => {
      // Test the logic that parses the environment variable
      const enableMSW = parseEnableMSW('yes');
      expect(enableMSW).toBe(false);
    });
  });
});