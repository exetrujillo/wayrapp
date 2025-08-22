import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/errors/exceptions.dart';
import '../../domain/models/server_config.dart';

/// Repository interface for server configuration and connection testing
abstract class ServerRepository {
  /// Test connection to a server
  Future<bool> testConnection(String serverUrl);
  
  /// Get server health information
  Future<Map<String, dynamic>> getServerHealth(String serverUrl);
  
  /// Save server configuration
  Future<void> saveServerConfig(ServerConfig config);
  
  /// Load saved server configuration
  Future<ServerConfig?> loadServerConfig();
  
  /// Clear saved server configuration
  Future<void> clearServerConfig();
  
  /// Get list of predefined server configurations
  List<ServerConfig> getPredefinedServers();
}

/// Implementation of ServerRepository for managing server connections
class ServerRepositoryImpl implements ServerRepository {
  static const String _serverConfigKey = 'server_config';
  
  @override
  Future<bool> testConnection(String serverUrl) async {
    try {
      final health = await getServerHealth(serverUrl);
      
      // Check if server responded with valid health data
      return health.containsKey('status') && 
             (health['status'] == 'healthy' || health['status'] == 'degraded');
    } catch (e) {
      return false;
    }
  }

  @override
  Future<Map<String, dynamic>> getServerHealth(String serverUrl) async {
    final dio = Dio(BaseOptions(
      baseUrl: _formatUrl(serverUrl),
      connectTimeout: const Duration(milliseconds: AppConstants.connectionTimeout),
      receiveTimeout: const Duration(milliseconds: AppConstants.receiveTimeout),
      // Accept both 200 (healthy) and 503 (degraded) as valid responses
      validateStatus: (status) => status != null && (status == 200 || status == 503),
    ));

    try {
      final response = await dio.get<Map<String, dynamic>>(AppConstants.healthCheckEndpoint);
      
      if (response.data != null) {
        return response.data!;
      } else {
        throw const ServerException('Invalid health response format');
      }
    } on DioException catch (e) {
      throw _handleDioException(e);
    }
  }

  @override
  Future<void> saveServerConfig(ServerConfig config) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final configJson = jsonEncode(config.toJson());
      await prefs.setString(_serverConfigKey, configJson);
      
      // Also save the URL separately for backward compatibility
      await prefs.setString(AppConstants.serverUrlKey, config.url);
    } catch (e) {
      throw const ServerException('Failed to save server configuration');
    }
  }

  @override
  Future<ServerConfig?> loadServerConfig() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final configJson = prefs.getString(_serverConfigKey);
      
      if (configJson != null) {
        final configMap = jsonDecode(configJson) as Map<String, dynamic>;
        return ServerConfig.fromJson(configMap);
      }
      
      // Fallback: check for legacy server URL storage
      final legacyUrl = prefs.getString(AppConstants.serverUrlKey);
      if (legacyUrl != null) {
        return ServerConfig.custom(url: legacyUrl);
      }
      
      return null;
    } catch (e) {
      // If there's an error loading config, return null to use defaults
      return null;
    }
  }

  @override
  Future<void> clearServerConfig() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await Future.wait([
        prefs.remove(_serverConfigKey),
        prefs.remove(AppConstants.serverUrlKey),
      ]);
    } catch (e) {
      throw const ServerException('Failed to clear server configuration');
    }
  }

  @override
  List<ServerConfig> getPredefinedServers() {
    return [
      ServerConfig.defaultServer(),
      const ServerConfig(
        url: 'https://wayrapp-staging.vercel.app',
        name: 'Staging Server',
        isDefault: false,
        status: ServerStatus.unknown,
      ),
      const ServerConfig(
        url: 'http://localhost:3000',
        name: 'Local Development',
        isDefault: false,
        status: ServerStatus.unknown,
      ),
    ];
  }

  /// Format URL to ensure it has proper protocol
  String _formatUrl(String url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'https://$url';
    }
    return url;
  }

  /// Convert DioException to appropriate AppException
  AppException _handleDioException(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return const NetworkException('Connection timeout. Please check your internet connection.');
      
      case DioExceptionType.badResponse:
        final statusCode = e.response?.statusCode;
        final responseData = e.response?.data;
        final message = (responseData is Map<String, dynamic> ? responseData['message'] as String? : null) ?? 'Server error occurred';
        
        if (statusCode == 404) {
          return const ServerException('Server not found. Please check the URL.');
        } else if (statusCode != null && statusCode >= 500) {
          return ServerException('Server error. Please try again later.', statusCode: statusCode);
        } else {
          return ServerException(message, statusCode: statusCode);
        }
      
      case DioExceptionType.cancel:
        return const NetworkException('Connection test was cancelled');
      
      case DioExceptionType.unknown:
        return const NetworkException('Network error. Please check your connection.');
      
      default:
        return const NetworkException('An unexpected error occurred during connection test');
    }
  }
}