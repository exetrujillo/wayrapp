///
/// Local Storage Service for caching server configuration and user data.
/// 
/// This service provides a unified interface for storing and retrieving
/// application data locally. It handles both secure storage (for sensitive data)
/// and regular shared preferences (for non-sensitive configuration data).
/// 
/// @module LocalStorageService
/// @category Services
/// @author Exequiel Trujillo
/// @since 1.0.0
/// 
/// @example
/// // Store server configuration
/// final storageService = LocalStorageService.instance;
/// await storageService.storeServerConfig(ServerConfig(
///   url: 'https://api.wayrapp.com',
///   name: 'Production Server',
/// ));
///

import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Data class representing server configuration
class ServerConfig {
  /// Server URL
  final String url;
  
  /// Display name for the server
  final String name;
  
  /// Whether this server is currently selected
  final bool isSelected;
  
  /// Last successful connection timestamp
  final DateTime? lastConnected;
  
  /// Server version information
  final String? version;
  
  /// Additional server metadata
  final Map<String, dynamic>? metadata;

  const ServerConfig({
    required this.url,
    required this.name,
    this.isSelected = false,
    this.lastConnected,
    this.version,
    this.metadata,
  });

  factory ServerConfig.fromJson(Map<String, dynamic> json) {
    return ServerConfig(
      url: json['url'] as String,
      name: json['name'] as String,
      isSelected: json['isSelected'] as bool? ?? false,
      lastConnected: json['lastConnected'] != null 
          ? DateTime.parse(json['lastConnected'] as String) : null,
      version: json['version'] as String?,
      metadata: json['metadata'] != null 
          ? Map<String, dynamic>.from(json['metadata'] as Map) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'url': url,
      'name': name,
      'isSelected': isSelected,
      'lastConnected': lastConnected?.toIso8601String(),
      'version': version,
      'metadata': metadata,
    };
  }

  ServerConfig copyWith({
    String? url,
    String? name,
    bool? isSelected,
    DateTime? lastConnected,
    String? version,
    Map<String, dynamic>? metadata,
  }) {
    return ServerConfig(
      url: url ?? this.url,
      name: name ?? this.name,
      isSelected: isSelected ?? this.isSelected,
      lastConnected: lastConnected ?? this.lastConnected,
      version: version ?? this.version,
      metadata: metadata ?? this.metadata,
    );
  }
}

/// Data class representing cached user data
class CachedUserData {
  /// User ID
  final String id;
  
  /// User email
  final String email;
  
  /// User display name
  final String? name;
  
  /// User role
  final String role;
  
  /// User preferences
  final Map<String, dynamic>? preferences;
  
  /// Last sync timestamp
  final DateTime lastSynced;
  
  /// User progress data
  final Map<String, dynamic>? progressData;

  const CachedUserData({
    required this.id,
    required this.email,
    this.name,
    required this.role,
    this.preferences,
    required this.lastSynced,
    this.progressData,
  });

  factory CachedUserData.fromJson(Map<String, dynamic> json) {
    return CachedUserData(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String?,
      role: json['role'] as String,
      preferences: json['preferences'] != null 
          ? Map<String, dynamic>.from(json['preferences'] as Map) : null,
      lastSynced: DateTime.parse(json['lastSynced'] as String),
      progressData: json['progressData'] != null 
          ? Map<String, dynamic>.from(json['progressData'] as Map) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'role': role,
      'preferences': preferences,
      'lastSynced': lastSynced.toIso8601String(),
      'progressData': progressData,
    };
  }
}

/// Service for managing local storage of application data
class LocalStorageService {
  static LocalStorageService? _instance;
  static LocalStorageService get instance => _instance ??= LocalStorageService._internal();
  
  LocalStorageService._internal();

  // Storage keys
  static const String _serverConfigKey = 'server_config';
  static const String _serverHistoryKey = 'server_history';
  static const String _userDataKey = 'cached_user_data';
  static const String _appPreferencesKey = 'app_preferences';
  static const String _courseDataKey = 'cached_course_data';
  static const String _progressDataKey = 'cached_progress_data';
  static const String _lastSyncKey = 'last_sync_timestamp';

