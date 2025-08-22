import 'package:flutter/material.dart';

import '../../domain/models/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../../../core/errors/error_handler.dart';

/// Provider for managing authentication state
class AuthProvider extends ChangeNotifier {
  final AuthRepository _authRepository;
  
  User? _currentUser;
  bool _isAuthenticated = false;
  bool _isLoading = false;
  String? _error;

  User? get currentUser => _currentUser;
  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  String? get error => _error;

  AuthProvider({required AuthRepository authRepository}) 
      : _authRepository = authRepository {
    _checkAuthStatus();
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
      // If there's an error reading stored auth data, clear it
      await logout();
    }
  }

  /// Login with email and password
  Future<void> login(String email, String password) async {
    _setLoading(true);
    _clearError();

    try {
      final authResponse = await _authRepository.login(email, password);
      _currentUser = authResponse.user;
      _isAuthenticated = true;
    } catch (e) {
      _setError(ErrorHandler.getErrorMessage(e));
    } finally {
      _setLoading(false);
    }
  }

  /// Register new user account
  Future<void> register(String email, String password, String? name) async {
    _setLoading(true);
    _clearError();

    try {
      final authResponse = await _authRepository.register(email, password, name);
      _currentUser = authResponse.user;
      _isAuthenticated = true;
    } catch (e) {
      _setError(ErrorHandler.getErrorMessage(e));
    } finally {
      _setLoading(false);
    }
  }

  /// Logout user and clear stored data
  Future<void> logout() async {
    try {
      await _authRepository.logout();
    } catch (e) {
      // Continue with logout even if API call fails
    }
    
    _currentUser = null;
    _isAuthenticated = false;
    _clearError();
    notifyListeners();
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