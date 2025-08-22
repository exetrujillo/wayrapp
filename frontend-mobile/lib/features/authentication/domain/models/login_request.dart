import 'package:json_annotation/json_annotation.dart';

part 'login_request.g.dart';

/// Login request model for authentication API
/// 
/// Contains user credentials for login endpoint.
@JsonSerializable()
class LoginRequest {
  /// User's email address
  final String email;
  
  /// User's password
  final String password;

  const LoginRequest({
    required this.email,
    required this.password,
  });

  /// Creates LoginRequest instance from JSON map
  factory LoginRequest.fromJson(Map<String, dynamic> json) => 
      _$LoginRequestFromJson(json);

  /// Converts LoginRequest instance to JSON map
  Map<String, dynamic> toJson() => _$LoginRequestToJson(this);

  /// Creates a copy of this LoginRequest with updated fields
  LoginRequest copyWith({
    String? email,
    String? password,
  }) {
    return LoginRequest(
      email: email ?? this.email,
      password: password ?? this.password,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is LoginRequest &&
          runtimeType == other.runtimeType &&
          email == other.email &&
          password == other.password;

  @override
  int get hashCode => email.hashCode ^ password.hashCode;

  @override
  String toString() {
    return 'LoginRequest{email: $email, password: [HIDDEN]}';
  }
}

/// Registration request model for user registration API
/// 
/// Contains user information for account creation.
@JsonSerializable()
class RegisterRequest {
  /// User's email address
  final String email;
  
  /// User's password
  final String password;
  
  /// Optional username
  final String? username;

  const RegisterRequest({
    required this.email,
    required this.password,
    this.username,
  });

  /// Creates RegisterRequest instance from JSON map
  factory RegisterRequest.fromJson(Map<String, dynamic> json) => 
      _$RegisterRequestFromJson(json);

  /// Converts RegisterRequest instance to JSON map
  Map<String, dynamic> toJson() => _$RegisterRequestToJson(this);

  /// Creates a copy of this RegisterRequest with updated fields
  RegisterRequest copyWith({
    String? email,
    String? password,
    String? username,
  }) {
    return RegisterRequest(
      email: email ?? this.email,
      password: password ?? this.password,
      username: username ?? this.username,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is RegisterRequest &&
          runtimeType == other.runtimeType &&
          email == other.email &&
          password == other.password &&
          username == other.username;

  @override
  int get hashCode => email.hashCode ^ password.hashCode ^ username.hashCode;

  @override
  String toString() {
    return 'RegisterRequest{email: $email, password: [HIDDEN], username: $username}';
  }
}