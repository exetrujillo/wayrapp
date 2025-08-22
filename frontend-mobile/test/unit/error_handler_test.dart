import 'package:flutter_test/flutter_test.dart';
import 'package:dio/dio.dart';

import 'package:wayrapp_mobile/core/errors/error_handler.dart';
import 'package:wayrapp_mobile/core/errors/exceptions.dart';

void main() {
  group('ErrorHandler', () {
    group('getErrorMessage', () {
      test('should return message from AuthException', () {
        // Arrange
        final exception = AuthException('Invalid credentials');

        // Act
        final result = ErrorHandler.getErrorMessage(exception);

        // Assert
        expect(result, 'Invalid credentials');
      });

      test('should return message from NetworkException', () {
        // Arrange
        final exception = NetworkException('Connection timeout');

        // Act
        final result = ErrorHandler.getErrorMessage(exception);

        // Assert
        expect(result, 'Connection timeout');
      });

      test('should return message from ValidationException', () {
        // Arrange
        final exception = ValidationException('Validation failed', {
          'email': ['Email is required'],
          'password': ['Password too short'],
        });

        // Act
        final result = ErrorHandler.getErrorMessage(exception);

        // Assert
        expect(result, 'Validation failed');
      });

      test('should return message from ServerException', () {
        // Arrange
        final exception = ServerException('Internal server error', statusCode: 500);

        // Act
        final result = ErrorHandler.getErrorMessage(exception);

        // Assert
        expect(result, 'Internal server error');
      });

      test('should handle DioException with connection timeout', () {
        // Arrange
        final dioException = DioException(
          requestOptions: RequestOptions(path: '/test'),
          type: DioExceptionType.connectionTimeout,
        );

        // Act
        final result = ErrorHandler.getErrorMessage(dioException);

        // Assert
        expect(result, 'Connection timeout. Please check your internet connection.');
      });

      test('should handle DioException with send timeout', () {
        // Arrange
        final dioException = DioException(
          requestOptions: RequestOptions(path: '/test'),
          type: DioExceptionType.sendTimeout,
        );

        // Act
        final result = ErrorHandler.getErrorMessage(dioException);

        // Assert
        expect(result, 'Connection timeout. Please check your internet connection.');
      });

      test('should handle DioException with receive timeout', () {
        // Arrange
        final dioException = DioException(
          requestOptions: RequestOptions(path: '/test'),
          type: DioExceptionType.receiveTimeout,
        );

        // Act
        final result = ErrorHandler.getErrorMessage(dioException);

        // Assert
        expect(result, 'Connection timeout. Please check your internet connection.');
      });

      test('should handle DioException with bad response - 400', () {
        // Arrange
        final dioException = DioException(
          requestOptions: RequestOptions(path: '/test'),
          type: DioExceptionType.badResponse,
          response: Response(
            requestOptions: RequestOptions(path: '/test'),
            statusCode: 400,
          ),
        );

        // Act
        final result = ErrorHandler.getErrorMessage(dioException);

        // Assert
        expect(result, 'Invalid request. Please check your input.');
      });

      test('should handle DioException with bad response - 401', () {
        // Arrange
        final dioException = DioException(
          requestOptions: RequestOptions(path: '/test'),
          type: DioExceptionType.badResponse,
          response: Response(
            requestOptions: RequestOptions(path: '/test'),
            statusCode: 401,
          ),
        );

        // Act
        final result = ErrorHandler.getErrorMessage(dioException);

        // Assert
        expect(result, 'Authentication failed. Please log in again.');
      });

      test('should handle DioException with bad response - 403', () {
        // Arrange
        final dioException = DioException(
          requestOptions: RequestOptions(path: '/test'),
          type: DioExceptionType.badResponse,
          response: Response(
            requestOptions: RequestOptions(path: '/test'),
            statusCode: 403,
          ),
        );

        // Act
        final result = ErrorHandler.getErrorMessage(dioException);

        // Assert
        expect(result, 'Access denied. You don\'t have permission.');
      });

      test('should handle DioException with bad response - 404', () {
        // Arrange
        final dioException = DioException(
          requestOptions: RequestOptions(path: '/test'),
          type: DioExceptionType.badResponse,
          response: Response(
            requestOptions: RequestOptions(path: '/test'),
            statusCode: 404,
          ),
        );

        // Act
        final result = ErrorHandler.getErrorMessage(dioException);

        // Assert
        expect(result, 'Resource not found.');
      });

      test('should handle DioException with bad response - 500', () {
        // Arrange
        final dioException = DioException(
          requestOptions: RequestOptions(path: '/test'),
          type: DioExceptionType.badResponse,
          response: Response(
            requestOptions: RequestOptions(path: '/test'),
            statusCode: 500,
          ),
        );

        // Act
        final result = ErrorHandler.getErrorMessage(dioException);

        // Assert
        expect(result, 'Server error. Please try again later.');
      });

      test('should handle DioException with bad response - unknown status code', () {
        // Arrange
        final dioException = DioException(
          requestOptions: RequestOptions(path: '/test'),
          type: DioExceptionType.badResponse,
          response: Response(
            requestOptions: RequestOptions(path: '/test'),
            statusCode: 418, // I'm a teapot
          ),
        );

        // Act
        final result = ErrorHandler.getErrorMessage(dioException);

        // Assert
        expect(result, 'Server error (418)');
      });

      test('should handle DioException with cancel', () {
        // Arrange
        final dioException = DioException(
          requestOptions: RequestOptions(path: '/test'),
          type: DioExceptionType.cancel,
        );

        // Act
        final result = ErrorHandler.getErrorMessage(dioException);

        // Assert
        expect(result, 'Request was cancelled');
      });

      test('should handle DioException with unknown type', () {
        // Arrange
        final dioException = DioException(
          requestOptions: RequestOptions(path: '/test'),
          type: DioExceptionType.unknown,
        );

        // Act
        final result = ErrorHandler.getErrorMessage(dioException);

        // Assert
        expect(result, 'Network error. Please check your connection.');
      });

      test('should handle DioException with no response', () {
        // Arrange
        final dioException = DioException(
          requestOptions: RequestOptions(path: '/test'),
          type: DioExceptionType.badResponse,
          response: null,
        );

        // Act
        final result = ErrorHandler.getErrorMessage(dioException);

        // Assert
        expect(result, 'Server error (unknown)');
      });

      test('should handle generic exceptions', () {
        // Arrange
        final exception = Exception('Something went wrong');

        // Act
        final result = ErrorHandler.getErrorMessage(exception);

        // Assert
        expect(result, 'An unexpected error occurred');
      });

      test('should handle null errors', () {
        // Act
        final result = ErrorHandler.getErrorMessage(null);

        // Assert
        expect(result, 'An unexpected error occurred');
      });

      test('should handle string errors', () {
        // Act
        final result = ErrorHandler.getErrorMessage('Custom error message');

        // Assert
        expect(result, 'An unexpected error occurred');
      });
    });

    group('getValidationErrors', () {
      test('should extract validation errors from ValidationException', () {
        // Arrange
        final errors = {
          'email': ['Email is required', 'Email format is invalid'],
          'password': ['Password is too short'],
        };
        final exception = ValidationException('Validation failed', errors);

        // Act
        final result = ErrorHandler.getValidationErrors(exception);

        // Assert
        expect(result, errors);
      });

      test('should return empty map for non-validation exceptions', () {
        // Arrange
        final exception = AuthException('Invalid credentials');

        // Act
        final result = ErrorHandler.getValidationErrors(exception);

        // Assert
        expect(result, isEmpty);
      });
    });

    group('isNetworkError', () {
      test('should return true for NetworkException', () {
        // Arrange
        final exception = NetworkException('Connection failed');

        // Act
        final result = ErrorHandler.isNetworkError(exception);

        // Assert
        expect(result, true);
      });

      test('should return true for DioException with network-related types', () {
        final networkTypes = [
          DioExceptionType.connectionTimeout,
          DioExceptionType.sendTimeout,
          DioExceptionType.receiveTimeout,
          DioExceptionType.unknown,
        ];

        for (final type in networkTypes) {
          // Arrange
          final exception = DioException(
            requestOptions: RequestOptions(path: '/test'),
            type: type,
          );

          // Act
          final result = ErrorHandler.isNetworkError(exception);

          // Assert
          expect(result, true, reason: 'Should be true for $type');
        }
      });

      test('should return false for non-network DioException types', () {
        final nonNetworkTypes = [
          DioExceptionType.badResponse,
          DioExceptionType.cancel,
        ];

        for (final type in nonNetworkTypes) {
          // Arrange
          final exception = DioException(
            requestOptions: RequestOptions(path: '/test'),
            type: type,
          );

          // Act
          final result = ErrorHandler.isNetworkError(exception);

          // Assert
          expect(result, false, reason: 'Should be false for $type');
        }
      });

      test('should return false for non-network exceptions', () {
        // Arrange
        final exception = AuthException('Invalid credentials');

        // Act
        final result = ErrorHandler.isNetworkError(exception);

        // Assert
        expect(result, false);
      });
    });
  });
}