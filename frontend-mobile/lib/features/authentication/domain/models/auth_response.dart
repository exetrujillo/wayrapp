import 'package:json_annotation/json_annotation.dart';
import 'user.dart';

part 'auth_response.g.dart';

/// Token pair model from backend API
@JsonSerializable()
class TokenPair {
  /// JWT access token for API authentication
  final String accessToken;
  
  /// JWT refresh token for token renewal
  final String refreshToken;

  const TokenPair({
    required this.accessToken,
    required this.refreshToken,
  });

  factory TokenPair.fromJson(Map<String, dynamic> json) => 
      _$TokenPairFromJson(json);

  Map<String, dynamic> toJson() => _$TokenPairToJson(this);
}

/// Authentication data model from backend API
@JsonSerializable()
class AuthData {
  /// Authenticated user information
  final User user;
  
  /// JWT token pair
  final TokenPair tokens;

  const AuthData({
    required this.user,
    required this.tokens,
  });

  factory AuthData.fromJson(Map<String, dynamic> json) => 
      _$AuthDataFromJson(json);

  Map<String, dynamic> toJson() => _$AuthDataToJson(this);
}

/// API response wrapper for authentication endpoints
@JsonSerializable()
class ApiResponse {
  /// Success status
  final bool success;
  
  /// Response timestamp
  final String timestamp;
  
  /// Response message
  final String message;
  
  /// Authentication data
  final AuthData data;

  const ApiResponse({
    required this.success,
    required this.timestamp,
    required this.message,
    required this.data,
  });

  factory ApiResponse.fromJson(Map<String, dynamic> json) => 
      _$ApiResponseFromJson(json);

  Map<String, dynamic> toJson() => _$ApiResponseToJson(this);
}

/// Authentication response model from backend API
/// 
/// Contains JWT tokens and user information returned after
/// successful login or registration.
@JsonSerializable()
class AuthResponse {
  /// JWT access token for API authentication
  final String token;
  
  /// JWT refresh token for token renewal
  final String refreshToken;
  
  /// Authenticated user information
  final User user;

  const AuthResponse({
    required this.token,
    required this.refreshToken,
    required this.user,
  });

  /// Create AuthResponse from API response
  factory AuthResponse.fromApiResponse(ApiResponse apiResponse) {
    return AuthResponse(
      token: apiResponse.data.tokens.accessToken,
      refreshToken: apiResponse.data.tokens.refreshToken,
      user: apiResponse.data.user,
    );
  }

  /// Creates AuthResponse instance from JSON map
  factory AuthResponse.fromJson(Map<String, dynamic> json) => 
      _$AuthResponseFromJson(json);

  /// Converts AuthResponse instance to JSON map
  Map<String, dynamic> toJson() => _$AuthResponseToJson(this);

  /// Creates a copy of this AuthResponse with updated fields
  AuthResponse copyWith({
    String? token,
    String? refreshToken,
    User? user,
  }) {
    return AuthResponse(
      token: token ?? this.token,
      refreshToken: refreshToken ?? this.refreshToken,
      user: user ?? this.user,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AuthResponse &&
          runtimeType == other.runtimeType &&
          token == other.token &&
          refreshToken == other.refreshToken &&
          user == other.user;

  @override
  int get hashCode => token.hashCode ^ refreshToken.hashCode ^ user.hashCode;

  @override
  String toString() {
    return 'AuthResponse{token: ${token.substring(0, 10)}..., refreshToken: ${refreshToken.substring(0, 10)}..., user: $user}';
  }
}