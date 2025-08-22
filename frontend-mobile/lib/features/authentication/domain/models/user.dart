import 'package:json_annotation/json_annotation.dart';

part 'user.g.dart';

/// User role enumeration matching backend API
enum UserRole {
  @JsonValue('student')
  student,
  @JsonValue('creator')
  creator,
  @JsonValue('admin')
  admin,
}

/// User model representing authenticated user data
/// 
/// This model matches the backend API user structure and includes
/// JSON serialization for API communication.
@JsonSerializable()
class User {
  /// Unique user identifier
  final String id;
  
  /// User's email address (used for authentication)
  final String email;
  
  /// Optional username/display name
  final String? username;
  
  /// User's role in the system
  final UserRole role;

  const User({
    required this.id,
    required this.email,
    this.username,
    required this.role,
  });

  /// Get display name (username or email)
  String get name => username ?? email;

  /// Creates User instance from JSON map
  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);

  /// Converts User instance to JSON map
  Map<String, dynamic> toJson() => _$UserToJson(this);

  /// Creates a copy of this User with updated fields
  User copyWith({
    String? id,
    String? email,
    String? username,
    UserRole? role,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      username: username ?? this.username,
      role: role ?? this.role,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is User &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          email == other.email &&
          username == other.username &&
          role == other.role;

  @override
  int get hashCode =>
      id.hashCode ^
      email.hashCode ^
      username.hashCode ^
      role.hashCode;

  @override
  String toString() {
    return 'User{id: $id, email: $email, username: $username, role: $role}';
  }
}