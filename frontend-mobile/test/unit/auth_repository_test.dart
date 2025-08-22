import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';
import 'package:dio/dio.dart';

import 'package:wayrapp_mobile/features/authentication/data/repositories/auth_repository_impl.dart';
import 'package:wayrapp_mobile/features/authentication/domain/models/user.dart';
import 'package:wayrapp_mobile/features/authentication/domain/models/auth_response.dart';
import 'package:wayrapp_mobile/core/network/api_client.dart';
import 'package:wayrapp_mobile/core/storage/secure_storage_service.dart';
import 'package:wayrapp_mobile/core/errors/exceptions.dart';

import 'auth_repository_test.mocks.dart';

@GenerateMocks([ApiClient, SecureStorageService])
void main() {
  group('AuthRepositoryImpl', () {
    late MockApiClient mockApiClient;
    late MockSecureStorageService mockSecureStorage;
    late AuthRepositoryImpl repository;

    setUp(() {
      mockApiClient = MockApiClient();
      mockSecureStorage = MockSecureStorageService();
      repository = AuthRepositoryImpl(
        apiClient: mockApiClient,
        secureStorage: mockSecureStorage,
      );
    });

    group('login', () {
      test('should return AuthResponse on successful login', () async {
        // Arrange
        final mockResponseData = {
          'success': true,
          'data': {
            'user': {
              'id': '1',
              'email': 'test@example.com',
              'username': 'testuser',
              'role': 'student',
            },
            'tokens': {
              'accessToken': 'test_access_token',
              'refreshToken': 'test_refresh_token',
            },
          },
        };

        final mockResponse = Response(
          requestOptions: RequestOptions(path: ''),
          data: mockResponseData,
          statusCode: 200,
        );

        when(mockApiClient.post('/api/v1/auth/login', data: anyNamed('data')))
            .thenAnswer((_) async => mockResponse);
        when(mockSecureStorage.storeTokens(any, any))
            .thenAnswer((_) async {});
        when(mockSecureStorage.storeUser(any))
            .thenAnswer((_) async {});

        // Act
        final result = await repository.login('test@example.com', 'password');

        // Assert
        expect(result.token, 'test_access_token');
        expect(result.refreshToken, 'test_refresh_token');
        expect(result.user.email, 'test@example.com');
        expect(result.user.username, 'testuser');
        expect(result.user.role, UserRole.student);

        verify(mockApiClient.post('/api/v1/auth/login', data: {
          'email': 'test@example.com',
          'password': 'password',
        }));
        verify(mockSecureStorage.storeTokens('test_access_token', 'test_refresh_token'));
        verify(mockSecureStorage.storeUser(any));
      });

      test('should throw AuthException on login failure', () async {
        // Arrange
        when(mockApiClient.post('/api/v1/auth/login', data: anyNamed('data')))
            .thenThrow(DioException(
              requestOptions: RequestOptions(path: ''),
              response: Response(
                requestOptions: RequestOptions(path: ''),
                statusCode: 401,
                data: {'message': 'Invalid credentials'},
              ),
            ));

        // Act & Assert
        expect(
          () => repository.login('test@example.com', 'wrong_password'),
          throwsA(isA<AuthException>()),
        );
      });

      test('should handle network errors', () async {
        // Arrange
        when(mockApiClient.post('/api/v1/auth/login', data: anyNamed('data')))
            .thenThrow(DioException(
              requestOptions: RequestOptions(path: ''),
              type: DioExceptionType.connectionTimeout,
            ));

        // Act & Assert
        expect(
          () => repository.login('test@example.com', 'password'),
          throwsA(isA<NetworkException>()),
        );
      });
    });

    group('register', () {
      test('should return AuthResponse on successful registration', () async {
        // Arrange
        final mockResponseData = {
          'success': true,
          'data': {
            'user': {
              'id': '2',
              'email': 'newuser@example.com',
              'username': 'newuser',
              'role': 'student',
            },
            'tokens': {
              'accessToken': 'new_access_token',
              'refreshToken': 'new_refresh_token',
            },
          },
        };

        final mockResponse = Response(
          requestOptions: RequestOptions(path: ''),
          data: mockResponseData,
          statusCode: 201,
        );

        when(mockApiClient.post('/api/v1/auth/register', data: anyNamed('data')))
            .thenAnswer((_) async => mockResponse);
        when(mockSecureStorage.storeTokens(any, any))
            .thenAnswer((_) async {});
        when(mockSecureStorage.storeUser(any))
            .thenAnswer((_) async {});

        // Act
        final result = await repository.register(
          'newuser@example.com',
          'password123',
          'newuser',
        );

        // Assert
        expect(result.token, 'new_access_token');
        expect(result.refreshToken, 'new_refresh_token');
        expect(result.user.email, 'newuser@example.com');
        expect(result.user.username, 'newuser');

        verify(mockApiClient.post('/api/v1/auth/register', data: {
          'email': 'newuser@example.com',
          'password': 'password123',
          'username': 'newuser',
        }));
      });

      test('should throw ValidationException on invalid data', () async {
        // Arrange
        when(mockApiClient.post('/api/v1/auth/register', data: anyNamed('data')))
            .thenThrow(DioException(
              requestOptions: RequestOptions(path: ''),
              response: Response(
                requestOptions: RequestOptions(path: ''),
                statusCode: 400,
                data: {
                  'message': 'Validation failed',
                  'errors': {
                    'email': ['Email already exists'],
                    'password': ['Password too weak'],
                  },
                },
              ),
            ));

        // Act & Assert
        expect(
          () => repository.register('existing@example.com', '123', 'user'),
          throwsA(isA<ValidationException>()),
        );
      });
    });

    group('logout', () {
      test('should clear stored tokens on logout', () async {
        // Arrange
        when(mockApiClient.post('/api/v1/auth/logout'))
            .thenAnswer((_) async => Response(
              requestOptions: RequestOptions(path: ''),
              statusCode: 200,
            ));
        when(mockSecureStorage.clearAll())
            .thenAnswer((_) async {});

        // Act
        await repository.logout();

        // Assert
        verify(mockApiClient.post('/api/v1/auth/logout'));
        verify(mockSecureStorage.clearAll());
      });

      test('should clear tokens even if API call fails', () async {
        // Arrange
        when(mockApiClient.post('/api/v1/auth/logout'))
            .thenThrow(DioException(
              requestOptions: RequestOptions(path: ''),
              type: DioExceptionType.connectionTimeout,
            ));
        when(mockSecureStorage.clearAll())
            .thenAnswer((_) async {});

        // Act
        await repository.logout();

        // Assert
        verify(mockSecureStorage.clearAll());
      });
    });

    group('isAuthenticated', () {
      test('should return true when valid token exists', () async {
        // Arrange
        when(mockSecureStorage.getToken())
            .thenAnswer((_) async => 'valid_token');

        // Act
        final result = await repository.isAuthenticated();

        // Assert
        expect(result, true);
      });

      test('should return false when no token exists', () async {
        // Arrange
        when(mockSecureStorage.getToken())
            .thenAnswer((_) async => null);

        // Act
        final result = await repository.isAuthenticated();

        // Assert
        expect(result, false);
      });
    });

    group('getCurrentUser', () {
      test('should return user when stored', () async {
        // Arrange
        final mockUser = User(
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
          role: UserRole.student,
        );

        when(mockSecureStorage.getUser())
            .thenAnswer((_) async => mockUser);

        // Act
        final result = await repository.getCurrentUser();

        // Assert
        expect(result, mockUser);
      });

      test('should return null when no user stored', () async {
        // Arrange
        when(mockSecureStorage.getUser())
            .thenAnswer((_) async => null);

        // Act
        final result = await repository.getCurrentUser();

        // Assert
        expect(result, null);
      });
    });

    group('refreshToken', () {
      test('should return new AuthResponse on successful refresh', () async {
        // Arrange
        when(mockSecureStorage.getRefreshToken())
            .thenAnswer((_) async => 'valid_refresh_token');

        final mockResponseData = {
          'success': true,
          'data': {
            'user': {
              'id': '1',
              'email': 'test@example.com',
              'username': 'testuser',
              'role': 'student',
            },
            'tokens': {
              'accessToken': 'new_access_token',
              'refreshToken': 'new_refresh_token',
            },
          },
        };

        final mockResponse = Response(
          requestOptions: RequestOptions(path: ''),
          data: mockResponseData,
          statusCode: 200,
        );

        when(mockApiClient.post('/api/v1/auth/refresh', data: anyNamed('data')))
            .thenAnswer((_) async => mockResponse);
        when(mockSecureStorage.storeTokens(any, any))
            .thenAnswer((_) async {});
        when(mockSecureStorage.storeUser(any))
            .thenAnswer((_) async {});

        // Act
        final result = await repository.refreshToken();

        // Assert
        expect(result?.token, 'new_access_token');
        expect(result?.refreshToken, 'new_refresh_token');
        verify(mockApiClient.post('/api/v1/auth/refresh', data: {
          'refreshToken': 'valid_refresh_token',
        }));
      });

      test('should return null when no refresh token exists', () async {
        // Arrange
        when(mockSecureStorage.getRefreshToken())
            .thenAnswer((_) async => null);

        // Act
        final result = await repository.refreshToken();

        // Assert
        expect(result, null);
      });

      test('should throw AuthException on invalid refresh token', () async {
        // Arrange
        when(mockSecureStorage.getRefreshToken())
            .thenAnswer((_) async => 'invalid_refresh_token');
        when(mockApiClient.post('/api/v1/auth/refresh', data: anyNamed('data')))
            .thenThrow(DioException(
              requestOptions: RequestOptions(path: ''),
              response: Response(
                requestOptions: RequestOptions(path: ''),
                statusCode: 401,
                data: {'message': 'Invalid refresh token'},
              ),
            ));

        // Act & Assert
        expect(
          () => repository.refreshToken(),
          throwsA(isA<AuthException>()),
        );
      });
    });
  });
}