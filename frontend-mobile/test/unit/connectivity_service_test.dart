import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:wayrapp_mobile/core/network/connectivity_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  
  group('ConnectivityService', () {
    late ConnectivityService connectivityService;

    setUp(() {
      connectivityService = ConnectivityService.instance;
    });

    test('should initialize successfully', () async {
      // Mock the connectivity plugin
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
          .setMockMethodCallHandler(
        const MethodChannel('dev.fluttercommunity.plus/connectivity'),
        (MethodCall methodCall) async {
          if (methodCall.method == 'check') {
            return ['wifi'];
          }
          return null;
        },
      );
      
      await expectLater(connectivityService.initialize(), completes);
    });

    test('should provide connection status', () {
      expect(connectivityService.isConnected, isA<bool>());
    });

    test('should provide connection type', () {
      expect(connectivityService.connectionType, isA<NetworkConnectionType>());
    });

    test('should provide connection type description', () {
      final description = connectivityService.getConnectionTypeDescription();
      expect(description, isA<String>());
      expect(description.isNotEmpty, isTrue);
    });

    test('should detect metered connection', () {
      expect(connectivityService.isMeteredConnection(), isA<bool>());
    });
  });
}