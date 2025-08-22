/// Base class for all application exceptions
/// 
/// Provides common structure for error handling throughout the application.
/// All custom exceptions should extend this class.
abstract class AppException implements Exception {
  /// Human-readable error message
  final String message;
  
  /// Optional error code for programmatic handling
  final String? code;
  
  const AppException(this.message, {this.code});
  
  @override
  String toString() => message;
}

/// Exception thrown when network operations fail
/// 
/// Covers connection timeouts, network unavailability,
/// and other network-related errors.
class NetworkException extends AppException {
  const NetworkException(super.message, {super.code});
}

/// Exception thrown when authentication operations fail
/// 
/// Covers login failures, token expiration, authorization errors,
/// and other authentication-related issues.
class AuthException extends AppException {
  const AuthException(super.message, {super.code});
}

/// Exception thrown when input validation fails
/// 
/// Contains detailed validation errors for form fields
/// and other user input validation.
class ValidationException extends AppException {
  /// Map of field names to validation error messages
  final Map<String, dynamic> errors;
  
  const ValidationException(
    super.message, 
    this.errors, 
    {super.code}
  );
  
  /// Gets validation errors for a specific field
  /// 
  /// @param field Field name to get errors for
  /// @returns List of String error messages for the field
  List<String> getFieldErrors(String field) {
    final fieldErrors = errors[field];
    if (fieldErrors is List) {
      return fieldErrors.cast<String>();
    } else if (fieldErrors is String) {
      return [fieldErrors];
    }
    return [];
  }
  
  /// Checks if a specific field has validation errors
  /// 
  /// @param field Field name to check
  /// @returns bool True if field has errors
  bool hasFieldError(String field) {
    return errors.containsKey(field) && errors[field] != null;
  }
  
  /// Gets first error message for a field
  /// 
  /// @param field Field name to get error for
  /// @returns String? First error message or null if no errors
  String? getFirstFieldError(String field) {
    final fieldErrors = getFieldErrors(field);
    return fieldErrors.isNotEmpty ? fieldErrors.first : null;
  }
}

/// Exception thrown when server operations fail
/// 
/// Covers HTTP 5xx errors and other server-side issues.
class ServerException extends AppException {
  /// HTTP status code if available
  final int? statusCode;
  
  const ServerException(
    super.message, 
    {this.statusCode, super.code}
  );
}

/// Exception thrown when storage operations fail
/// 
/// Covers secure storage, shared preferences, and other
/// local storage related errors.
class StorageException extends AppException {
  const StorageException(super.message, {super.code});
}

/// Exception thrown when course or content operations fail
/// 
/// Covers course loading, content parsing, and other
/// content-related errors.
class ContentException extends AppException {
  const ContentException(super.message, {super.code});
}

/// Exception thrown when exercise operations fail
/// 
/// Covers exercise loading, validation, and submission errors.
class ExerciseException extends AppException {
  const ExerciseException(super.message, {super.code});
}

/// Exception thrown when offline operations fail
/// 
/// Covers offline content access, sync failures, and other
/// offline-related errors.
class OfflineException extends AppException {
  const OfflineException(super.message, {super.code});
}