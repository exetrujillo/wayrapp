import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'exceptions.dart';

/// Global error handler for consistent error message processing
/// 
/// Provides centralized error handling and user-friendly error messages
/// for different types of exceptions throughout the application.
class ErrorHandler {
  /// Converts any exception to user-friendly error message
  /// 
  /// @param error Exception or error object
  /// @returns String User-friendly error message
  static String getErrorMessage(dynamic error) {
    if (error is AppException) {
      return error.message;
    } else if (error is DioException) {
      return _handleDioError(error);
    } else {
      return 'An unexpected error occurred. Please try again.';
    }
  }

  /// Gets error code from exception for programmatic handling
  /// 
  /// @param error Exception or error object
  /// @returns String? Error code or null if not available
  static String? getErrorCode(dynamic error) {
    if (error is AppException) {
      return error.code;
    } else if (error is DioException) {
      return _getDioErrorCode(error);
    }
    return null;
  }

  /// Checks if error is a network connectivity issue
  /// 
  /// @param error Exception or error object
  /// @returns bool True if error is network-related
  static bool isNetworkError(dynamic error) {
    if (error is NetworkException) {
      return true;
    } else if (error is DioException) {
      return error.type == DioExceptionType.connectionTimeout ||
          error.type == DioExceptionType.sendTimeout ||
          error.type == DioExceptionType.receiveTimeout ||
          error.type == DioExceptionType.unknown;
    }
    return false;
  }

  /// Checks if error is an authentication issue
  /// 
  /// @param error Exception or error object
  /// @returns bool True if error is authentication-related
  static bool isAuthError(dynamic error) {
    if (error is AuthException) {
      return true;
    } else if (error is DioException) {
      return error.response?.statusCode == 401 || 
             error.response?.statusCode == 403;
    }
    return false;
  }

  /// Checks if error is a validation issue
  /// 
  /// @param error Exception or error object
  /// @returns bool True if error is validation-related
  static bool isValidationError(dynamic error) {
    if (error is ValidationException) {
      return true;
    } else if (error is DioException) {
      return error.response?.statusCode == 400;
    }
    return false;
  }

  /// Checks if error is a server issue
  /// 
  /// @param error Exception or error object
  /// @returns bool True if error is server-related
  static bool isServerError(dynamic error) {
    if (error is ServerException) {
      return true;
    } else if (error is DioException) {
      final statusCode = error.response?.statusCode;
      return statusCode != null && statusCode >= 500;
    }
    return false;
  }

  /// Gets validation errors from ValidationException
  /// 
  /// @param error Exception object
  /// @returns Map with String keys and List of String values for field validation errors
  static Map<String, List<String>> getValidationErrors(dynamic error) {
    if (error is ValidationException) {
      return error.errors.map((key, value) {
        if (value is List) {
          return MapEntry(key, value.cast<String>());
        } else if (value is String) {
          return MapEntry(key, [value]);
        } else {
          return MapEntry(key, [value.toString()]);
        }
      });
    }
    return {};
  }

  /// Handles DioException and converts to user-friendly message
  /// 
  /// @param error DioException from network request
  /// @returns String User-friendly error message
  static String _handleDioError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Connection timeout. Please check your internet connection and try again.';
      
      case DioExceptionType.badResponse:
        return _handleHttpError(error.response);
      
      case DioExceptionType.cancel:
        return 'Request was cancelled.';
      
      case DioExceptionType.unknown:
        if (error.message?.contains('SocketException') == true) {
          return 'No internet connection. Please check your network and try again.';
        }
        return 'Network error occurred. Please check your connection and try again.';
      
      default:
        return 'An unexpected network error occurred. Please try again.';
    }
  }

  /// Gets error code from DioException
  /// 
  /// @param error DioException from network request
  /// @returns String Error code
  static String _getDioErrorCode(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'TIMEOUT';
      case DioExceptionType.badResponse:
        return 'HTTP_${error.response?.statusCode ?? 'ERROR'}';
      case DioExceptionType.cancel:
        return 'CANCELLED';
      case DioExceptionType.unknown:
        return 'NETWORK_ERROR';
      default:
        return 'UNKNOWN_ERROR';
    }
  }

  /// Handles HTTP response errors
  /// 
  /// @param response HTTP response with error status
  /// @returns String User-friendly error message
  static String _handleHttpError(Response<dynamic>? response) {
    final statusCode = response?.statusCode;
    final data = response?.data;

    // Try to extract error message from response
    String? serverMessage;
    if (data is Map<String, dynamic>) {
      serverMessage = data['message'] as String? ?? 
                     data['error'] as String?;
    }

    switch (statusCode) {
      case 400:
        return serverMessage ?? 'Invalid request. Please check your input and try again.';
      
      case 401:
        return serverMessage ?? 'Authentication failed. Please log in again.';
      
      case 403:
        return serverMessage ?? 'Access denied. You don\'t have permission to perform this action.';
      
      case 404:
        return serverMessage ?? 'The requested resource was not found.';
      
      case 409:
        return serverMessage ?? 'Conflict occurred. The resource may already exist.';
      
      case 422:
        return serverMessage ?? 'Invalid data provided. Please check your input.';
      
      case 429:
        return serverMessage ?? 'Too many requests. Please wait a moment and try again.';
      
      case 500:
        return 'Internal server error. Please try again later.';
      
      case 502:
        return 'Bad gateway. The server is temporarily unavailable.';
      
      case 503:
        return 'Service unavailable. Please try again later.';
      
      case 504:
        return 'Gateway timeout. The server took too long to respond.';
      
      default:
        return serverMessage ?? 'Server error (${statusCode ?? 'unknown'}). Please try again later.';
    }
  }

  /// Creates appropriate exception from error object
  /// 
  /// @param error Original error object
  /// @param defaultMessage Default message if error cannot be processed
  /// @returns AppException Appropriate application exception
  static AppException createAppException(
    dynamic error, 
    String defaultMessage,
  ) {
    if (error is AppException) {
      return error;
    } else if (error is DioException) {
      return _createExceptionFromDioError(error);
    } else {
      return NetworkException(defaultMessage, code: 'UNKNOWN');
    }
  }

  /// Creates appropriate exception from DioException
  /// 
  /// @param error DioException from network request
  /// @returns AppException Appropriate application exception
  static AppException _createExceptionFromDioError(DioException error) {
    final statusCode = error.response?.statusCode;
    final message = _handleDioError(error);
    final code = _getDioErrorCode(error);

    if (statusCode == 401 || statusCode == 403) {
      return AuthException(message, code: code);
    } else if (statusCode == 400 || statusCode == 422) {
      final data = error.response?.data;
      Map<String, dynamic> errors = {};
      
      if (data is Map<String, dynamic> && data.containsKey('errors')) {
        errors = data['errors'] as Map<String, dynamic>;
      }
      
      return ValidationException(message, errors, code: code);
    } else if (statusCode != null && statusCode >= 500) {
      return ServerException(message, statusCode: statusCode, code: code);
    } else {
      return NetworkException(message, code: code);
    }
  }

  /// Logs error for debugging purposes
  /// 
  /// @param error Error object to log
  /// @param context Additional context information
  static void logError(dynamic error, {String? context}) {
    final message = getErrorMessage(error);
    final code = getErrorCode(error);
    final contextInfo = context != null ? ' [$context]' : '';
    
    debugPrint('ERROR$contextInfo: $message${code != null ? ' (Code: $code)' : ''}');
    
    // In debug mode, also print stack trace
    if (error is Error) {
      debugPrint('Stack trace: ${error.stackTrace}');
    }
  }
}