  // Secure storage instance
  static const FlutterSecureStorage _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
    iOptions: IOSOptions(),
  );

  SharedPreferences? _prefs;

  ///
  /// Initializes the local storage service.
  ///
  /// @returns {Future<void>} Completes when initialization is finished
  ///
  Future<void> initialize() async {
    try {
      _prefs = await SharedPreferences.getInstance();
      debugPrint('LocalStorageService initialized successfully');
    } catch (e) {
      debugPrint('Failed to initialize LocalStorageService: $e');
      rethrow;
    }
  }

  ///
  /// Ensures SharedPreferences is initialized.
  ///
  Future<SharedPreferences> _getPrefs() async {
    return _prefs ??= await SharedPreferences.getInstance();
  }

  // Server Configuration Methods

  ///
  /// Stores server configuration.
  /// 
  /// @param {ServerConfig} config - Server configuration to store
  /// @returns {Future<void>} Completes when configuration is stored
  ///
  Future<void> storeServerConfig(ServerConfig config) async {
    try {
      final prefs = await _getPrefs();
      final configJson = jsonEncode(config.toJson());
      await prefs.setString(_serverConfigKey, configJson);
      
      // Also add to server history
      await _addToServerHistory(config);
      
      debugPrint('Stored server configuration: ${config.name}');
    } catch (e) {
      debugPrint('Failed to store server configuration: $e');
      rethrow;
    }
  }

  ///
  /// Retrieves the current server configuration.
  /// 
  /// @returns {Future<ServerConfig?>} The stored server configuration, or null if none exists
  ///
  Future<ServerConfig?> getServerConfig() async {
    try {
      final prefs = await _getPrefs();
      final configJson = prefs.getString(_serverConfigKey);
      
      if (configJson != null) {
        final configMap = jsonDecode(configJson) as Map<String, dynamic>;
        return ServerConfig.fromJson(configMap);
      }
      
      return null;
    } catch (e) {
      debugPrint('Failed to retrieve server configuration: $e');
      return null;
    }
  }

  ///
  /// Adds a server configuration to the history.
  ///
  Future<void> _addToServerHistory(ServerConfig config) async {
    try {
      final prefs = await _getPrefs();
      final historyJson = prefs.getString(_serverHistoryKey);
      
      List<ServerConfig> history = [];
      if (historyJson != null) {
        final historyList = jsonDecode(historyJson) as List<dynamic>;
        history = historyList.map((json) => ServerConfig.fromJson(json as Map<String, dynamic>)).toList();
      }
      
      // Remove existing entry with same URL
      history.removeWhere((server) => server.url == config.url);
      
      // Add new entry at the beginning
      history.insert(0, config);
      
      // Keep only last 10 entries
      if (history.length > 10) {
        history = history.take(10).toList();
      }
      
      // Save updated history
      final updatedHistoryJson = jsonEncode(history.map((s) => s.toJson()).toList());
      await prefs.setString(_serverHistoryKey, updatedHistoryJson);
    } catch (e) {
      debugPrint('Failed to add server to history: $e');
    }
  }

  ///
  /// Retrieves server configuration history.
  /// 
  /// @returns {Future<List<ServerConfig>>} List of previously used server configurations
  ///
  Future<List<ServerConfig>> getServerHistory() async {
    try {
      final prefs = await _getPrefs();
      final historyJson = prefs.getString(_serverHistoryKey);
      
      if (historyJson != null) {
        final historyList = jsonDecode(historyJson) as List<dynamic>;
        return historyList.map((json) => ServerConfig.fromJson(json as Map<String, dynamic>)).toList();
      }
      
      return [];
    } catch (e) {
      debugPrint('Failed to retrieve server history: $e');
      return [];
    }
  }

  ///
  /// Clears server configuration and history.
  /// 
  /// @returns {Future<void>} Completes when server data is cleared
  ///
  Future<void> clearServerData() async {
    try {
      final prefs = await _getPrefs();
      await Future.wait([
        prefs.remove(_serverConfigKey),
        prefs.remove(_serverHistoryKey),
      ]);
      debugPrint('Cleared server configuration data');
    } catch (e) {
      debugPrint('Failed to clear server data: $e');
    }
  }

  // User Data Methods

  ///
  /// Stores cached user data securely.
  /// 
  /// @param {CachedUserData} userData - User data to cache
  /// @returns {Future<void>} Completes when user data is stored
  ///
  Future<void> storeCachedUserData(CachedUserData userData) async {
    try {
      final userDataJson = jsonEncode(userData.toJson());
      await _secureStorage.write(key: _userDataKey, value: userDataJson);
      debugPrint('Stored cached user data for user: ${userData.id}');
    } catch (e) {
      debugPrint('Failed to store cached user data: $e');
      rethrow;
    }
  }

  ///
  /// Retrieves cached user data.
  /// 
  /// @returns {Future<CachedUserData?>} The cached user data, or null if none exists
  ///
  Future<CachedUserData?> getCachedUserData() async {
    try {
      final userDataJson = await _secureStorage.read(key: _userDataKey);
      
      if (userDataJson != null) {
        final userDataMap = jsonDecode(userDataJson) as Map<String, dynamic>;
        return CachedUserData.fromJson(userDataMap);
      }
      
      return null;
    } catch (e) {
      debugPrint('Failed to retrieve cached user data: $e');
      return null;
    }
  }

  ///
  /// Clears cached user data.
  /// 
  /// @returns {Future<void>} Completes when user data is cleared
  ///
  Future<void> clearCachedUserData() async {
    try {
      await _secureStorage.delete(key: _userDataKey);
      debugPrint('Cleared cached user data');
    } catch (e) {
      debugPrint('Failed to clear cached user data: $e');
    }
  }

  // App Preferences Methods

  ///
  /// Stores application preferences.
  /// 
  /// @param {Map<String, dynamic>} preferences - Application preferences to store
  /// @returns {Future<void>} Completes when preferences are stored
  ///
  Future<void> storeAppPreferences(Map<String, dynamic> preferences) async {
    try {
      final prefs = await _getPrefs();
      final preferencesJson = jsonEncode(preferences);
      await prefs.setString(_appPreferencesKey, preferencesJson);
      debugPrint('Stored application preferences');
    } catch (e) {
      debugPrint('Failed to store application preferences: $e');
      rethrow;
    }
  }

  ///
  /// Retrieves application preferences.
  /// 
  /// @returns {Future<Map<String, dynamic>>} The stored preferences, or empty map if none exist
  ///
  Future<Map<String, dynamic>> getAppPreferences() async {
    try {
      final prefs = await _getPrefs();
      final preferencesJson = prefs.getString(_appPreferencesKey);
      
      if (preferencesJson != null) {
        return Map<String, dynamic>.from(jsonDecode(preferencesJson) as Map);
      }
      
      return {};
    } catch (e) {
      debugPrint('Failed to retrieve application preferences: $e');
      return {};
    }
  }

  ///
  /// Updates a specific preference value.
  /// 
  /// @param {String} key - Preference key
  /// @param {dynamic} value - Preference value
  /// @returns {Future<void>} Completes when preference is updated
  ///
  Future<void> updatePreference(String key, dynamic value) async {
    try {
      final preferences = await getAppPreferences();
      preferences[key] = value;
      await storeAppPreferences(preferences);
    } catch (e) {
      debugPrint('Failed to update preference $key: $e');
      rethrow;
    }
  }

  // Course Data Methods

  ///
  /// Stores cached course data.
  /// 
  /// @param {String} courseId - Course identifier
  /// @param {Map<String, dynamic>} courseData - Course data to cache
  /// @returns {Future<void>} Completes when course data is stored
  ///
  Future<void> storeCachedCourseData(String courseId, Map<String, dynamic> courseData) async {
    try {
      final prefs = await _getPrefs();
      final key = '${_courseDataKey}_$courseId';
      final courseDataJson = jsonEncode(courseData);
      await prefs.setString(key, courseDataJson);
      debugPrint('Stored cached course data for course: $courseId');
    } catch (e) {
      debugPrint('Failed to store cached course data: $e');
      rethrow;
    }
  }

  ///
  /// Retrieves cached course data.
  /// 
  /// @param {String} courseId - Course identifier
  /// @returns {Future<Map<String, dynamic>?>} The cached course data, or null if none exists
  ///
  Future<Map<String, dynamic>?> getCachedCourseData(String courseId) async {
    try {
      final prefs = await _getPrefs();
      final key = '${_courseDataKey}_$courseId';
      final courseDataJson = prefs.getString(key);
      
      if (courseDataJson != null) {
        return Map<String, dynamic>.from(jsonDecode(courseDataJson) as Map);
      }
      
      return null;
    } catch (e) {
      debugPrint('Failed to retrieve cached course data: $e');
      return null;
    }
  }

  ///
  /// Clears cached course data for a specific course.
  /// 
  /// @param {String} courseId - Course identifier
  /// @returns {Future<void>} Completes when course data is cleared
  ///
  Future<void> clearCachedCourseData(String courseId) async {
    try {
      final prefs = await _getPrefs();
      final key = '${_courseDataKey}_$courseId';
      await prefs.remove(key);
      debugPrint('Cleared cached course data for course: $courseId');
    } catch (e) {
      debugPrint('Failed to clear cached course data: $e');
    }
  }

  // Progress Data Methods

  ///
  /// Stores cached progress data.
  /// 
  /// @param {Map<String, dynamic>} progressData - Progress data to cache
  /// @returns {Future<void>} Completes when progress data is stored
  ///
  Future<void> storeCachedProgressData(Map<String, dynamic> progressData) async {
    try {
      final progressDataJson = jsonEncode(progressData);
      await _secureStorage.write(key: _progressDataKey, value: progressDataJson);
      debugPrint('Stored cached progress data');
    } catch (e) {
      debugPrint('Failed to store cached progress data: $e');
      rethrow;
    }
  }

  ///
  /// Retrieves cached progress data.
  /// 
  /// @returns {Future<Map<String, dynamic>>} The cached progress data, or empty map if none exists
  ///
  Future<Map<String, dynamic>> getCachedProgressData() async {
    try {
      final progressDataJson = await _secureStorage.read(key: _progressDataKey);
      
      if (progressDataJson != null) {
        return Map<String, dynamic>.from(jsonDecode(progressDataJson) as Map);
      }
      
      return {};
    } catch (e) {
      debugPrint('Failed to retrieve cached progress data: $e');
      return {};
    }
  }

  ///
  /// Clears cached progress data.
  /// 
  /// @returns {Future<void>} Completes when progress data is cleared
  ///
  Future<void> clearCachedProgressData() async {
    try {
      await _secureStorage.delete(key: _progressDataKey);
      debugPrint('Cleared cached progress data');
    } catch (e) {
      debugPrint('Failed to clear cached progress data: $e');
    }
  }

  // Sync Management Methods

  ///
  /// Updates the last sync timestamp.
  /// 
  /// @param {DateTime} timestamp - The sync timestamp
  /// @returns {Future<void>} Completes when timestamp is updated
  ///
  Future<void> updateLastSyncTimestamp(DateTime timestamp) async {
    try {
      final prefs = await _getPrefs();
      await prefs.setString(_lastSyncKey, timestamp.toIso8601String());
    } catch (e) {
      debugPrint('Failed to update last sync timestamp: $e');
    }
  }

  ///
  /// Retrieves the last sync timestamp.
  /// 
  /// @returns {Future<DateTime?>} The last sync timestamp, or null if none exists
  ///
  Future<DateTime?> getLastSyncTimestamp() async {
    try {
      final prefs = await _getPrefs();
      final timestampString = prefs.getString(_lastSyncKey);
      
      if (timestampString != null) {
        return DateTime.parse(timestampString);
      }
      
      return null;
    } catch (e) {
      debugPrint('Failed to retrieve last sync timestamp: $e');
      return null;
    }
  }

  // Utility Methods

  ///
  /// Clears all cached data (except server configuration).
  /// 
  /// @returns {Future<void>} Completes when all data is cleared
  ///
  Future<void> clearAllCachedData() async {
    try {
      await Future.wait([
        clearCachedUserData(),
        clearCachedProgressData(),
        _clearAllCachedCourseData(),
      ]);
      debugPrint('Cleared all cached data');
    } catch (e) {
      debugPrint('Failed to clear all cached data: $e');
    }
  }

  ///
  /// Clears all cached course data.
  ///
  Future<void> _clearAllCachedCourseData() async {
    try {
      final prefs = await _getPrefs();
      final keys = prefs.getKeys().where((key) => key.startsWith(_courseDataKey));
      
      for (final key in keys) {
        await prefs.remove(key);
      }
      
      debugPrint('Cleared all cached course data');
    } catch (e) {
      debugPrint('Failed to clear all cached course data: $e');
    }
  }

  ///
  /// Gets storage usage information for debugging.
  /// 
  /// @returns {Future<Map<String, dynamic>>} Storage usage information
  ///
  Future<Map<String, dynamic>> getStorageInfo() async {
    try {
      final prefs = await _getPrefs();
      final allKeys = prefs.getKeys();
      
      final serverConfigKeys = allKeys.where((key) => 
          key == _serverConfigKey || key == _serverHistoryKey).length;
      final courseDataKeys = allKeys.where((key) => 
          key.startsWith(_courseDataKey)).length;
      final otherKeys = allKeys.length - serverConfigKeys - courseDataKeys;
      
      return {
        'totalKeys': allKeys.length,
        'serverConfigKeys': serverConfigKeys,
        'courseDataKeys': courseDataKeys,
        'otherKeys': otherKeys,
        'hasUserData': await getCachedUserData() != null,
        'hasProgressData': (await getCachedProgressData()).isNotEmpty,
        'lastSync': await getLastSyncTimestamp(),
      };
    } catch (e) {
      debugPrint('Failed to get storage info: $e');
      return {'error': e.toString()};
    }
  }
}