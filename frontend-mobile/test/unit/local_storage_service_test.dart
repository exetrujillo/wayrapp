import 'package:flutter_test/flutter_test.dart';
import 'package:wayrapp_mobile/shared/services/local_storage_service.dart';

void main() {
  group('LocalStorageService', () {
    late LocalStorageService localStorageService;

    setUp(() {
      localStorageService = LocalStorageService.instance;
    });

    test('should initialize successfully', () async {
      expect(() => localStorageService.initialize(), returnsNormally);
    });

    test('should store and retrieve server config', () async {
      await localStorageService.initialize();
      
      const serverConfig = ServerConfig(
        url: 'https://test.example.com',
        name: 'Test Server',
        isSelected: true,
      );

      await localStorageService.storeServerConfig(serverConfig);
      final retrieved = await localStorageService.getServerConfig();

      expect(retrieved, isNotNull);
      expect(retrieved!.url, equals('https://test.example.com'));
      expect(retrieved.name, equals('Test Server'));
      expect(retrieved.isSelected, isTrue);
    });

    test('should store and retrieve app preferences', () async {
      await localStorageService.initialize();
      
      const preferences = {
        'theme': 'dark',
        'language': 'en',
        'notifications': true,
      };

      await localStorageService.storeAppPreferences(preferences);
      final retrieved = await localStorageService.getAppPreferences();

      expect(retrieved['theme'], equals('dark'));
      expect(retrieved['language'], equals('en'));
      expect(retrieved['notifications'], isTrue);
    });

    test('should get storage info', () async {
      await localStorageService.initialize();
      
      final info = await localStorageService.getStorageInfo();
      
      expect(info, isA<Map<String, dynamic>>());
      expect(info.containsKey('totalKeys'), isTrue);
      expect(info.containsKey('hasUserData'), isTrue);
      expect(info.containsKey('hasProgressData'), isTrue);
    });
  });
}