import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';

import 'package:wayrapp_mobile/features/server_selection/domain/models/server_config.dart';
import 'package:wayrapp_mobile/features/server_selection/data/repositories/server_repository.dart';
import 'package:wayrapp_mobile/features/server_selection/presentation/providers/server_config_provider.dart';

import 'server_selection_test.mocks.dart';

@GenerateMocks([ServerRepository])
void main() {
  group('ServerConfig', () {
    test('should create default server config', () {
      final config = ServerConfig.defaultServer();
      
      expect(config.url, 'https://wayrapp.vercel.app');
      expect(config.name, 'Official WayrApp Server');
      expect(config.isDefault, true);
      expect(config.status, ServerStatus.unknown);
    });

    test('should create custom server config', () {
      final config = ServerConfig.custom(
        url: 'https://custom.example.com',
        name: 'My Custom Server',
      );
      
      expect(config.url, 'https://custom.example.com');
      expect(config.name, 'My Custom Server');
      expect(config.isDefault, false);
      expect(config.status, ServerStatus.unknown);
    });

    test('should copy with updated fields', () {
      final original = ServerConfig.defaultServer();
      final updated = original.copyWith(
        status: ServerStatus.connected,
        lastConnected: DateTime(2024, 1, 1),
      );
      
      expect(updated.url, original.url);
      expect(updated.name, original.name);
      expect(updated.status, ServerStatus.connected);
      expect(updated.lastConnected, DateTime(2024, 1, 1));
    });

    test('should serialize to and from JSON', () {
      final config = ServerConfig(
        url: 'https://test.com',
        name: 'Test Server',
        isDefault: false,
        status: ServerStatus.connected,
        lastConnected: DateTime(2024, 1, 1),
      );
      
      final json = config.toJson();
      final restored = ServerConfig.fromJson(json);
      
      expect(restored.url, config.url);
      expect(restored.name, config.name);
      expect(restored.isDefault, config.isDefault);
      expect(restored.status, config.status);
      expect(restored.lastConnected, config.lastConnected);
    });
  });

  group('ServerStatus', () {
    test('should have correct display names', () {
      expect(ServerStatus.unknown.displayName, 'Unknown');
      expect(ServerStatus.connected.displayName, 'Connected');
      expect(ServerStatus.disconnected.displayName, 'Disconnected');
      expect(ServerStatus.error.displayName, 'Error');
      expect(ServerStatus.testing.displayName, 'Testing...');
    });

    test('should identify connected status correctly', () {
      expect(ServerStatus.connected.isConnected, true);
      expect(ServerStatus.unknown.isConnected, false);
      expect(ServerStatus.error.isConnected, false);
    });

    test('should identify error status correctly', () {
      expect(ServerStatus.error.hasError, true);
      expect(ServerStatus.connected.hasError, false);
      expect(ServerStatus.unknown.hasError, false);
    });
  });

  group('ServerConfigProvider', () {
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

    test('should initialize with predefined servers', () {
      expect(provider.predefinedServers.length, 1);
      expect(provider.predefinedServers.first.url, 'https://wayrapp.vercel.app');
      verify(mockRepository.getPredefinedServers());
    });

    test('should set server config and test connection', () async {
      final config = ServerConfig.defaultServer();
      
      when(mockRepository.testConnection(config.url)).thenAnswer((_) async => true);
      when(mockRepository.saveServerConfig(any)).thenAnswer((_) async {});
      
      await provider.setServerConfig(config);
      
      expect(provider.isConnected, true);
      expect(provider.currentConfig?.status, ServerStatus.connected);
      verify(mockRepository.testConnection(config.url));
      verify(mockRepository.saveServerConfig(any));
    });

    test('should handle connection failure', () async {
      final config = ServerConfig.defaultServer();
      
      when(mockRepository.testConnection(config.url)).thenAnswer((_) async => false);
      
      await provider.setServerConfig(config);
      
      expect(provider.isConnected, false);
      expect(provider.currentConfig?.status, ServerStatus.error);
      expect(provider.error, isNotNull);
    });

    test('should clear server configuration', () async {
      when(mockRepository.clearServerConfig()).thenAnswer((_) async {});
      
      await provider.clearServer();
      
      expect(provider.currentConfig, isNull);
      expect(provider.error, isNull);
      verify(mockRepository.clearServerConfig());
    });
  });
}