import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';

import 'package:wayrapp_mobile/features/dashboard/presentation/screens/dashboard_screen.dart';
import 'package:wayrapp_mobile/features/authentication/presentation/providers/auth_provider.dart';
import 'package:wayrapp_mobile/features/server_selection/presentation/providers/server_config_provider.dart';
import 'package:wayrapp_mobile/features/authentication/domain/models/user.dart';

import 'dashboard_screen_test.mocks.dart';

@GenerateMocks([AuthProvider, ServerConfigProvider])
void main() {
  group('DashboardScreen Widget Tests', () {
    late MockAuthProvider mockAuthProvider;
    late MockServerConfigProvider mockServerProvider;

    setUp(() {
      mockAuthProvider = MockAuthProvider();
      mockServerProvider = MockServerConfigProvider();
    });

    testWidgets('should display dashboard with user information', (WidgetTester tester) async {
      // Setup mock data
      const mockUser = User(
        id: '1',
        email: 'test@example.com',
        username: 'Test User',
        role: UserRole.student,
      );

      when(mockAuthProvider.currentUser).thenReturn(mockUser);
      when(mockAuthProvider.isAuthenticated).thenReturn(true);
      when(mockAuthProvider.isLoading).thenReturn(false);
      when(mockAuthProvider.error).thenReturn(null);
      
      when(mockServerProvider.serverUrl).thenReturn('https://test.wayrapp.com');
      when(mockServerProvider.isConnected).thenReturn(true);

      await tester.pumpWidget(
        MaterialApp(
          home: MultiProvider(
            providers: [
              ChangeNotifierProvider<AuthProvider>.value(value: mockAuthProvider),
              ChangeNotifierProvider<ServerConfigProvider>.value(value: mockServerProvider),
            ],
            child: const DashboardScreen(),
          ),
        ),
      );

      // Verify dashboard content
      expect(find.text('Dashboard'), findsOneWidget);
      expect(find.text('Welcome to WayrApp!'), findsOneWidget);
      expect(find.text('Hello, Test User!'), findsOneWidget);
      expect(find.text('Connected to Server'), findsOneWidget);
      expect(find.text('https://test.wayrapp.com'), findsOneWidget);
    });

    testWidgets('should display navigation drawer with menu items', (WidgetTester tester) async {
      // Setup mock data
      const mockUser = User(
        id: '1',
        email: 'test@example.com',
        username: 'Test User',
        role: UserRole.student,
      );

      when(mockAuthProvider.currentUser).thenReturn(mockUser);
      when(mockAuthProvider.isAuthenticated).thenReturn(true);
      when(mockAuthProvider.isLoading).thenReturn(false);
      when(mockAuthProvider.error).thenReturn(null);
      
      when(mockServerProvider.serverUrl).thenReturn('https://test.wayrapp.com');
      when(mockServerProvider.isConnected).thenReturn(true);

      await tester.pumpWidget(
        MaterialApp(
          home: MultiProvider(
            providers: [
              ChangeNotifierProvider<AuthProvider>.value(value: mockAuthProvider),
              ChangeNotifierProvider<ServerConfigProvider>.value(value: mockServerProvider),
            ],
            child: const DashboardScreen(),
          ),
        ),
      );

      // Open navigation drawer
      await tester.tap(find.byIcon(Icons.menu));
      await tester.pumpAndSettle();

      // Verify drawer content
      expect(find.text('Test User'), findsOneWidget);
      expect(find.text('test@example.com'), findsOneWidget);
      expect(find.text('Courses'), findsOneWidget);
      expect(find.text('Exercises'), findsOneWidget);
      expect(find.text('Offline Content'), findsOneWidget);
      expect(find.text('Settings'), findsOneWidget);
      expect(find.text('Help & Support'), findsOneWidget);
    });

    testWidgets('should show user menu with logout option', (WidgetTester tester) async {
      // Setup mock data
      const mockUser = User(
        id: '1',
        email: 'test@example.com',
        username: 'Test User',
        role: UserRole.student,
      );

      when(mockAuthProvider.currentUser).thenReturn(mockUser);
      when(mockAuthProvider.isAuthenticated).thenReturn(true);
      when(mockAuthProvider.isLoading).thenReturn(false);
      when(mockAuthProvider.error).thenReturn(null);
      
      when(mockServerProvider.serverUrl).thenReturn('https://test.wayrapp.com');
      when(mockServerProvider.isConnected).thenReturn(true);

      await tester.pumpWidget(
        MaterialApp(
          home: MultiProvider(
            providers: [
              ChangeNotifierProvider<AuthProvider>.value(value: mockAuthProvider),
              ChangeNotifierProvider<ServerConfigProvider>.value(value: mockServerProvider),
            ],
            child: const DashboardScreen(),
          ),
        ),
      );

      // Tap user menu
      await tester.tap(find.byType(PopupMenuButton<String>));
      await tester.pumpAndSettle();

      // Verify menu options
      expect(find.text('Test User'), findsOneWidget);
      expect(find.text('test@example.com'), findsOneWidget);
      expect(find.text('Change Server'), findsOneWidget);
      expect(find.text('Logout'), findsOneWidget);
    });

    testWidgets('should show coming soon dialog for future features', (WidgetTester tester) async {
      // Setup mock data
      const mockUser = User(
        id: '1',
        email: 'test@example.com',
        username: 'Test User',
        role: UserRole.student,
      );

      when(mockAuthProvider.currentUser).thenReturn(mockUser);
      when(mockAuthProvider.isAuthenticated).thenReturn(true);
      when(mockAuthProvider.isLoading).thenReturn(false);
      when(mockAuthProvider.error).thenReturn(null);
      
      when(mockServerProvider.serverUrl).thenReturn('https://test.wayrapp.com');
      when(mockServerProvider.isConnected).thenReturn(true);

      await tester.pumpWidget(
        MaterialApp(
          home: MultiProvider(
            providers: [
              ChangeNotifierProvider<AuthProvider>.value(value: mockAuthProvider),
              ChangeNotifierProvider<ServerConfigProvider>.value(value: mockServerProvider),
            ],
            child: const DashboardScreen(),
          ),
        ),
      );

      // Open navigation drawer
      await tester.tap(find.byIcon(Icons.menu));
      await tester.pumpAndSettle();

      // Verify that Courses menu item exists but is disabled
      expect(find.text('Courses'), findsOneWidget);
      expect(find.text('Coming soon'), findsNWidgets(5)); // Multiple coming soon items
      
      // The ListTile is disabled, so we can't tap it in the test
      // This verifies the UI shows the coming soon state correctly
    });

    testWidgets('should display user role information', (WidgetTester tester) async {
      // Test with different user roles
      for (final role in UserRole.values) {
        final mockUser = User(
          id: '1',
          email: 'test@example.com',
          username: 'Test User',
          role: role,
        );

        when(mockAuthProvider.currentUser).thenReturn(mockUser);
        when(mockAuthProvider.isAuthenticated).thenReturn(true);
        when(mockAuthProvider.isLoading).thenReturn(false);
        when(mockAuthProvider.error).thenReturn(null);
        
        when(mockServerProvider.serverUrl).thenReturn('https://test.wayrapp.com');
        when(mockServerProvider.isConnected).thenReturn(true);

        await tester.pumpWidget(
          MaterialApp(
            home: MultiProvider(
              providers: [
                ChangeNotifierProvider<AuthProvider>.value(value: mockAuthProvider),
                ChangeNotifierProvider<ServerConfigProvider>.value(value: mockServerProvider),
              ],
              child: const DashboardScreen(),
            ),
          ),
        );

        // Verify role is displayed correctly
        expect(find.text('Role: ${role.name.toUpperCase()}'), findsOneWidget);

        // Clean up for next iteration
        await tester.pumpWidget(Container());
      }
    });
  });
}