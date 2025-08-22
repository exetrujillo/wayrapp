import 'package:flutter/material.dart';

import '../../../../core/errors/error_handler.dart';
import '../../domain/models/server_config.dart';
import '../../data/repositories/server_repository.dart';

/// Provider for managing server configuration and connection
class ServerConfigProvider extends ChangeNotifier {
  final ServerRepository _serverRepository;
  
  ServerConfig? _currentConfig;
  bool _isLoading = false;
  String? _error;
  List<ServerConfig> _predefinedServers = [];

  ServerConfig? get currentConfig => _currentConfig;
  String? get serverUrl => _currentConfig?.url;
  bool get isConnected => _currentConfig?.status.isConnected ?? false;
  bool get isLoading => _isLoading;
  String? get error => _error;
  List<ServerConfig> get predefinedServers => _predefinedServers;

  ServerConfigProvider({ServerRepository? serverRepository}) 
      : _serverRepository = serverRepository ?? ServerRepositoryImpl() {
    _loadPredefinedServers();
    _loadSavedServer();
  }

  /// Load predefined server configurations
  void _loadPredefinedServers() {
    _predefinedServers = _serverRepository.getPredefinedServers();
  }

  /// Load previously saved server configuration
  Future<void> _loadSavedServer() async {
    try {
      final savedConfig = await _serverRepository.loadServerConfig();
      
      if (savedConfig != null) {
        _currentConfig = savedConfig;
        // Test connection to saved server
        await testConnection(savedConfig.url);
      }
    } catch (e) {
      _setError('Failed to load saved server configuration');
    }
  }

  /// Set server configuration and test connection
  Future<void> setServerConfig(ServerConfig config) async {
    _setLoading(true);
    _clearError();

    try {
      // Update config with testing status
      _currentConfig = config.copyWith(
        status: ServerStatus.testing,
        lastConnected: DateTime.now(),
      );
      notifyListeners();
      
      // Test connection to server
      final isConnected = await _serverRepository.testConnection(config.url);
      
      if (isConnected) {
        _currentConfig = _currentConfig!.copyWith(
          status: ServerStatus.connected,
          lastConnected: DateTime.now(),
        );
        
        // Save server configuration
        await _serverRepository.saveServerConfig(_currentConfig!);
      } else {
        _currentConfig = _currentConfig!.copyWith(status: ServerStatus.error);
        _setError('Failed to connect to server. Please check the URL and try again.');
      }
    } catch (e) {
      _currentConfig = _currentConfig?.copyWith(status: ServerStatus.error);
      _setError('Failed to connect to server: ${ErrorHandler.getErrorMessage(e)}');
    } finally {
      _setLoading(false);
    }
  }

  /// Set server URL and test connection (backward compatibility)
  Future<void> setServer(String url) async {
    final config = ServerConfig.custom(url: url);
    await setServerConfig(config);
  }

  /// Test connection to server using health check endpoint
  Future<bool> testConnection(String url) async {
    try {
      return await _serverRepository.testConnection(url);
    } catch (e) {
      return false;
    }
  }

  /// Get server health information
  Future<Map<String, dynamic>?> getServerHealth(String url) async {
    try {
      return await _serverRepository.getServerHealth(url);
    } catch (e) {
      return null;
    }
  }

  /// Clear server configuration
  Future<void> clearServer() async {
    try {
      await _serverRepository.clearServerConfig();
      _currentConfig = null;
      _clearError();
      notifyListeners();
    } catch (e) {
      _setError('Failed to clear server configuration');
    }
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
    notifyListeners();
  }
}