/// Connectivity Service for managing network state and connectivity monitoring.
/// 
/// This service provides real-time network connectivity monitoring using the
/// connectivity_plus package. It tracks connection status, connection type,
/// and provides utilities for handling offline scenarios.
/// 
/// @module ConnectivityService
/// @category Network
/// @author Exequiel Trujillo
/// @since 1.0.0
/// 
/// @example
/// ```dart
/// // Initialize and listen to connectivity changes
/// final connectivityService = ConnectivityService();
/// connectivityService.connectionStream.listen((isConnected) {
///   print('Connection status: $isConnected');
/// });
/// ```
library;

import 'dart:async';
import 'dart:io';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';

/// Enum representing different types of network connections
enum NetworkConnectionType {
  /// No network connection available
  none,
  /// Mobile data connection (cellular)
  mobile,
  /// WiFi connection
  wifi,
  /// Ethernet connection (desktop/web)
  ethernet,
  /// VPN connection
  vpn,
  /// Bluetooth connection
  bluetooth,
  /// Other connection type
  other,
}

/// Service class for managing network connectivity state and monitoring
class ConnectivityService {
  static ConnectivityService? _instance;
  static ConnectivityService get instance => _instance ??= ConnectivityService._internal();
  
  ConnectivityService._internal();

  final Connectivity _connectivity = Connectivity();
  final StreamController<bool> _connectionController = StreamController<bool>.broadcast();
  final StreamController<NetworkConnectionType> _connectionTypeController = 
      StreamController<NetworkConnectionType>.broadcast();
  
  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;
  bool _isConnected = false;
  NetworkConnectionType _connectionType = NetworkConnectionType.none;

  /// Stream that emits boolean values indicating connection status
  Stream<bool> get connectionStream => _connectionController.stream;
  
  /// Stream that emits the current connection type
  Stream<NetworkConnectionType> get connectionTypeStream => _connectionTypeController.stream;
  
  /// Current connection status
  bool get isConnected => _isConnected;
  
  /// Current connection type
  NetworkConnectionType get connectionType => _connectionType;

  /// Initializes the connectivity service and starts monitoring network changes.
  /// 
  /// This method should be called once during app initialization to start
  /// monitoring network connectivity changes.
  /// 
  /// Returns a Future that completes when initialization is finished
  /// 
  /// Example:
  /// ```dart
  /// await ConnectivityService.instance.initialize();
  /// ```
  Future<void> initialize() async {
    try {
      // Check initial connectivity status
      await _checkInitialConnectivity();
      
      // Start listening to connectivity changes
      _connectivitySubscription = _connectivity.onConnectivityChanged.listen(
        _onConnectivityChanged,
        onError: (Object error) {
          debugPrint('Connectivity service error: $error');
        },
      );
      
      debugPrint('ConnectivityService initialized successfully');
    } catch (e) {
      debugPrint('Failed to initialize ConnectivityService: $e');
    }
  }

  /// Checks the initial connectivity status when the service starts.
  /// 
  /// Returns a Future that completes when initial check is finished
  Future<void> _checkInitialConnectivity() async {
    try {
      final List<ConnectivityResult> connectivityResults = await _connectivity.checkConnectivity();
      await _onConnectivityChanged(connectivityResults);
    } catch (e) {
      debugPrint('Failed to check initial connectivity: $e');
      _updateConnectionStatus(false, NetworkConnectionType.none);
    }
  }

  /// Handles connectivity changes and updates the connection status.
  /// 
  /// [connectivityResults] List of connectivity results
  /// Returns a Future that completes when connectivity change is processed
  Future<void> _onConnectivityChanged(List<ConnectivityResult> connectivityResults) async {
    if (connectivityResults.isEmpty) {
      _updateConnectionStatus(false, NetworkConnectionType.none);
      return;
    }

    // Get the primary connection type (first in the list)
    final ConnectivityResult primaryResult = connectivityResults.first;
    final NetworkConnectionType connectionType = _mapConnectivityResult(primaryResult);
    
    // Check if we have any actual internet connectivity
    final bool hasInternetConnection = await _hasInternetConnection();
    
    _updateConnectionStatus(hasInternetConnection, connectionType);
  }

