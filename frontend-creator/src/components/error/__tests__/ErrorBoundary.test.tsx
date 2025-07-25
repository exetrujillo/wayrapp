import { screen, fireEvent } from '@testing-library/react';
import { render } from '../../../__tests__/utils/test-utils';
import { ErrorBoundary } from '../ErrorBoundary';

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
        throw new Error('Test error');
    }
    return <div>No error</div>;
};

// Mock console.error to avoid noise in test output
const originalError = console.error;
beforeAll(() => {
    console.error = jest.fn();
});

afterAll(() => {
    console.error = originalError;
});

describe('ErrorBoundary', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render children when there is no error', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={false} />
            </ErrorBoundary>
        );

        expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should render error UI when there is an error', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText(/Component Error/i)).toBeInTheDocument();
        expect(screen.getByText(/Test error/i)).toBeInTheDocument();
    });

    it('should show retry button when error occurs', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        const retryButton = screen.getByRole('button', { name: /try again/i });
        expect(retryButton).toBeInTheDocument();
    });

    it('should reset error state when retry button is clicked', () => {
        const { rerender } = render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        // Error should be displayed
        expect(screen.getByText(/Component Error/i)).toBeInTheDocument();

        // Click retry button
        const retryButton = screen.getByRole('button', { name: /try again/i });
        fireEvent.click(retryButton);

        // Re-render with no error
        rerender(
            <ErrorBoundary>
                <ThrowError shouldThrow={false} />
            </ErrorBoundary>
        );

        // Should show normal content
        expect(screen.getByText('No error')).toBeInTheDocument();
        expect(screen.queryByText(/Component Error/i)).not.toBeInTheDocument();
    });

    it('should display error with custom fallback', () => {
        const customFallback = <div>Custom error fallback</div>;

        render(
            <ErrorBoundary fallback={customFallback}>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Custom error fallback')).toBeInTheDocument();
    });

    it('should call onError callback when error occurs', () => {
        const onError = jest.fn();

        render(
            <ErrorBoundary onError={onError}>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(onError).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({
                componentStack: expect.any(String),
            })
        );
    });

    it('should show error details in development mode', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';

        render(
            <ErrorBoundary level="global">
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
        
        process.env.NODE_ENV = originalEnv;
    });

    it('should render page-level error boundary', () => {
        render(
            <ErrorBoundary level="page">
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText(/Page Error/i)).toBeInTheDocument();
        expect(screen.getByText(/This page encountered an error/i)).toBeInTheDocument();
    });

    it('should render custom fallback component when provided', () => {
        const CustomFallback = ({ error, resetError }: any) => (
            <div>
                <h2>Custom Error UI</h2>
                <p>{error?.message || 'Unknown error'}</p>
                <button onClick={resetError}>Reset</button>
            </div>
        );

        render(
            <ErrorBoundary fallback={CustomFallback}>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
        expect(screen.getByText('Test error')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    });

    it('should handle errors in event handlers', () => {
        const ErrorComponent = () => {
            const handleClick = () => {
                throw new Error('Event handler error');
            };

            return <button onClick={handleClick}>Click me</button>;
        };

        render(
            <ErrorBoundary>
                <ErrorComponent />
            </ErrorBoundary>
        );

        const button = screen.getByRole('button', { name: /click me/i });

        // Event handler errors are not caught by error boundaries
        // This test verifies the component renders normally
        expect(button).toBeInTheDocument();

        // Clicking would throw an error, but it won't be caught by the boundary
        // In a real app, you'd need additional error handling for event handlers
    });

    it('should handle multiple error boundaries', () => {
        const InnerErrorBoundary = () => (
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        render(
            <ErrorBoundary>
                <InnerErrorBoundary />
            </ErrorBoundary>
        );

        // Inner boundary should catch the error
        expect(screen.getByText(/Component Error/i)).toBeInTheDocument();
        expect(screen.getByText(/Test error/i)).toBeInTheDocument();
    });

    it('should preserve error boundary state across re-renders', () => {
        const { rerender } = render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        // Error should be displayed
        expect(screen.getByText(/Component Error/i)).toBeInTheDocument();

        // Re-render with same error
        rerender(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        // Error should still be displayed
        expect(screen.getByText(/Component Error/i)).toBeInTheDocument();
    });
});