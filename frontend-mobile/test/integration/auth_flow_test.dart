import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';

import 'package:wayrapp_mobile/app.dart';
import 'package:wayrapp_mobile/features/authentication/presentation/providers/auth_provider.dart';
import 'package:wayrapp_mobile/features/server_selection/presentation/providers/server_config_provider.dart';
import 'package:wayrapp_mobile/shared/providers/connectivity_provider.dart';
import 'package:wayrapp_mobile/features/authentication/domain/models/user.dart';
import 'package:wayrapp_mobile/features/authentication/domain/models/auth_response.dart';
import 'package:wayrapp_mobile/features/authentication/domain/repositories/auth_repository.dart';
import 'package:wayrapp_mobile/features/server_selection/data/repositories/server_repository.dart';
import 'package:wayrapp_mobile/features/server_selection/domain/models/server_config.dart';

import 'auth_flow_test.mocks.dart';

@GenerateMocks([AuthRepository, ServerRepository])
void main() {
  group('Authentication Flow Integration Tests', () {
    late MockAuthRepository mockAuthRepository;
    late MockServerRepository mockServerRepository;

    setUp(() {
      mockAuthRepository = MockAuthRepository();
      mockServerRepository = MockServerRepository();

      // Default stubs for server repository
      when(mockServerRepository.getPredefinedServers()).thenReturn([
        ServerConfig.defaultServer(),
      ]);
      when(mockServerRepository.loadServerConfig()).thenAnswer((_) async => null);
      when(mockServerRepository.testConnection(any)).thenAnswer((_) async => true);
      when(mockServerRepository.saveServerConfig(any)).thenAnswer((_) async {});

      // Default stubs for auth repository
      when(mockAuthRepository.isAuthenticated()).thenAnswer((_) async => false);
      when(mockAuthRepository.getCurrentUser()).thenAnswer((_) async => null);
    });

    Widget createTestApp() {
      return MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => ConnectivityProvider()),
          ChangeNotifierProvider(create: (_) => ServerConfigProvider(
            serverRepository: mockServerRepository,
          )),
          ChangeNotifierProvider(create: (_) => AuthProvider(
            authRepository: mockAuthRepository,
          )),
        ],
        child: const MyApp(),
      );
    }

    testWidgets('should start with server selection when not connected', (WidgetTester tester) async {
      await tester.pumpWidget(createTestApp());
      await tester.pumpAndSettle();

      // Should start with server selection screen
      expect(find.text('Select Server'), findsOneWidget);
      expect(find.text('Connect to WayrApp Server'), findsOneWidget);
    });

    testWidgets('should navigate to login after server connection', (WidgetTester tester) async {
      await tester.pumpWidget(createTestApp());
      await tester.pumpAndSettle();

      // Should be on server selection
      expect(find.text('Select Server'), findsOneWidget);

      // Connect to default server
      await tester.tap(find.text('Connect'));
      await tester.pumpAndSettle();

      // Should navigate to login screen
      expect(find.text('Welcome to WayrApp'), findsOneWidget);
      expect(find.text('Sign in to continue your language learning journey'), findsOneWidget);
    });

    testWidgets('should complete login flow and navigate to dashboard', (WidgetTester tester) async {
      // Setup successful login
      final mockUser = User(
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        role: UserRole.student,
      );
      final mockAuthResponse = AuthResponse(
        token: 'test_token',
        refreshToken: 'test_refresh_token',
        user: mockUser,
      );
      when(mockAuthRepository.login(any, any)).thenAnswer((_) async => mockAuthResponse);

      await tester.pumpWidget(createTestApp());
      await tester.pumpAndSettle();

      // Connect to server
      await tester.tap(find.text('Connect'));
      await tester.pumpAndSettle();

      // Should be on login screen
      expect(find.text('Welcome to WayrApp'), findsOneWidget);

      // Enter login credentials
      await tester.enterText(find.byKey(const Key('email_field')), 'test@example.com');
      await tester.enterText(find.byKey(const Key('password_field')), 'password123');

      // Submit login
      await tester.tap(find.text('Login').last);
      await tester.pumpAndSettle();

      // Should navigate to dashboard
      expect(find.text('Dashboard'), findsOneWidget);
      expect(find.text('Welcome to WayrApp!'), findsOneWidget);
      expect(find.text('Hello, testuser!'), findsOneWidget);

      // Verify login was called
      verify(mockAuthRepository.login('test@example.com', 'password123')).called(1);
    });

    testWidgets('should handle login errors gracefully', (WidgetTester tester) async {
      // Setup login failure
      when(mockAuthRepository.login(any, any)).thenThrow(Exception('Invalid credentials'));

      await tester.pumpWidget(createTestApp());
      await tester.pumpAndSettle();

      // Connect to server
      await tester.tap(find.text('Connect'));
      await tester.pumpAndSettle();

      // Enter login credentials
      await tester.enterText(find.byKey(const Key('email_field')), 'test@example.com');
      await tester.enterText(find.byKey(const Key('password_field')), 'wrong_password');

      // Submit login
      await tester.tap(find.text('Login').last);
      await tester.pumpAndSettle();

      // Should stay on login screen and show error
      expect(find.text('Welcome to WayrApp'), findsOneWidget);
      expect(find.text('An unexpected error occurred'), findsOneWidget);
    });

    testWidgets('should navigate between login and register screens', (WidgetTester tester) async {
      await tester.pumpWidget(createTestApp());
      await tester.pumpAndSettle();

      // Connect to server
      await tester.tap(find.text('Connect'));
      await tester.pumpAndSettle();

      // Should be on login screen
      expect(find.text('Welcome to WayrApp'), findsOneWidget);

      // Navigate to register
      await tester.tap(find.text('Don\'t have an account? Register'));
      await tester.pumpAndSettle();

      // Should be on register screen
      expect(find.text('Create Your Account'), findsOneWidget);

      // Navigate back to login
      await tester.tap(find.text('Already have an account? Login'));
      await tester.pumpAndSettle();

      // Should be back on login screen
      expect(find.text('Welcome to WayrApp'), findsOneWidget);
    });

    testWidgets('should complete registration flow', (WidgetTester tester) async {
      // Setup successful registration
      final mockUser = User(
        id: '2',
        email: 'newuser@example.com',
        username: 'newuser',
        role: UserRole.student,
      );
      final mockAuthResponse = AuthResponse(
        token: 'new_token',
        refreshToken: 'new_refresh_token',
        user: mockUser,
      );
      when(mockAuthRepository.register(any, any, any)).thenAnswer((_) async => mockAuthResponse);

      await tester.pumpWidget(createTestApp());
      await tester.pumpAndSettle();

      // Connect to server
      await tester.tap(find.text('Connect'));
      await tester.pumpAndSettle();

      // Navigate to register
      await tester.tap(find.text('Don\'t have an account? Register'));
      await tester.pumpAndSettle();

      // Enter registration data
      await tester.enterText(find.byKey(const Key('email_field')), 'newuser@example.com');
      await tester.enterText(find.byKey(const Key('username_field')), 'newuser');
      await tester.enterText(find.byKey(const Key('password_field')), 'password123');
      await tester.enterText(find.byKey(const Key('confirm_password_field')), 'password123');

      // Submit registration
      await tester.tap(find.text('Create Account'));
      await tester.pumpAndSettle();

      // Should navigate to dashboard
      expect(find.text('Dashboard'), findsOneWidget);
      expect(find.text('Hello, newuser!'), findsOneWidget);

      // Verify registration was called
      verify(mockAuthRepository.register('newuser@example.com', 'password123', 'newuser')).called(1);
    });

    testWidgets('should handle logout flow correctly', (WidgetTester tester) async {
      // Setup authenticated state
      final mockUser = User(
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        role: UserRole.student,
      );
      when(mockAuthRepository.isAuthenticated()).thenAnswer((_) async => true);
      when(mockAuthRepository.getCurrentUser()).thenAnswer((_) async => mockUser);
      when(mockAuthRepository.logout()).thenAnswer((_) async {});

      await tester.pumpWidget(createTestApp());
      await tester.pumpAndSettle();

      // Should start on dashboard (already authenticated)
      expect(find.text('Dashboard'), findsOneWidget);

      // Open user menu
      await tester.tap(find.byType(PopupMenuButton<String>));
      await tester.pumpAndSettle();

      // Tap logout
      await tester.tap(find.text('Logout'));
      await tester.pumpAndSettle();

      // Confirm logout
      expect(find.text('Are you sure you want to logout?'), findsOneWidget);
      await tester.tap(find.text('Logout'));
      await tester.pumpAndSettle();

      // Should navigate back to login screen
      expect(find.text('Welcome to WayrApp'), findsOneWidget);

      // Verify logout was called
      verify(mockAuthRepository.logout()).called(1);
    });

    testWidgets('should handle server change flow', (WidgetTester tester) async {
      // Setup authenticated state
      final mockUser = User(
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        role: UserRole.student,
      );
      when(mockAuthRepository.isAuthenticated()).thenAnswer((_) async => true);
      when(mockAuthRepository.getCurrentUser()).thenAnswer((_) async => mockUser);
      when(mockAuthRepository.logout()).thenAnswer((_) async {});
      when(mockServerRepository.clearServerConfig()).thenAnswer((_) async {});

      await tester.pumpWidget(createTestApp());
      await tester.pumpAndSettle();

      // Should start on dashboard
      expect(find.text('Dashboard'), findsOneWidget);

      // Open user menu
      await tester.tap(find.byType(PopupMenuButton<String>));
      await tester.pumpAndSettle();

      // Tap change server
      await tester.tap(find.text('Change Server'));
      await tester.pumpAndSettle();

      // Confirm server change
      expect(find.text('This will log you out and return to server selection.'), findsOneWidget);
      await tester.tap(find.text('Change Server'));
      await tester.pumpAndSettle();

      // Should navigate back to server selection
      expect(find.text('Select Server'), findsOneWidget);

      // Verify logout and server clear were called
      verify(mockAuthRepository.logout()).called(1);
      verify(mockServerRepository.clearServerConfig()).called(1);
    });

    testWidgets('should maintain authentication state across app restarts', (WidgetTester tester) async {
      // Setup persistent authentication
      final mockUser = User(
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        role: UserRole.student,
      );
      when(mockAuthRepository.isAuthenticated()).thenAnswer((_) async => true);
      when(mockAuthRepository.getCurrentUser()).thenAnswer((_) async => mockUser);

      // Setup server connection
      when(mockServerRepository.loadServerConfig()).thenAnswer((_) async => 
        ServerConfig.defaultServer().copyWith(status: ServerStatus.connected)
      );

      await tester.pumpWidget(createTestApp());
      await tester.pumpAndSettle();

      // Should start directly on dashboard (authenticated + server connected)
      expect(find.text('Dashboard'), findsOneWidget);
      expect(find.text('Hello, testuser!'), findsOneWidget);
    });

    testWidgets('should handle network errors during authentication', (WidgetTester tester) async {
      // Setup network error
      when(mockAuthRepository.login(any, any)).thenThrow(Exception('Network error'));

      await tester.pumpWidget(createTestApp());
      await tester.pumpAndSettle();

      // Connect to server
      await tester.tap(find.text('Connect'));
      await tester.pumpAndSettle();

      // Enter credentials
      await tester.enterText(find.byKey(const Key('email_field')), 'test@example.com');
      await tester.enterText(find.byKey(const Key('password_field')), 'password123');

      // Submit login
      await tester.tap(find.text('Login').last);
      await tester.pumpAndSettle();

      // Should show error and stay on login screen
      expect(find.text('Welcome to WayrApp'), findsOneWidget);
      expect(find.text('An unexpected error occurred'), findsOneWidget);
      expect(find.text('Retry'), findsOneWidget);
    });

    testWidgets('should redirect unauthenticated users to login', (WidgetTester tester) async {
      // Setup server connected but not authenticated
      when(mockServerRepository.loadServerConfig()).thenAnswer((_) async => 
        ServerConfig.defaultServer().copyWith(status: ServerStatus.connected)
      );

      await tester.pumpWidget(createTestApp());
      await tester.pumpAndSettle();

      // Should redirect to login (server connected but not authenticated)
      expect(find.text('Welcome to WayrApp'), findsOneWidget);
    });

    testWidgets('should handle authentication errors during initialization', (WidgetTester tester) async {
      // Setup authentication check failure
      when(mockAuthRepository.isAuthenticated()).thenThrow(Exception('Storage error'));
      when(mockAuthRepository.logout()).thenAnswer((_) async {});

      await tester.pumpWidget(createTestApp());
      await tester.pumpAndSettle();

      // Should handle error gracefully and show server selection
      expect(find.text('Select Server'), findsOneWidget);

      // Should have called logout as fallback
      verify(mockAuthRepository.logout()).called(1);
    });
  });
}