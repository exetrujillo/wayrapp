import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:mockito/mockito.dart';

import 'package:wayrapp_mobile/features/server_selection/presentation/screens/server_selection_screen.dart';
import 'package:wayrapp_mobile/features/server_selection/presentation/providers/server_config_provider.dart';
import 'package:wayrapp_mobile/features/server_selection/domain/models/server_config.dart';

import '../unit/server_selection_test.mocks.dart';

void main() {
  group('ServerSelectionScreen', () {
    late MockServerRepository mockRepository;
    late ServerConfigProvider provider;

    setUp(() {
      mockRepository = MockServerRepository();
      
      // Setup default stubs
      when(mockRepository.getPredefinedServers()).thenReturn([
        ServerConfig.defaultServer(),
      ]);
      when(mockRepository.loadServerConfig()).thenAnswer((_) async => null);
      
      provider = ServerConfigProvider(serverRepository: mockRepository);
    });

    testWidgets('should display server selection UI', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<ServerConfigProvider>.value(
            value: provider,
            child: const ServerSelectionScreen(),
          ),
        ),
      );

      // Verify UI elements are present
      expect(find.text('Select Server'), findsOneWidget);
      expect(find.text('Connect to WayrApp Server'), findsOneWidget);
      expect(find.text('Official WayrApp Server'), findsOneWidget);
      expect(find.text('Custom Server'), findsOneWidget);
      expect(find.text('Connect'), findsOneWidget);
    });

    testWidgets('should show custom server input when selected', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<ServerConfigProvider>.value(
            value: provider,
            child: const ServerSelectionScreen(),
          ),
        ),
      );

      // Tap on custom server option
      await tester.tap(find.text('Custom Server'));
      await tester.pump();

      // Verify custom server input field appears
      expect(find.byType(TextFormField), findsOneWidget);
      expect(find.text('Server URL'), findsOneWidget);
    });

    testWidgets('should handle connection success', (WidgetTester tester) async {
      // Setup provider to succeed connection
      when(mockRepository.testConnection(any)).thenAnswer((_) async => true);
      when(mockRepository.saveServerConfig(any)).thenAnswer((_) async {});

      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<ServerConfigProvider>.value(
            value: provider,
            child: const ServerSelectionScreen(),
          ),
        ),
      );

      // Tap connect button
      await tester.tap(find.text('Connect'));
      await tester.pumpAndSettle();

      // Verify connection was attempted
      verify(mockRepository.testConnection(any));
    });

    testWidgets('should show error when connection fails', (WidgetTester tester) async {
      // Setup provider to fail connection
      when(mockRepository.testConnection(any)).thenAnswer((_) async => false);

      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<ServerConfigProvider>.value(
            value: provider,
            child: const ServerSelectionScreen(),
          ),
        ),
      );

      // Tap connect button
      await tester.tap(find.text('Connect'));
      await tester.pumpAndSettle();

      // Verify error message is shown
      expect(find.textContaining('Failed to connect'), findsOneWidget);
      expect(find.text('Retry'), findsOneWidget);
    });

    testWidgets('should validate custom server URL', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider<ServerConfigProvider>.value(
            value: provider,
            child: const ServerSelectionScreen(),
          ),
        ),
      );

      // Select custom server
      await tester.tap(find.text('Custom Server'));
      await tester.pump();

      // Clear the text field and try to connect
      await tester.enterText(find.byType(TextFormField), '');
      await tester.tap(find.text('Connect'));
      await tester.pump();

      // Verify validation error is shown
      expect(find.text('Please enter a server URL'), findsOneWidget);
    });
  });
}