import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';

import 'package:wayrapp_mobile/features/authentication/presentation/screens/login_screen.dart';
import 'package:wayrapp_mobile/features/authentication/presentation/providers/auth_provider.dart';
import 'package:wayrapp_mobile/features/authentication/domain/models/user.dart';

import 'login_screen_test.mocks.dart';

@GenerateMocks([AuthProvider])
void main() {
  group('LoginScreen Widget Tests', () {
    late MockAuthProvider mockAuthProvider;

    setUp(() {
      mockAuthProvider = MockAuthProvider();
      
      // Default stubs
      when(mockAuthProvider.isAuthenticated).thenReturn(false);
      when(mockAuthProvider.isLoading).thenReturn(false);
      when(mockAuthProvider.error).thenReturn(null);
      when(mockAuthProvider.currentUser).thenReturn(null);
    });

    testWidgets('should display login form elements', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: const LoginScreen(),
          ),
        ),
      );

      // Verify UI elements are present
      expect(find.text('Login'), findsOneWidget);
      expect(find.text('Welcome to WayrApp'), findsOneWidget);
      expect(find.text('Sign in to continue your language learning journey'), findsOneWidget);
      expect(find.byKey(const Key('email_field')), findsOneWidget);
      expect(find.byKey(const Key('password_field')), findsOneWidget);
      expect(find.text('Login'), findsNWidgets(2)); // App bar + button
      expect(find.text('Don\'t have an account? Register'), findsOneWidget);
    });

    testWidgets('should show password visibility toggle', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: const LoginScreen(),
          ),
        ),
      );

      // Find password field
      final passwordField = find.byKey(const Key('password_field'));
      expect(passwordField, findsOneWidget);

      // Find visibility toggle button
      final visibilityToggle = find.byIcon(Icons.visibility);
      expect(visibilityToggle, findsOneWidget);

      // Tap to toggle visibility
      await tester.tap(visibilityToggle);
      await tester.pump();

      // Should now show visibility_off icon
      expect(find.byIcon(Icons.visibility_off), findsOneWidget);
    });

    testWidgets('should validate email field', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: const LoginScreen(),
          ),
        ),
      );

      // Try to submit with empty email
      await tester.tap(find.text('Login').last); // Login button
      await tester.pump();

      // Should show validation error
      expect(find.text('Email is required'), findsOneWidget);

      // Enter invalid email
      await tester.enterText(find.byKey(const Key('email_field')), 'invalid-email');
      await tester.tap(find.text('Login').last);
      await tester.pump();

      // Should show email format error
      expect(find.text('Please enter a valid email'), findsOneWidget);
    });

    testWidgets('should validate password field', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: const LoginScreen(),
          ),
        ),
      );

      // Enter valid email but no password
      await tester.enterText(find.byKey(const Key('email_field')), 'test@example.com');
      await tester.tap(find.text('Login').last);
      await tester.pump();

      // Should show password required error
      expect(find.text('Password is required'), findsOneWidget);

      // Enter short password
      await tester.enterText(find.byKey(const Key('password_field')), '123');
      await tester.tap(find.text('Login').last);
      await tester.pump();

      // Should show password length error
      expect(find.text('Password must be at least 8 characters'), findsOneWidget);
    });

    testWidgets('should call login when form is valid', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: const LoginScreen(),
          ),
        ),
      );

      // Enter valid credentials
      await tester.enterText(find.byKey(const Key('email_field')), 'test@example.com');
      await tester.enterText(find.byKey(const Key('password_field')), 'password123');

      // Tap login button
      await tester.tap(find.text('Login').last);
      await tester.pump();

      // Verify login was called
      verify(mockAuthProvider.login('test@example.com', 'password123')).called(1);
    });

    testWidgets('should show loading state during login', (WidgetTester tester) async {
      // Setup loading state
      when(mockAuthProvider.isLoading).thenReturn(true);

      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: const LoginScreen(),
          ),
        ),
      );

      // Should show loading indicator instead of login text
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.text('Login'), findsOneWidget); // Only in app bar

      // Login button should be disabled
      final loginButton = tester.widget<ElevatedButton>(
        find.byType(ElevatedButton),
      );
      expect(loginButton.onPressed, null);
    });

    testWidgets('should display error message when login fails', (WidgetTester tester) async {
      // Setup error state
      when(mockAuthProvider.error).thenReturn('Invalid credentials');

      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: const LoginScreen(),
          ),
        ),
      );

      // Should show error message
      expect(find.text('Invalid credentials'), findsOneWidget);
      expect(find.text('Retry'), findsOneWidget);
    });

    testWidgets('should retry login when retry button is tapped', (WidgetTester tester) async {
      // Setup error state
      when(mockAuthProvider.error).thenReturn('Network error');

      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: const LoginScreen(),
          ),
        ),
      );

      // Enter valid credentials first
      await tester.enterText(find.byKey(const Key('email_field')), 'test@example.com');
      await tester.enterText(find.byKey(const Key('password_field')), 'password123');

      // Tap retry button
      await tester.tap(find.text('Retry'));
      await tester.pump();

      // Should call login again
      verify(mockAuthProvider.login('test@example.com', 'password123')).called(1);
    });

    testWidgets('should submit form when Enter is pressed on password field', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: const LoginScreen(),
          ),
        ),
      );

      // Enter valid credentials
      await tester.enterText(find.byKey(const Key('email_field')), 'test@example.com');
      await tester.enterText(find.byKey(const Key('password_field')), 'password123');

      // Press Enter on password field
      await tester.testTextInput.receiveAction(TextInputAction.done);
      await tester.pump();

      // Should call login
      verify(mockAuthProvider.login('test@example.com', 'password123')).called(1);
    });

    testWidgets('should navigate to register screen when register link is tapped', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: const LoginScreen(),
          ),
          routes: {
            '/register': (context) => const Scaffold(body: Text('Register Screen')),
          },
        ),
      );

      // Tap register link
      await tester.tap(find.text('Don\'t have an account? Register'));
      await tester.pumpAndSettle();

      // Should navigate to register screen
      expect(find.text('Register Screen'), findsOneWidget);
    });

    testWidgets('should auto-navigate to dashboard when authenticated', (WidgetTester tester) async {
      // Setup authenticated state
      final mockUser = User(
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        role: UserRole.student,
      );
      when(mockAuthProvider.isAuthenticated).thenReturn(true);
      when(mockAuthProvider.currentUser).thenReturn(mockUser);

      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: const LoginScreen(),
          ),
          routes: {
            '/dashboard': (context) => const Scaffold(body: Text('Dashboard Screen')),
          },
        ),
      );

      await tester.pumpAndSettle();

      // Should navigate to dashboard
      expect(find.text('Dashboard Screen'), findsOneWidget);
    });

    testWidgets('should handle different error types', (WidgetTester tester) async {
      final errorTypes = [
        'Invalid credentials',
        'Network error',
        'Server error',
        'Validation failed',
      ];

      for (final errorMessage in errorTypes) {
        when(mockAuthProvider.error).thenReturn(errorMessage);

        await tester.pumpWidget(
          MaterialApp(
            home: ChangeNotifierProvider<AuthProvider>.value(
              value: mockAuthProvider,
              child: const LoginScreen(),
            ),
          ),
        );

        // Should display the error message
        expect(find.text(errorMessage), findsOneWidget);

        // Clean up for next iteration
        await tester.pumpWidget(Container());
      }
    });

    testWidgets('should trim whitespace from input fields', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: const LoginScreen(),
          ),
        ),
      );

      // Enter credentials with whitespace
      await tester.enterText(find.byKey(const Key('email_field')), '  test@example.com  ');
      await tester.enterText(find.byKey(const Key('password_field')), '  password123  ');

      // Submit form
      await tester.tap(find.text('Login').last);
      await tester.pump();

      // Should call login with trimmed email
      verify(mockAuthProvider.login('test@example.com', '  password123  ')).called(1);
    });

    testWidgets('should maintain form state during rebuilds', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: const LoginScreen(),
          ),
        ),
      );

      // Enter some text
      await tester.enterText(find.byKey(const Key('email_field')), 'test@example.com');
      await tester.enterText(find.byKey(const Key('password_field')), 'password123');

      // Trigger rebuild by changing provider state
      when(mockAuthProvider.isLoading).thenReturn(true);
      await tester.pump();

      // Form fields should maintain their values
      expect(find.text('test@example.com'), findsOneWidget);
      expect(find.text('password123'), findsOneWidget);
    });
  });
}