import 'package:flutter/material.dart';

import '../../../../core/errors/error_handler.dart';
import '../../domain/models/server_config.dart';
import '../../data/repositories/server_repository.dart';
import '../../../../shared/providers/connectivity_provider.dart';
import '../../../../shared/services/local_storage_service.dart' as storage;

/// Provider for managing server configuration and connection with network awareness
class ServerConfigProvider extends ChangeNotifier {
  final ServerRepository _serverRepository;
  final ConnectivityProvider? _connectivityProvider;
  final storage.LocalStorageService _localStorageService;
  
  ServerConfig? _currentConfig;
  bool _isLoading = false;
  String? _error;
  List<ServerConfig> _predefinedServers = [];
  List<ServerConfig> _serverHistory = [];

  ServerConfig? get currentConfig => _currentConfig;
  String? get serverUrl => _currentConfig?.url;
  bool get isConnected => _currentConfig?.status.isConnected ?? false;
  bool get isLoading => _isLoading;
  String? get error => _error;
  List<ServerConfig> get predefinedServers => _predefinedServers;
  List<ServerConfig> get serverHistory => _serverHistory;
  bool get isOnline => _connectivityProvider?.isConnected ?? true;

  ServerConfigProvider({
    ServerRepository? serverRepository,
    ConnectivityProvider? connectivityProvider,
    storage.LocalStorageService? localStorageService,
  }) : _serverRepository = serverRepository ?? ServerRepositoryImpl(),
       _connectivityProvider = connectivityProvider,
       _localStorageService = localStorageService ?? storage.LocalStorageService.instance {
    _loadPredefinedServers();
    _loadSavedServer();
    _loadServerHistory();
  }

  /// Load predefined server configurations
  void _loadPredefinedServers() {
    _predefinedServers = _serverRepository.getPredefinedServers();
  }

  /// Load previously saved server configuration
  Future<void> _loadSavedServer() async {
    try {
      // Try to load from local storage service first
      final savedConfig = await _localStorageService.getServerConfig();
      
      if (savedConfig != null) {
        _currentConfig = ServerConfig(
          url: savedConfig.url,
          name: savedConfig.name,
          status: ServerStatus.disconnected,
          lastConnected: savedConfig.lastConnected,
        );
        
        // Test connection to saved server if online
        if (isOnline) {
          await testConnection(savedConfig.url);
        } else {
          _currentConfig = _currentConfig!.copyWith(status: ServerStatus.offline);
          notifyListeners();
        }
      } else {
        // Fallback to repository method for backward compatibility
        final repoConfig = await _serverRepository.loadServerConfig();
        if (repoConfig != null) {
          _currentConfig = repoConfig;
          if (isOnline) {
            await testConnection(repoConfig.url);
          } else {
            _currentConfig = _currentConfig!.copyWith(status: ServerStatus.offline);
            notifyListeners();
          }
        }
      }
    } catch (e) {
      _setError('Failed to load saved server configuration');
    }
  }

  /// Load server history from local storage
  Future<void> _loadServerHistory() async {
    try {
      final history = await _localStorageService.getServerHistory();
      _serverHistory = history.map((config) => ServerConfig(
        url: config.url,
        name: config.name,
        status: ServerStatus.disconnected,
        lastConnected: config.lastConnected,
      )).toList();
      notifyListeners();
    } catch (e) {
      debugPrint('Failed to load server history: $e');
    }
  }

  /// Set server configuration and test connection
  Future<void> setServerConfig(ServerConfig config) async {
    _setLoading(true);
    _clearError();

    try {
      if (!isOnline) {
        // Store server config for when connection is restored
        await _storeServerConfigLocally(config);
        _currentConfig = config.copyWith(status: ServerStatus.offline);
        _setError('No internet connection. Server will be tested when connection is restored.');
        return;
      }

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
        
        // Save server configuration to both repository and local storage
        await _serverRepository.saveServerConfig(_currentConfig!);
        await _storeServerConfigLocally(_currentConfig!);
        
      } else {
        _currentConfig = _currentConfig!.copyWith(status: ServerStatus.error);
        _setError('Failed to connect to server. Please check the URL and try again.');
      }
    } catch (e) {
      _currentConfig = _currentConfig?.copyWith(status: ServerStatus.error);
      if (!isOnline) {
        _setError('No internet connection. Please connect and try again.');
      } else {
        _setError('Failed to connect to server: ${ErrorHandler.getErrorMessage(e)}');
      }
    } finally {
      _setLoading(false);
    }
  }

  /// Store server configuration locally
  Future<void> _storeServerConfigLocally(ServerConfig config) async {
    try {
      final localConfig = storage.ServerConfig(
        url: config.url,
        name: config.name,
        isSelected: true,
        lastConnected: config.lastConnected,
      );
      
      await _localStorageService.storeServerConfig(localConfig);
      await _loadServerHistory(); // Refresh history
    } catch (e) {
      debugPrint('Failed to store server config locally: $e');
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
      if (!isOnline) {
        return false;
      }
      return await _serverRepository.testConnection(url);
    } catch (e) {
      return false;
    }
  }

  /// Retry connection to current server
  Future<void> retryConnection() async {
    if (_currentConfig != null) {
      await setServerConfig(_currentConfig!);
    }
  }

  /// Check connection status when network becomes available
  Future<void> onNetworkRestored() async {
    if (_currentConfig != null && _currentConfig!.status == ServerStatus.offline) {
      await testConnection(_currentConfig!.url);
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
      await _localStorageService.clearServerData();
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