import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../features/authentication/domain/models/user.dart';

/// Secure storage service for sensitive data management
/// 
/// Provides encrypted storage for authentication tokens, user data,
/// and other sensitive information using Flutter Secure Storage.
/// 
/// All data is encrypted at rest and follows platform security best practices.
class SecureStorageService {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
    iOptions: IOSOptions(),
  );

  // Storage keys
  static const String _tokenKey = 'auth_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _userKey = 'current_user';
  static const String _serverUrlKey = 'server_url';

  /// Stores authentication tokens securely
  /// 
  /// @param token JWT access token
  /// @param refreshToken JWT refresh token for token renewal
  /// @throws StorageException when storage operation fails
  static Future<void> storeTokens(String token, String refreshToken) async {
    try {
      await Future.wait([
        _storage.write(key: _tokenKey, value: token),
        _storage.write(key: _refreshTokenKey, value: refreshToken),
      ]);
    } catch (e) {
      throw StorageException('Failed to store authentication tokens: $e');
    }
  }

  /// Retrieves stored access token
  /// 
  /// @returns Future&lt;String?&gt; Access token or null if not found
  static Future<String?> getToken() async {
    try {
      return await _storage.read(key: _tokenKey);
    } catch (e) {
      throw StorageException('Failed to retrieve access token: $e');
    }
  }

  /// Retrieves stored refresh token
  /// 
  /// @returns Future&lt;String?&gt; Refresh token or null if not found
  static Future<String?> getRefreshToken() async {
    try {
      return await _storage.read(key: _refreshTokenKey);
    } catch (e) {
      throw StorageException('Failed to retrieve refresh token: $e');
    }
  }

  /// Stores user information securely
  /// 
  /// @param user User object to store
  /// @throws StorageException when storage operation fails
  static Future<void> storeUser(User user) async {
    try {
      final userJson = jsonEncode(user.toJson());
      await _storage.write(key: _userKey, value: userJson);
    } catch (e) {
      throw StorageException('Failed to store user information: $e');
    }
  }

  /// Retrieves stored user information
  /// 
  /// @returns Future&lt;User?&gt; User object or null if not found
  /// @throws StorageException when deserialization fails
  static Future<User?> getUser() async {
    try {
      final userJson = await _storage.read(key: _userKey);
      if (userJson != null) {
        final userMap = jsonDecode(userJson) as Map<String, dynamic>;
        return User.fromJson(userMap);
      }
      return null;
    } catch (e) {
      throw StorageException('Failed to retrieve user information: $e');
    }
  }

  /// Stores server URL configuration
  /// 
  /// @param serverUrl Backend server URL
  /// @throws StorageException when storage operation fails
  static Future<void> storeServerUrl(String serverUrl) async {
    try {
      await _storage.write(key: _serverUrlKey, value: serverUrl);
    } catch (e) {
      throw StorageException('Failed to store server URL: $e');
    }
  }

  /// Retrieves stored server URL
  /// 
  /// @returns Future&lt;String?&gt; Server URL or null if not found
  static Future<String?> getServerUrl() async {
    try {
      return await _storage.read(key: _serverUrlKey);
    } catch (e) {
      throw StorageException('Failed to retrieve server URL: $e');
    }
  }

  /// Checks if authentication tokens exist
  /// 
  /// @returns Future&lt;bool&gt; True if both access and refresh tokens exist
  static Future<bool> hasTokens() async {
    try {
      final token = await _storage.read(key: _tokenKey);
      final refreshToken = await _storage.read(key: _refreshTokenKey);
      return token != null && refreshToken != null;
    } catch (e) {
      return false;
    }
  }

  /// Clears all stored authentication data
  /// 
  /// Removes tokens, user information, but preserves server configuration.
  /// @throws StorageException when clear operation fails
  static Future<void> clearAuthData() async {
    try {
      await Future.wait([
        _storage.delete(key: _tokenKey),
        _storage.delete(key: _refreshTokenKey),
        _storage.delete(key: _userKey),
      ]);
    } catch (e) {
      throw StorageException('Failed to clear authentication data: $e');
    }
  }

  /// Clears all stored data including server configuration
  /// 
  /// Complete reset of all secure storage data.
  /// @throws StorageException when clear operation fails
  static Future<void> clearAll() async {
    try {
      await _storage.deleteAll();
    } catch (e) {
      throw StorageException('Failed to clear all storage data: $e');
    }
  }

  /// Gets all stored keys (for debugging purposes)
  /// 
  /// @returns Future&lt;Map&lt;String, String&gt;&gt; All stored key-value pairs
  /// Note: Only use in development/debugging
  static Future<Map<String, String>> getAllData() async {
    try {
      return await _storage.readAll();
    } catch (e) {
      throw StorageException('Failed to read all storage data: $e');
    }
  }
}

/// Exception thrown when secure storage operations fail
class StorageException implements Exception {
  final String message;
  
  const StorageException(this.message);
  
  @override
  String toString() => 'StorageException: $message';
}