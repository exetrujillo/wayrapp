import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../storage/secure_storage_service.dart';
import '../errors/exceptions.dart';

/// HTTP API client with automatic token management
/// 
/// Provides configured Dio instance with automatic JWT token injection,
/// token refresh logic, and comprehensive error handling for API communication.
class ApiClient {
  late final Dio _dio;
  final String baseUrl;
  bool _isRefreshing = false;

  ApiClient({required this.baseUrl}) {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      sendTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    _setupInterceptors();
  }

  /// Configures request/response interceptors
  void _setupInterceptors() {
    // Request interceptor - Add authentication token
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        try {
          final token = await SecureStorageService.getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        } catch (e) {
          handler.reject(
            DioException(
              requestOptions: options,
              error: 'Failed to add authentication token: $e',
              type: DioExceptionType.unknown,
            ),
          );
        }
      },
      onError: (error, handler) async {
        // Handle 401 Unauthorized - attempt token refresh
        if (error.response?.statusCode == 401 && !_isRefreshing) {
          try {
            final refreshed = await _refreshToken();
            if (refreshed) {
              // Retry original request with new token
              final clonedRequest = await _retryRequest(error.requestOptions);
              handler.resolve(clonedRequest);
              return;
            }
          } catch (e) {
            // Refresh failed, clear auth data and continue with original error
            await SecureStorageService.clearAuthData();
          }
        }
        
        // Convert DioException to appropriate app exception
        final appException = _handleDioError(error);
        handler.reject(
          DioException(
            requestOptions: error.requestOptions,
            error: appException,
            type: error.type,
            response: error.response,
          ),
        );
      },
    ));

    // Logging interceptor (development only)
    if (kDebugMode) {
      _dio.interceptors.add(LogInterceptor(
        requestBody: true,
        responseBody: true,
        requestHeader: false, // Don't log auth headers
        logPrint: (object) => debugPrint('[API] $object'),
      ));
    }
  }

  /// Attempts to refresh authentication token
  /// 
  /// @returns Future&lt;bool&gt; True if refresh successful, false otherwise
  Future<bool> _refreshToken() async {
    if (_isRefreshing) return false;
    
    _isRefreshing = true;
    try {
      final refreshToken = await SecureStorageService.getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        return false;
      }

      final response = await _dio.post<Map<String, dynamic>>(
        '/api/v1/auth/refresh',
        data: {'refreshToken': refreshToken},
        options: Options(
          headers: {'Authorization': null}, // Don't include old token
        ),
      );

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        final newToken = data['token'] as String?;
        final newRefreshToken = data['refreshToken'] as String?;

        if (newToken != null && newRefreshToken != null) {
          await SecureStorageService.storeTokens(newToken, newRefreshToken);
          return true;
        }
      }
      return false;
    } catch (e) {
      debugPrint('[API] Token refresh failed: $e');
      return false;
    } finally {
      _isRefreshing = false;
    }
  }

  /// Retries failed request with new authentication token
  /// 
  /// @param requestOptions Original request options
  /// @returns Future&lt;Response&lt;dynamic&gt;&gt; Response from retried request
  Future<Response<dynamic>> _retryRequest(RequestOptions requestOptions) async {
    final token = await SecureStorageService.getToken();
    if (token != null) {
      requestOptions.headers['Authorization'] = 'Bearer $token';
    }

    return await _dio.request(
      requestOptions.path,
      options: Options(
        method: requestOptions.method,
        headers: requestOptions.headers,
        responseType: requestOptions.responseType,
        contentType: requestOptions.contentType,
        validateStatus: requestOptions.validateStatus,
        receiveTimeout: requestOptions.receiveTimeout,
        sendTimeout: requestOptions.sendTimeout,
      ),
      data: requestOptions.data,
      queryParameters: requestOptions.queryParameters,
    );
  }

  /// Converts DioException to appropriate application exception
  /// 
  /// @param error DioException from network request
  /// @returns AppException Appropriate application exception
  AppException _handleDioError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return const NetworkException(
          'Connection timeout. Please check your internet connection.',
          code: 'TIMEOUT',
        );
      
      case DioExceptionType.badResponse:
        return _handleHttpError(error.response);
      
      case DioExceptionType.cancel:
        return const NetworkException('Request was cancelled', code: 'CANCELLED');
      
      case DioExceptionType.unknown:
        if (error.error is SocketException) {
          return const NetworkException(
            'No internet connection. Please check your network.',
            code: 'NO_INTERNET',
          );
        }
        return const NetworkException(
          'Network error occurred. Please try again.',
          code: 'UNKNOWN',
        );
      
      default:
        return const NetworkException(
          'An unexpected error occurred.',
          code: 'UNEXPECTED',
        );
    }
  }

  /// Handles HTTP response errors
  /// 
  /// @param response HTTP response with error status
  /// @returns AppException Appropriate application exception
  AppException _handleHttpError(Response<dynamic>? response) {
    final statusCode = response?.statusCode;
    final data = response?.data;

    switch (statusCode) {
      case 400:
        if (data is Map<String, dynamic> && data.containsKey('errors')) {
          return ValidationException(
            'Validation failed',
            data['errors'] as Map<String, dynamic>,
            code: 'VALIDATION_ERROR',
          );
        }
        return const ValidationException(
          'Invalid request. Please check your input.',
          {},
          code: 'BAD_REQUEST',
        );
      
      case 401:
        return const AuthException(
          'Authentication failed. Please log in again.',
          code: 'UNAUTHORIZED',
        );
      
      case 403:
        return const AuthException(
          'Access denied. You don\'t have permission.',
          code: 'FORBIDDEN',
        );
      
      case 404:
        return const NetworkException(
          'Resource not found.',
          code: 'NOT_FOUND',
        );
      
      case 429:
        return const NetworkException(
          'Too many requests. Please try again later.',
          code: 'RATE_LIMITED',
        );
      
      case 500:
      case 502:
      case 503:
      case 504:
        return ServerException(
          'Server error. Please try again later.',
          statusCode: statusCode,
          code: 'SERVER_ERROR',
        );
      
      default:
        return ServerException(
          'Server error (${statusCode ?? 'unknown'})',
          statusCode: statusCode,
          code: 'HTTP_ERROR',
        );
    }
  }

  // HTTP Methods

  /// Performs GET request
  /// 
  /// @param path API endpoint path
  /// @param queryParameters Optional query parameters
  /// @returns Future&lt;Response&lt;dynamic&gt;&gt; HTTP response
  Future<Response<dynamic>> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) {
    return _dio.get(path, queryParameters: queryParameters, options: options);
  }

  /// Performs POST request
  /// 
  /// @param path API endpoint path
  /// @param data Request body data
  /// @returns Future&lt;Response&lt;dynamic&gt;&gt; HTTP response
  Future<Response<dynamic>> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) {
    return _dio.post(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }

  /// Performs PUT request
  /// 
  /// @param path API endpoint path
  /// @param data Request body data
  /// @returns Future&lt;Response&lt;dynamic&gt;&gt; HTTP response
  Future<Response<dynamic>> put(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) {
    return _dio.put(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }

  /// Performs PATCH request
  /// 
  /// @param path API endpoint path
  /// @param data Request body data
  /// @returns Future&lt;Response&lt;dynamic&gt;&gt; HTTP response
  Future<Response<dynamic>> patch(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) {
    return _dio.patch(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }

  /// Performs DELETE request
  /// 
  /// @param path API endpoint path
  /// @returns Future&lt;Response&lt;dynamic&gt;&gt; HTTP response
  Future<Response<dynamic>> delete(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) {
    return _dio.delete(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }

  /// Downloads file from URL
  /// 
  /// @param urlPath File URL path
  /// @param savePath Local file save path
  /// @param onReceiveProgress Progress callback
  /// @returns Future&lt;Response&lt;dynamic&gt;&gt; Download response
  Future<Response<dynamic>> download(
    String urlPath,
    String savePath, {
    ProgressCallback? onReceiveProgress,
    Options? options,
  }) {
    return _dio.download(
      urlPath,
      savePath,
      onReceiveProgress: onReceiveProgress,
      options: options,
    );
  }

  /// Gets underlying Dio instance for advanced usage
  /// 
  /// @returns Dio Configured Dio instance
  Dio get dio => _dio;
}