  /// Maps ConnectivityResult to NetworkConnectionType.
  /// 
  /// [result] The connectivity result to map
  /// Returns the corresponding network connection type
  NetworkConnectionType _mapConnectivityResult(ConnectivityResult result) {
    switch (result) {
      case ConnectivityResult.none:
        return NetworkConnectionType.none;
      case ConnectivityResult.mobile:
        return NetworkConnectionType.mobile;
      case ConnectivityResult.wifi:
        return NetworkConnectionType.wifi;
      case ConnectivityResult.ethernet:
        return NetworkConnectionType.ethernet;
      case ConnectivityResult.vpn:
        return NetworkConnectionType.vpn;
      case ConnectivityResult.bluetooth:
        return NetworkConnectionType.bluetooth;
      case ConnectivityResult.other:
        return NetworkConnectionType.other;
    }
  }

  /// Tests actual internet connectivity by attempting to reach a reliable host.
  /// 
  /// This method performs a real connectivity test rather than just checking
  /// if the device is connected to a network, as devices can be connected to
  /// networks without internet access.
  /// 
  /// Returns true if internet connection is available
  Future<bool> _hasInternetConnection() async {
    try {
      // Try to connect to Google's DNS server (reliable and fast)
      final result = await InternetAddress.lookup('google.com')
          .timeout(const Duration(seconds: 5));
      
      return result.isNotEmpty && result[0].rawAddress.isNotEmpty;
    } catch (e) {
      debugPrint('Internet connectivity test failed: $e');
      return false;
    }
  }

  /// Updates the connection status and notifies listeners.
  /// 
  /// [isConnected] Whether the device is connected to the internet
  /// [connectionType] The type of network connection
  void _updateConnectionStatus(bool isConnected, NetworkConnectionType connectionType) {
    final bool statusChanged = _isConnected != isConnected;
    final bool typeChanged = _connectionType != connectionType;
    
    _isConnected = isConnected;
    _connectionType = connectionType;
    
    if (statusChanged) {
      _connectionController.add(_isConnected);
      debugPrint('Connection status changed: $_isConnected');
    }
    
    if (typeChanged) {
      _connectionTypeController.add(_connectionType);
      debugPrint('Connection type changed: $_connectionType');
    }
  }

  /// Manually checks the current connectivity status.
  /// 
  /// This method can be used to force a connectivity check, useful for
  /// retry scenarios or when the app comes back to foreground.
  /// 
  /// Returns true if internet connection is available
  /// 
  /// Example:
  /// ```dart
  /// final isConnected = await ConnectivityService.instance.checkConnectivity();
  /// if (isConnected) {
  ///   // Proceed with network operations
  /// }
  /// ```
  Future<bool> checkConnectivity() async {
    try {
      final List<ConnectivityResult> connectivityResults = await _connectivity.checkConnectivity();
      await _onConnectivityChanged(connectivityResults);
      return _isConnected;
    } catch (e) {
      debugPrint('Manual connectivity check failed: $e');
      return false;
    }
  }

  /// Gets a human-readable description of the current connection type.
  /// 
  /// Returns description of the current connection type
  String getConnectionTypeDescription() {
    switch (_connectionType) {
      case NetworkConnectionType.none:
        return 'No connection';
      case NetworkConnectionType.mobile:
        return 'Mobile data';
      case NetworkConnectionType.wifi:
        return 'WiFi';
      case NetworkConnectionType.ethernet:
        return 'Ethernet';
      case NetworkConnectionType.vpn:
        return 'VPN';
      case NetworkConnectionType.bluetooth:
        return 'Bluetooth';
      case NetworkConnectionType.other:
        return 'Other connection';
    }
  }

  /// Checks if the current connection is metered (mobile data).
  /// 
  /// This can be useful for determining whether to perform data-intensive
  /// operations like downloading course content.
  /// 
  /// Returns true if the connection is metered (mobile data)
  bool isMeteredConnection() {
    return _connectionType == NetworkConnectionType.mobile;
  }

  /// Disposes of the connectivity service and cleans up resources.
  /// 
  /// This method should be called when the service is no longer needed
  /// to prevent memory leaks.
  void dispose() {
    _connectivitySubscription?.cancel();
    _connectionController.close();
    _connectionTypeController.close();
    debugPrint('ConnectivityService disposed');
  }
}