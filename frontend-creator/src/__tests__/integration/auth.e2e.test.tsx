// NOTE: Replace 'AppRoutes' if your route component has a different name.
import { render, screen, waitFor } from '../utils/test-utils';
import userEvent from '@testing-library/user-event';
import { AppRoutes } from '../../App'; // IMPORTANT: Adjust this import path to your main routes component

// --- IMPORTANT ---
// We are NOT mocking any services. These tests will make REAL API calls.
// We ARE using our custom `render` from test-utils to provide all contexts.

describe('E2E Authentication Flow', () => {
    it('should allow a user to log in with valid credentials and see the dashboard', async () => {
        const user = userEvent.setup();

        // --- Setup ---
        // We use our custom `render` which provides all necessary contexts (Auth, Query, Error, etc.).
        // We render <AppRoutes /> INSTEAD of <App /> to avoid nested routers,
        // as our customRender already provides a MemoryRouter.
        render(<AppRoutes />, {
            initialEntries: ['/login']
        });

        // --- Step 1: Fill and Submit the Login Form ---
        const emailInput = await screen.findByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const loginButton = screen.getByRole('button', { name: /sign in/i });

        expect(emailInput).toBeInTheDocument();

        // --- ACTION REQUIRED BY HUMAN OPERATOR ---
        // Replace with credentials of a user that EXISTS in your test database.
        await user.type(emailInput, 'testuser@example.com');

        await user.type(passwordInput, 'ValidPassword123!');
        // --- END OF ACTION REQUIRED ---

        await user.click(loginButton);

        // --- Step 2: Verify Successful Redirection ---
        const dashboardHeading = await screen.findByRole('heading', { name: /dashboard/i, level: 1 });

        await waitFor(() => {
            expect(dashboardHeading).toBeInTheDocument();
        });
    });

    it('should redirect an unauthenticated user from a protected route to the login page', async () => {
        // --- Setup ---
        // Render the routes starting at a protected path.
        render(<AppRoutes />, {
            initialEntries: ['/dashboard']
        });

        // --- Verification ---
        // The AuthContext logic within the app should redirect to /login.
        const emailInput = await screen.findByLabelText(/email/i);

        await waitFor(() => {
            expect(emailInput).toBeInTheDocument();
        });
    });
});