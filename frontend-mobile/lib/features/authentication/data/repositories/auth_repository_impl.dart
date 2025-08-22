import '../../domain/models/auth_response.dart';
import '../../domain/models/login_request.dart';
import '../../domain/models/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/storage/secure_storage_service.dart';
import '../../../../core/errors/exceptions.dart';

/// Concrete implementation of AuthRepository
/// 
/// Provides authentication operations using the WayrApp backend API.
/// Handles token management, user data persistence, and error handling.
class AuthRepositoryImpl implements AuthRepository {
  final ApiClient _apiClient;

  const AuthRepositoryImpl({
    required ApiClient apiClient,
  }) : _apiClient = apiClient;

  @override
  Future<AuthResponse> login(String email, String password) async {
    try {
      // Validate input
      if (email.isEmpty || password.isEmpty) {
        throw const ValidationException(
          'Email and password are required',
          {'email': 'Email is required', 'password': 'Password is required'},
          code: 'MISSING_CREDENTIALS',
        );
      }

      // Create login request
      final loginRequest = LoginRequest(email: email, password: password);

      // Make API call
      final response = await _apiClient.post(
        '/api/v1/auth/login',
        data: loginRequest.toJson(),
      );

      if (response.statusCode == 200) {
        final apiResponse = ApiResponse.fromJson(
          response.data as Map<String, dynamic>,
        );
        
        final authResponse = AuthResponse.fromApiResponse(apiResponse);

        // Store tokens and user data securely
        await Future.wait([
          SecureStorageService.storeTokens(
            authResponse.token,
            authResponse.refreshToken,
          ),
          SecureStorageService.storeUser(authResponse.user),
        ]);

        return authResponse;
      } else {
        throw AuthException(
          'Login failed with status ${response.statusCode}',
          code: 'LOGIN_FAILED',
        );
      }
    } on AppException {
      rethrow; // Re-throw app exceptions as-is
    } catch (e) {
      throw AuthException(
        'Login failed: ${e.toString()}',
        code: 'LOGIN_ERROR',
      );
    }
  }

  @override
  Future<AuthResponse> register(String email, String password, String? name) async {
    try {
      // Validate input
      if (email.isEmpty || password.isEmpty) {
        throw const ValidationException(
          'Email and password are required',
          {'email': 'Email is required', 'password': 'Password is required'},
          code: 'MISSING_CREDENTIALS',
        );
      }

      // Create registration request
      final registerRequest = RegisterRequest(
        email: email,
        password: password,
        username: name,
      );

      // Make API call
      final response = await _apiClient.post(
        '/api/v1/auth/register',
        data: registerRequest.toJson(),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        final apiResponse = ApiResponse.fromJson(
          response.data as Map<String, dynamic>,
        );
        
        final authResponse = AuthResponse.fromApiResponse(apiResponse);

        // Store tokens and user data securely
        await Future.wait([
          SecureStorageService.storeTokens(
            authResponse.token,
            authResponse.refreshToken,
          ),
          SecureStorageService.storeUser(authResponse.user),
        ]);

        return authResponse;
      } else {
        throw AuthException(
          'Registration failed with status ${response.statusCode}',
          code: 'REGISTRATION_FAILED',
        );
      }
    } on AppException {
      rethrow; // Re-throw app exceptions as-is
    } catch (e) {
      throw AuthException(
        'Registration failed: ${e.toString()}',
        code: 'REGISTRATION_ERROR',
      );
    }
  }

  @override
  Future<void> logout() async {
    try {
      // Attempt to notify server of logout (non-critical if it fails)
      try {
        final refreshToken = await SecureStorageService.getRefreshToken();
        if (refreshToken != null) {
          await _apiClient.post(
            '/api/v1/auth/logout',
            data: {'refreshToken': refreshToken},
          );
        }
      } catch (e) {
        // Logout API call failed, but we still clear local data
        // This is non-critical as the main goal is to clear local session
      }

      // Clear all authentication data from secure storage
      await SecureStorageService.clearAuthData();
    } catch (e) {
      throw AuthException(
        'Logout failed: ${e.toString()}',
        code: 'LOGOUT_ERROR',
      );
    }
  }

  @override
  Future<AuthResponse?> refreshToken() async {
    try {
      final refreshToken = await SecureStorageService.getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        return null;
      }

      final response = await _apiClient.post(
        '/api/v1/auth/refresh',
        data: {'refreshToken': refreshToken},
      );

      if (response.statusCode == 200) {
        final apiResponse = ApiResponse.fromJson(
          response.data as Map<String, dynamic>,
        );
        
        final authResponse = AuthResponse.fromApiResponse(apiResponse);

        // Store new tokens and updated user data
        await Future.wait([
          SecureStorageService.storeTokens(
            authResponse.token,
            authResponse.refreshToken,
          ),
          SecureStorageService.storeUser(authResponse.user),
        ]);

        return authResponse;
      } else {
        // Refresh failed, clear auth data
        await SecureStorageService.clearAuthData();
        return null;
      }
    } on AppException {
      // Clear auth data on any app exception during refresh
      await SecureStorageService.clearAuthData();
      return null;
    } catch (e) {
      // Clear auth data on any error during refresh
      await SecureStorageService.clearAuthData();
      return null;
    }
  }

  @override
  Future<User?> getCurrentUser() async {
    try {
      return await SecureStorageService.getUser();
    } catch (e) {
      // Return null if user data cannot be retrieved
      return null;
    }
  }

  @override
  Future<bool> isAuthenticated() async {
    try {
      return await SecureStorageService.hasTokens();
    } catch (e) {
      return false;
    }
  }

  @override
  Future<String?> getAccessToken() async {
    try {
      return await SecureStorageService.getToken();
    } catch (e) {
      return null;
    }
  }

  @override
  Future<String?> getRefreshToken() async {
    try {
      return await SecureStorageService.getRefreshToken();
    } catch (e) {
      return null;
    }
  }
}