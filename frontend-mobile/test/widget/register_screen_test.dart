import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:mockito/mockito.dart';

import 'package:wayrapp_mobile/features/authentication/presentation/screens/register_screen.dart';
import 'package:wayrapp_mobile/features/authentication/presentation/providers/auth_provider.dart';
import 'package:wayrapp_mobile/features/authentication/domain/models/user.dart';

import 'login_screen_test.mocks.dart'; // Reuse the same mock

void main() {
  group('RegisterScreen Widget Tests', () {
    late MockAuthProvider mockAuthProvider;

    setUp(() {
      mockAuthProvider = MockAuthProvider();
      
      // Default stubs
      when(mockAuthProvider.isAuthenticated).thenReturn(false);
      when(mockAuthProvider.isLoading).thenReturn(false);
      when(mockAuthProvider.error).thenReturn(null);
      when(mockAuthProvider.currentUser).thenReturn(null);
    });

    testWidgets('should display register form elements', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: const RegisterScreen(),
          ),
        ),
      );

      // Verify UI elements are present
      expect(find.text('Register'), findsOneWidget);
      expect(find.text('Create Your Account'), findsOneWidget);
      expect(find.text('Join WayrApp and start your language learning journey'), findsOneWidget);
      expect(find.byKey(const Key('email_field')), findsOneWidget);
      expect(find.byKey(const Key('username_field')), findsOneWidget);
      expect(find.byKey(const Key('password_field')), findsOneWidget);
      expect(find.byKey(const Key('confirm_password_field')), findsOneWidget);
      expect(find.text('Create Account'), findsOneWidget);
      expect(find.text('Already have an account? Login'), findsOneWidget);
    });

    testWidgets('should show password visibility toggles', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: const RegisterScreen(),
          ),
        ),
      );

      // Should have two visibility toggle buttons (password and confirm password)
      expect(find.byIcon(Icons.visibility), findsNWidgets(2));

      // Tap first visibility toggle (password field)
      await tester.tap(find.byIcon(Icons.visibility).first);
      await tester.pump();

      // Should show one visibility_off and one visibility icon
      expect(find.byIcon(Icons.visibility_off), findsOneWidget);
      expect(find.byIcon(Icons.visibility), findsOneWidget);
    });

    testWidgets('should validate email field', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: const RegisterScreen(),
          ),
        ),
      );

      // Try to submit with empty email
      await tester.tap(find.text('Create Account'));
      await tester.pump();

      // Should show validation error
      expect(find.text('Email is required'), findsOneWidget);

      // Enter invalid email
      await tester.enterText(find.byKey(const Key('email_field')), 'invalid-email');
      await tester.tap(find.text('Create Account'));
      await tester.pump();

      // Should show email format error
      expect(find.text('Please enter a valid email'), findsOneWidget);
    });

    testWidgets('should validate username field', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: const RegisterScreen(),
          ),
        ),
      );

      // Enter valid email but invalid username
      await tester.enterText(find.byKey(const Key('email_field')), 'test@example.com');
      await tester.enterText(find.byKey(const Key('username_field')), 'a' * 51); // Too long
      await tester.tap(find.text('Create Account'));
      await tester.pump();

      // Should show username length error
      expect(find.text('Username must be maximum 50 characters'), findsOneWidget);

      // Enter username with invalid characters
      await tester.enterText(find.byKey(const Key('username_field')), 'user@name');
      await tester.tap(find.text('Create Account'));
      await tester.pump();

      // Should show invalid characters error
      expect(find.textContaining('letters, numbers, hyphens, and underscores'), findsOneWidget);
    });

    testWidgets('should validate password field', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: const RegisterScreen(),
          ),
        ),
      );

      // Enter valid email and username but no password
      await tester.enterText(find.byKey(const Key('email_field')), 'test@example.com');
      await tester.enterText(find.byKey(const Key('username_field')), 'testuser');
      await tester.tap(find.text('Create Account'));
      await tester.pump();

      // Should show password required error
      expect(find.text('Password is required'), findsOneWidget);

      // Enter short password
      await tester.enterText(find.byKey(const Key('password_field')), '123');
      await tester.tap(find.text('Create Account'));
      await tester.pump();

      // Should show password length error
      expect(find.text('Password must be at least 8 characters'), findsOneWidget);
    });

    testWidgets('should validate password confirmation', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: const RegisterScreen(),
          ),
        ),
      );

      // Enter valid data but mismatched passwords
      await tester.enterText(find.byKey(const Key('email_field')), 'test@example.com');
      await tester.enterText(find.byKey(const Key('username_field')), 'testuser');
      await tester.enterText(find.byKey(const Key('password_field')), 'password123');
      await tester.enterText(find.byKey(const Key('confirm_password_field')), 'different123');
      await tester.tap(find.text('Create Account'));
      await tester.pump();

      // Should show password mismatch error
      expect(find.text('Passwords do not match'), findsOneWidget);
    });

    testWidgets('should call register when form is valid', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: const RegisterScreen(),
          ),
        ),
      );

      // Enter valid registration data
      await tester.enterText(find.byKey(const Key('email_field')), 'test@example.com');
      await tester.enterText(find.byKey(const Key('username_field')), 'testuser');
      await tester.enterText(find.byKey(const Key('password_field')), 'password123');
      await tester.enterText(find.byKey(const Key('confirm_password_field')), 'password123');

      // Tap register button
      await tester.tap(find.text('Create Account'));
      await tester.pump();

      // Verify register was called
      verify(mockAuthProvider.register('test@example.com', 'password123', 'testuser')).called(1);
    });

    testWidgets('should register without username when field is empty', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: const RegisterScreen(),
          ),
        ),
      );

      // Enter valid data without username
      await tester.enterText(find.byKey(const Key('email_field')), 'test@example.com');
      await tester.enterText(find.byKey(const Key('password_field')), 'password123');
      await tester.enterText(find.byKey(const Key('confirm_password_field')), 'password123');

      // Tap register button
      await tester.tap(find.text('Create Account'));
      await tester.pump();

      // Verify register was called with null username
      verify(mockAuthProvider.register('test@example.com', 'password123', null)).called(1);
    });

    testWidgets('should show loading state during registration', (WidgetTester tester) async {
      // Setup loading state
      when(mockAuthProvider.isLoading).thenReturn(true);

      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: const RegisterScreen(),
          ),
        ),
      );

      // Should show loading indicator instead of register text
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.text('Create Account'), findsNothing);

      // Register button should be disabled
      final registerButton = tester.widget<ElevatedButton>(
        find.byType(ElevatedButton),
      );
      expect(registerButton.onPressed, null);
    });

    testWidgets('should display error message when registration fails', (WidgetTester tester) async {
      // Setup error state
      when(mockAuthProvider.error).thenReturn('Email already exists');

      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: const RegisterScreen(),
          ),
        ),
      );

      // Should show error message
      expect(find.text('Email already exists'), findsOneWidget);
      expect(find.text('Retry'), findsOneWidget);
    });

    testWidgets('should retry registration when retry button is tapped', (WidgetTester tester) async {
      // Setup error state
      when(mockAuthProvider.error).thenReturn('Network error');

      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: const RegisterScreen(),
          ),
        ),
      );

      // Enter valid credentials first
      await tester.enterText(find.byKey(const Key('email_field')), 'test@example.com');
      await tester.enterText(find.byKey(const Key('username_field')), 'testuser');
      await tester.enterText(find.byKey(const Key('password_field')), 'password123');
      await tester.enterText(find.byKey(const Key('confirm_password_field')), 'password123');

      // Tap retry button
      await tester.tap(find.text('Retry'));
      await tester.pump();

      // Should call register again
      verify(mockAuthProvider.register('test@example.com', 'password123', 'testuser')).called(1);
    });

    testWidgets('should navigate to login screen when login link is tapped', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: const RegisterScreen(),
          ),
          routes: {
            '/login': (context) => const Scaffold(body: Text('Login Screen')),
          },
        ),
      );

      // Tap login link
      await tester.tap(find.text('Already have an account? Login'));
      await tester.pumpAndSettle();

      // Should navigate to login screen
      expect(find.text('Login Screen'), findsOneWidget);
    });

    testWidgets('should auto-navigate to dashboard when authenticated', (WidgetTester tester) async {
      // Setup authenticated state
      const mockUser = User(
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
            child: const RegisterScreen(),
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

    testWidgets('should trim whitespace from input fields', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: const RegisterScreen(),
          ),
        ),
      );

      // Enter credentials with whitespace
      await tester.enterText(find.byKey(const Key('email_field')), '  test@example.com  ');
      await tester.enterText(find.byKey(const Key('username_field')), '  testuser  ');
      await tester.enterText(find.byKey(const Key('password_field')), 'password123');
      await tester.enterText(find.byKey(const Key('confirm_password_field')), 'password123');

      // Submit form
      await tester.tap(find.text('Create Account'));
      await tester.pump();

      // Should call register with trimmed values
      verify(mockAuthProvider.register('test@example.com', 'password123', 'testuser')).called(1);
    });

    testWidgets('should handle password strength indicators', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: const RegisterScreen(),
          ),
        ),
      );

      // Enter weak password
      await tester.enterText(find.byKey(const Key('password_field')), 'password');
      await tester.pump();

      // Should show password strength indicator (if implemented)
      // This test assumes the UI shows some form of password strength feedback
    });

    testWidgets('should validate form on field changes', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: const RegisterScreen(),
          ),
        ),
      );

      // Enter invalid email and move to next field
      await tester.enterText(find.byKey(const Key('email_field')), 'invalid-email');
      await tester.testTextInput.receiveAction(TextInputAction.next);
      await tester.pump();

      // Should show validation error immediately
      expect(find.text('Please enter a valid email'), findsOneWidget);
    });

    testWidgets('should maintain form state during rebuilds', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: const RegisterScreen(),
          ),
        ),
      );

      // Enter some text
      await tester.enterText(find.byKey(const Key('email_field')), 'test@example.com');
      await tester.enterText(find.byKey(const Key('username_field')), 'testuser');
      await tester.enterText(find.byKey(const Key('password_field')), 'password123');

      // Trigger rebuild by changing provider state
      when(mockAuthProvider.isLoading).thenReturn(true);
      await tester.pump();

      // Form fields should maintain their values
      expect(find.text('test@example.com'), findsOneWidget);
      expect(find.text('testuser'), findsOneWidget);
      expect(find.text('password123'), findsOneWidget);
    });
  });
}