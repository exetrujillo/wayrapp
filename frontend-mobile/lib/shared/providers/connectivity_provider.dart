/**
 * Connectivity Provider for managing network state in the Flutter app.
 * 
 * This provider wraps the ConnectivityService and provides a reactive
 * interface for the UI to respond to network connectivity changes.
 * It integrates with the Provider pattern for state management.
 * 
 * @module ConnectivityProvider
 * @category Providers
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Use in widget tree
 * Consumer<ConnectivityProvider>(
 *   builder: (context, connectivity, child) {
 *     if (!connectivity.isConnected) {
 *       return OfflineIndicator();
 *     }
 *     return OnlineContent();
 *   },
 * )
 */

import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../core/network/connectivity_service.dart';

/// Provider class for managing network connectivity state across the app
class ConnectivityProvider extends ChangeNotifier {
  final ConnectivityService _connectivityService;
  
  StreamSubscription<bool>? _connectionSubscription;
  StreamSubscription<NetworkConnectionType>? _connectionTypeSubscription;
  
  bool _isConnected = false;
  NetworkConnectionType _connectionType = NetworkConnectionType.none;
  bool _isInitialized = false;
  String? _lastConnectionError;

  /**
   * Creates a new ConnectivityProvider instance.
   * 
   * @param {ConnectivityService} connectivityService - The connectivity service to use
   */
  ConnectivityProvider({
    ConnectivityService? connectivityService,
  }) : _connectivityService = connectivityService ?? ConnectivityService.instance;

  /// Whether the device is connected to the internet
  bool get isConnected => _isConnected;
  
  /// Whether the device is offline (no internet connection)
  bool get isOffline => !_isConnected;
  
  /// Current network connection type
  NetworkConnectionType get connectionType => _connectionType;
  
  /// Whether the provider has been initialized
  bool get isInitialized => _isInitialized;
  
  /// Last connection error message, if any
  String? get lastConnectionError => _lastConnectionError;
  
  /// Human-readable description of the current connection type
  String get connectionTypeDescription => _connectivityService.getConnectionTypeDescription();
  
  /// Whether the current connection is metered (mobile data)
  bool get isMeteredConnection => _connectivityService.isMeteredConnection();

  /**
   * Initializes the connectivity provider and starts monitoring network changes.
   * 
   * This method should be called during app initialization to start monitoring
   * network connectivity and update the UI accordingly.
   * 
   * @returns {Future<void>} Completes when initialization is finished
   * 
   * @example
   * final connectivityProvider = ConnectivityProvider();
   * await connectivityProvider.initialize();
   */
  Future<void> initialize() async {
    try {
      // Initialize the connectivity service
      await _connectivityService.initialize();
      
      // Get initial connection state
      _isConnected = _connectivityService.isConnected;
      _connectionType = _connectivityService.connectionType;
      
      // Listen to connection status changes
      _connectionSubscription = _connectivityService.connectionStream.listen(
        _onConnectionStatusChanged,
        onError: _onConnectionError,
      );
      
      // Listen to connection type changes
      _connectionTypeSubscription = _connectivityService.connectionTypeStream.listen(
        _onConnectionTypeChanged,
        onError: _onConnectionError,
      );
      
      _isInitialized = true;
      _lastConnectionError = null;
      
      debugPrint('ConnectivityProvider initialized successfully');
      notifyListeners();
    } catch (e) {
      _lastConnectionError = 'Failed to initialize connectivity: $e';
      debugPrint(_lastConnectionError);
      notifyListeners();
    }
  }

  /**
   * Handles connection status changes from the connectivity service.
   * 
   * @param {bool} isConnected - Whether the device is connected to the internet
   */
  void _onConnectionStatusChanged(bool isConnected) {
    if (_isConnected != isConnected) {
      _isConnected = isConnected;
      _lastConnectionError = null;
      
      debugPrint('ConnectivityProvider: Connection status changed to $isConnected');
      notifyListeners();
    }
  }

  /**
   * Handles connection type changes from the connectivity service.
   * 
   * @param {NetworkConnectionType} connectionType - The new connection type
   */
  void _onConnectionTypeChanged(NetworkConnectionType connectionType) {
    if (_connectionType != connectionType) {
      _connectionType = connectionType;
      
      debugPrint('ConnectivityProvider: Connection type changed to $connectionType');
      notifyListeners();
    }
  }

  /**
   * Handles errors from the connectivity service streams.
   * 
   * @param {dynamic} error - The error that occurred
   */
  void _onConnectionError(dynamic error) {
    _lastConnectionError = 'Connectivity error: $error';
    debugPrint(_lastConnectionError);
    notifyListeners();
  }

  /**
   * Manually checks the current connectivity status.
   * 
   * This method forces a connectivity check and updates the provider state.
   * Useful for retry scenarios or when the app comes back to foreground.
   * 
   * @returns {Future<bool>} True if internet connection is available
   * 
   * @example
   * final isConnected = await connectivityProvider.checkConnectivity();
   * if (isConnected) {
   *   // Proceed with network operations
   * }
   */
  Future<bool> checkConnectivity() async {
    try {
      final bool isConnected = await _connectivityService.checkConnectivity();
      
      if (_isConnected != isConnected) {
        _isConnected = isConnected;
        _connectionType = _connectivityService.connectionType;
        _lastConnectionError = null;
        notifyListeners();
      }
      
      return isConnected;
    } catch (e) {
      _lastConnectionError = 'Failed to check connectivity: $e';
      debugPrint(_lastConnectionError);
      notifyListeners();
      return false;
    }
  }

  /**
   * Waits for an internet connection to become available.
   * 
   * This method is useful for implementing retry logic that waits for
   * connectivity to be restored before attempting network operations.
   * 
   * @param {Duration} timeout - Maximum time to wait for connection
   * @returns {Future<bool>} True if connection became available within timeout
   * 
   * @example
   * final connected = await connectivityProvider.waitForConnection(
   *   Duration(seconds: 30)
   * );
   * if (connected) {
   *   // Retry network operation
   * }
   */
  Future<bool> waitForConnection({Duration timeout = const Duration(seconds: 30)}) async {
    if (_isConnected) {
      return true;
    }

    final Completer<bool> completer = Completer<bool>();
    StreamSubscription<bool>? subscription;
    Timer? timeoutTimer;

    // Set up timeout
    timeoutTimer = Timer(timeout, () {
      if (!completer.isCompleted) {
        subscription?.cancel();
        completer.complete(false);
      }
    });

    // Listen for connection
    subscription = _connectivityService.connectionStream.listen((isConnected) {
      if (isConnected && !completer.isCompleted) {
        timeoutTimer?.cancel();
        subscription?.cancel();
        completer.complete(true);
      }
    });

    return completer.future;
  }

  /**
   * Gets connection status information for debugging or display purposes.
   * 
   * @returns {Map<String, dynamic>} Connection status information
   */
  Map<String, dynamic> getConnectionInfo() {
    return {
      'isConnected': _isConnected,
      'connectionType': _connectionType.toString(),
      'connectionTypeDescription': connectionTypeDescription,
      'isMetered': isMeteredConnection,
      'isInitialized': _isInitialized,
      'lastError': _lastConnectionError,
    };
  }

  /**
   * Clears any connection errors.
   * 
   * This method can be called to clear error states, typically after
   * the user has acknowledged an error or when retrying operations.
   */
  void clearError() {
    if (_lastConnectionError != null) {
      _lastConnectionError = null;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _connectionSubscription?.cancel();
    _connectionTypeSubscription?.cancel();
    super.dispose();
    debugPrint('ConnectivityProvider disposed');
  }
}