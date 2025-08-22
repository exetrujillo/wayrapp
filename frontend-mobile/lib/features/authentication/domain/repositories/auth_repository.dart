import '../models/auth_response.dart';
import '../models/user.dart';

/// Abstract repository interface for authentication operations
/// 
/// Defines the contract for authentication data access operations.
/// This interface allows for different implementations (API, mock, etc.)
/// while maintaining consistent business logic.
abstract class AuthRepository {
  /// Authenticates user with email and password
  /// 
  /// Makes API call to login endpoint and returns authentication response
  /// containing JWT tokens and user information.
  /// 
  /// @param email User's email address
  /// @param password User's password
  /// @returns Future&lt;AuthResponse&gt; Authentication response with tokens and user data
  /// @throws AuthException when authentication fails
  /// @throws NetworkException when network request fails
  /// @throws ValidationException when input validation fails
  Future<AuthResponse> login(String email, String password);

  /// Registers new user account
  /// 
  /// Makes API call to registration endpoint and returns authentication response
  /// for the newly created user account.
  /// 
  /// @param email User's email address
  /// @param password User's password
  /// @param name Optional display name
  /// @returns Future&lt;AuthResponse&gt; Authentication response with tokens and user data
  /// @throws AuthException when registration fails
  /// @throws NetworkException when network request fails
  /// @throws ValidationException when input validation fails
  Future<AuthResponse> register(String email, String password, String? name);

  /// Logs out current user
  /// 
  /// Clears stored tokens and invalidates session.
  /// May make API call to invalidate refresh token on server.
  /// 
  /// @returns Future&lt;void&gt;
  /// @throws NetworkException when logout request fails (non-critical)
  Future<void> logout();

  /// Refreshes authentication tokens
  /// 
  /// Uses stored refresh token to obtain new access token.
  /// Updates stored tokens with new values.
  /// 
  /// @returns Future&lt;AuthResponse?&gt; New authentication response or null if refresh fails
  /// @throws AuthException when refresh token is invalid or expired
  /// @throws NetworkException when network request fails
  Future<AuthResponse?> refreshToken();

  /// Gets currently authenticated user
  /// 
  /// Returns user information from secure storage if available.
  /// Does not make network request.
  /// 
  /// @returns Future&lt;User?&gt; Current user or null if not authenticated
  Future<User?> getCurrentUser();

  /// Checks if user is currently authenticated
  /// 
  /// Verifies that valid tokens exist in secure storage.
  /// Does not validate token expiration or make network requests.
  /// 
  /// @returns Future&lt;bool&gt; True if user appears to be authenticated
  Future<bool> isAuthenticated();

  /// Gets current access token
  /// 
  /// Returns stored access token for API requests.
  /// Does not validate token expiration.
  /// 
  /// @returns Future&lt;String?&gt; Access token or null if not available
  Future<String?> getAccessToken();

  /// Gets current refresh token
  /// 
  /// Returns stored refresh token for token renewal.
  /// 
  /// @returns Future&lt;String?&gt; Refresh token or null if not available
  Future<String?> getRefreshToken();
}