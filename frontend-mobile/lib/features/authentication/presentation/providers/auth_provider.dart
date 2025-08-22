import 'package:flutter/material.dart';

import '../../domain/models/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../../../core/errors/error_handler.dart';
import '../../../../shared/providers/connectivity_provider.dart';
import '../../../../core/network/request_queue_service.dart';
import '../../../../shared/services/local_storage_service.dart';

/// Provider for managing authentication state with network awareness
class AuthProvider extends ChangeNotifier {
  final AuthRepository _authRepository;
  final ConnectivityProvider? _connectivityProvider;
  final RequestQueueService _requestQueueService;
  final LocalStorageService _localStorageService;
  
  User? _currentUser;
  bool _isAuthenticated = false;
  bool _isLoading = false;
  String? _error;
  bool _hasOfflineData = false;

  User? get currentUser => _currentUser;
  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasOfflineData => _hasOfflineData;
  bool get isOnline => _connectivityProvider?.isConnected ?? true;

  AuthProvider({
    required AuthRepository authRepository,
    ConnectivityProvider? connectivityProvider,
    RequestQueueService? requestQueueService,
    LocalStorageService? localStorageService,
  }) : _authRepository = authRepository,
       _connectivityProvider = connectivityProvider,
       _requestQueueService = requestQueueService ?? RequestQueueService.instance,
       _localStorageService = localStorageService ?? LocalStorageService.instance {
    _checkAuthStatus();
    _checkOfflineData();
  }

  /// Check if user is already authenticated
  Future<void> _checkAuthStatus() async {
    try {
      final isAuth = await _authRepository.isAuthenticated();
      if (isAuth) {
        final user = await _authRepository.getCurrentUser();
        if (user != null) {
          _currentUser = user;
          _isAuthenticated = true;
          notifyListeners();
        }
      }
    } catch (e) {
      // If there's an error reading stored auth data, try offline data
      await _loadOfflineUserData();
    }
  }

  /// Check if offline user data is available
  Future<void> _checkOfflineData() async {
    try {
      final cachedUserData = await _localStorageService.getCachedUserData();
      _hasOfflineData = cachedUserData != null;
      
      // If we have offline data but no online authentication, use offline data
      if (_hasOfflineData && !_isAuthenticated && !isOnline) {
        await _loadOfflineUserData();
      }
      
      notifyListeners();
    } catch (e) {
      debugPrint('Failed to check offline data: $e');
    }
  }

  /// Load user data from offline cache
  Future<void> _loadOfflineUserData() async {
    try {
      final cachedUserData = await _localStorageService.getCachedUserData();
      if (cachedUserData != null) {
        _currentUser = User(
          id: cachedUserData.id,
          email: cachedUserData.email,
          username: cachedUserData.name,
          role: UserRole.values.firstWhere(
            (role) => role.toString().split('.').last == cachedUserData.role,
            orElse: () => UserRole.student,
          ),
        );
        _isAuthenticated = true;
        _hasOfflineData = true;
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Failed to load offline user data: $e');
    }
  }

  /// Login with email and password
  Future<void> login(String email, String password) async {
    _setLoading(true);
    _clearError();

    try {
      if (!isOnline) {
        // Check if we have cached credentials for offline login
        final cachedUserData = await _localStorageService.getCachedUserData();
        if (cachedUserData != null && cachedUserData.email == email) {
          await _loadOfflineUserData();
          _setError('Logged in offline. Some features may be limited.');
          return;
        } else {
          throw Exception('No internet connection and no cached credentials for this user');
        }
      }

      final authResponse = await _authRepository.login(email, password);
      _currentUser = authResponse.user;
      _isAuthenticated = true;
      
      // Cache user data for offline use
      await _cacheUserData(authResponse.user);
      
    } catch (e) {
      if (!isOnline) {
        // Queue login request for when connection is restored
        await _queueAuthRequest('login', {
          'email': email,
          'password': password,
        });
        _setError('No internet connection. Login will be attempted when connection is restored.');
      } else {
        _setError(ErrorHandler.getErrorMessage(e));
      }
    } finally {
      _setLoading(false);
    }
  }

  /// Register new user account
  Future<void> register(String email, String password, String? name) async {
    _setLoading(true);
    _clearError();

    try {
      if (!isOnline) {
        throw Exception('Registration requires an internet connection');
      }

      final authResponse = await _authRepository.register(email, password, name);
      _currentUser = authResponse.user;
      _isAuthenticated = true;
      
      // Cache user data for offline use
      await _cacheUserData(authResponse.user);
      
    } catch (e) {
      if (!isOnline) {
        _setError('Registration requires an internet connection. Please connect and try again.');
      } else {
        _setError(ErrorHandler.getErrorMessage(e));
      }
    } finally {
      _setLoading(false);
    }
  }

  /// Logout user and clear stored data
  Future<void> logout() async {
    try {
      if (isOnline) {
        await _authRepository.logout();
      } else {
        // Queue logout request for when connection is restored
        await _queueAuthRequest('logout', {});
      }
    } catch (e) {
      // Continue with logout even if API call fails
      debugPrint('Logout API call failed: $e');
    }
    
    // Clear local state
    _currentUser = null;
    _isAuthenticated = false;
    _hasOfflineData = false;
    _clearError();
    
    // Clear cached data
    await _localStorageService.clearCachedUserData();
    
    notifyListeners();
  }

  /// Cache user data for offline use
  Future<void> _cacheUserData(User user) async {
    try {
      final cachedUserData = CachedUserData(
        id: user.id,
        email: user.email,
        name: user.username,
        role: user.role.toString().split('.').last,
        lastSynced: DateTime.now(),
      );
      
      await _localStorageService.storeCachedUserData(cachedUserData);
      _hasOfflineData = true;
    } catch (e) {
      debugPrint('Failed to cache user data: $e');
    }
  }

  /// Queue authentication request for offline scenarios
  Future<void> _queueAuthRequest(String action, Map<String, dynamic> data) async {
    try {
      final request = QueuedRequest(
        id: 'auth_${action}_${DateTime.now().millisecondsSinceEpoch}',
        method: 'POST',
        url: '/api/v1/auth/$action',
        data: data,
        priority: RequestPriority.high,
        requiresAuth: action != 'login' && action != 'register',
      );
      
      await _requestQueueService.queueRequest(request);
    } catch (e) {
      debugPrint('Failed to queue auth request: $e');
    }
  }

  /// Sync with server when connection is restored
  Future<void> syncWithServer() async {
    if (!isOnline) {
      return;
    }

    try {
      _setLoading(true);
      
      // Try to refresh authentication
      final isAuth = await _authRepository.isAuthenticated();
      if (isAuth) {
        final user = await _authRepository.getCurrentUser();
        if (user != null) {
          _currentUser = user;
          _isAuthenticated = true;
          await _cacheUserData(user);
        }
      }
      
      // Force process any queued requests
      await _requestQueueService.forceProcessQueue();
      
    } catch (e) {
      debugPrint('Failed to sync with server: $e');
    } finally {
      _setLoading(false);
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