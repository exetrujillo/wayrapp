import '../errors/exceptions.dart';

/// Input validation utilities for authentication and forms
/// 
/// Provides comprehensive validation functions for user input
/// with security considerations and consistent error messages.
class InputValidator {
  // Email validation regex pattern
  static final RegExp _emailRegex = RegExp(
    r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
  );

  // Password strength regex patterns
  static final RegExp _hasUppercase = RegExp(r'[A-Z]');
  static final RegExp _hasLowercase = RegExp(r'[a-z]');
  static final RegExp _hasDigits = RegExp(r'\d');
  static final RegExp _hasSpecialCharacters = RegExp(r'[!@#$%^&*(),.?":{}|<>]');

  /// Validates email address format
  /// 
  /// @param email Email address to validate
  /// @returns String? Error message or null if valid
  static String? validateEmail(String? email) {
    if (email == null || email.isEmpty) {
      return 'Email is required';
    }

    final trimmedEmail = email.trim();
    if (trimmedEmail.isEmpty) {
      return 'Email is required';
    }

    if (trimmedEmail.length > 254) {
      return 'Email is too long';
    }

    if (!_emailRegex.hasMatch(trimmedEmail)) {
      return 'Please enter a valid email address';
    }

    return null;
  }

  /// Validates password strength and requirements
  /// 
  /// @param password Password to validate
  /// @param requireStrong Whether to enforce strong password requirements
  /// @returns String? Error message or null if valid
  static String? validatePassword(String? password, {bool requireStrong = true}) {
    if (password == null || password.isEmpty) {
      return 'Password is required';
    }

    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }

    if (password.length > 128) {
      return 'Password is too long (maximum 128 characters)';
    }

    if (requireStrong) {
      if (!_hasLowercase.hasMatch(password)) {
        return 'Password must contain at least one lowercase letter';
      }

      if (!_hasUppercase.hasMatch(password)) {
        return 'Password must contain at least one uppercase letter';
      }

      if (!_hasDigits.hasMatch(password)) {
        return 'Password must contain at least one number';
      }

      if (!_hasSpecialCharacters.hasMatch(password)) {
        return 'Password must contain at least one special character';
      }
    }

    return null;
  }

  /// Validates password confirmation matches original password
  /// 
  /// @param password Original password
  /// @param confirmPassword Password confirmation
  /// @returns String? Error message or null if valid
  static String? validatePasswordConfirmation(
    String? password,
    String? confirmPassword,
  ) {
    if (confirmPassword == null || confirmPassword.isEmpty) {
      return 'Password confirmation is required';
    }

    if (password != confirmPassword) {
      return 'Passwords do not match';
    }

    return null;
  }

  /// Validates display name
  /// 
  /// @param name Display name to validate
  /// @param required Whether name is required
  /// @returns String? Error message or null if valid
  static String? validateName(String? name, {bool required = false}) {
    if (name == null || name.isEmpty) {
      return required ? 'Name is required' : null;
    }

    final trimmedName = name.trim();
    if (required && trimmedName.isEmpty) {
      return 'Name is required';
    }

    if (trimmedName.length > 100) {
      return 'Name is too long (maximum 100 characters)';
    }

    // Check for potentially dangerous characters
    if (trimmedName.contains(RegExp(r'''[<>"']'''))) {
      return 'Name contains invalid characters';
    }

    return null;
  }

  /// Validates server URL format
  /// 
  /// @param url Server URL to validate
  /// @returns String? Error message or null if valid
  static String? validateServerUrl(String? url) {
    if (url == null || url.isEmpty) {
      return 'Server URL is required';
    }

    final trimmedUrl = url.trim();
    if (trimmedUrl.isEmpty) {
      return 'Server URL is required';
    }

    // Basic URL format validation
    final Uri? uri;
    try {
      uri = Uri.parse(trimmedUrl);
    } catch (e) {
      return 'Please enter a valid URL';
    }

    if (!uri.hasScheme || (uri.scheme != 'http' && uri.scheme != 'https')) {
      return 'URL must start with http:// or https://';
    }

    if (!uri.hasAuthority || uri.host.isEmpty) {
      return 'Please enter a valid server URL';
    }

    return null;
  }

  /// Sanitizes user input by removing potentially dangerous characters
  /// 
  /// @param input Raw user input
  /// @returns String Sanitized input
  static String sanitizeInput(String input) {
    return input
        .replaceAll(RegExp(r'''[<>"']'''), '') // Remove HTML/script injection chars
        .trim();
  }

  /// Validates and sanitizes email input
  /// 
  /// @param email Raw email input
  /// @returns String Sanitized email
  /// @throws ValidationException if email is invalid
  static String validateAndSanitizeEmail(String? email) {
    final error = validateEmail(email);
    if (error != null) {
      throw ValidationException(
        'Invalid email',
        {'email': [error]},
        code: 'INVALID_EMAIL',
      );
    }

    return email!.trim().toLowerCase();
  }

  /// Validates and sanitizes password input
  /// 
  /// @param password Raw password input
  /// @param requireStrong Whether to enforce strong password requirements
  /// @returns String Validated password (not sanitized for security)
  /// @throws ValidationException if password is invalid
  static String validateAndSanitizePassword(
    String? password, {
    bool requireStrong = true,
  }) {
    final error = validatePassword(password, requireStrong: requireStrong);
    if (error != null) {
      throw ValidationException(
        'Invalid password',
        {'password': [error]},
        code: 'INVALID_PASSWORD',
      );
    }

    // Don't sanitize passwords as it might affect intended characters
    return password!;
  }

  /// Validates login credentials
  /// 
  /// @param email Email address
  /// @param password Password
  /// @throws ValidationException if credentials are invalid
  static void validateLoginCredentials(String? email, String? password) {
    final Map<String, List<String>> errors = {};

    final emailError = validateEmail(email);
    if (emailError != null) {
      errors['email'] = [emailError];
    }

    final passwordError = validatePassword(password, requireStrong: false);
    if (passwordError != null) {
      errors['password'] = [passwordError];
    }

    if (errors.isNotEmpty) {
      throw ValidationException(
        'Invalid login credentials',
        errors,
        code: 'INVALID_CREDENTIALS',
      );
    }
  }

  /// Validates registration data
  /// 
  /// @param email Email address
  /// @param password Password
  /// @param confirmPassword Password confirmation
  /// @param name Display name (optional)
  /// @throws ValidationException if registration data is invalid
  static void validateRegistrationData(
    String? email,
    String? password,
    String? confirmPassword,
    String? name,
  ) {
    final Map<String, List<String>> errors = {};

    final emailError = validateEmail(email);
    if (emailError != null) {
      errors['email'] = [emailError];
    }

    final passwordError = validatePassword(password, requireStrong: true);
    if (passwordError != null) {
      errors['password'] = [passwordError];
    }

    final confirmPasswordError = validatePasswordConfirmation(password, confirmPassword);
    if (confirmPasswordError != null) {
      errors['confirmPassword'] = [confirmPasswordError];
    }

    final nameError = validateName(name, required: false);
    if (nameError != null) {
      errors['name'] = [nameError];
    }

    if (errors.isNotEmpty) {
      throw ValidationException(
        'Invalid registration data',
        errors,
        code: 'INVALID_REGISTRATION',
      );
    }
  }
}