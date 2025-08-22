import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';

import 'package:wayrapp_mobile/features/authentication/presentation/providers/auth_provider.dart';
import 'package:wayrapp_mobile/features/authentication/domain/repositories/auth_repository.dart';
import 'package:wayrapp_mobile/features/authentication/domain/models/user.dart';
import 'package:wayrapp_mobile/features/authentication/domain/models/auth_response.dart';
import 'package:wayrapp_mobile/core/errors/exceptions.dart';

import 'auth_provider_test.mocks.dart';

@GenerateMocks([AuthRepository])
void main() {
  group('AuthProvider', () {
    late MockAuthRepository mockAuthRepository;
    late AuthProvider authProvider;

    setUp(() {
      mockAuthRepository = MockAuthRepository();
      
      // Default stubs for initialization
      when(mockAuthRepository.isAuthenticated())
          .thenAnswer((_) async => false);
      when(mockAuthRepository.getCurrentUser())
          .thenAnswer((_) async => null);
      
      authProvider = AuthProvider(authRepository: mockAuthRepository);
    });

    group('initialization', () {
      test('should initialize with unauthenticated state', () {
        expect(authProvider.isAuthenticated, false);
        expect(authProvider.currentUser, null);
        expect(authProvider.isLoading, false);
        expect(authProvider.error, null);
      });

      test('should check auth status on initialization', () async {
        // Wait for initialization to complete
        await Future.delayed(Duration.zero);
        
        verify(mockAuthRepository.isAuthenticated());
      });

      test('should set authenticated state if user is already logged in', () async {
        // Arrange
        final mockUser = User(
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
          role: UserRole.student,
        );

        when(mockAuthRepository.isAuthenticated())
            .thenAnswer((_) async => true);
        when(mockAuthRepository.getCurrentUser())
            .thenAnswer((_) async => mockUser);

        // Act
        final provider = AuthProvider(authRepository: mockAuthRepository);
        await Future.delayed(Duration.zero); // Wait for initialization

        // Assert
        expect(provider.isAuthenticated, true);
        expect(provider.currentUser, mockUser);
      });
    });

    group('login', () {
      test('should set loading state during login', () async {
        // Arrange
        final mockAuthResponse = AuthResponse(
          token: 'test_token',
          refreshToken: 'test_refresh_token',
          user: User(
            id: '1',
            email: 'test@example.com',
            username: 'testuser',
            role: UserRole.student,
          ),
        );

        when(mockAuthRepository.login(any, any))
            .thenAnswer((_) async {
          // Simulate delay
          await Future.delayed(const Duration(milliseconds: 100));
          return mockAuthResponse;
        });

        // Act
        final loginFuture = authProvider.login('test@example.com', 'password');
        
        // Assert loading state
        expect(authProvider.isLoading, true);
        
        await loginFuture;
        expect(authProvider.isLoading, false);
      });

      test('should set authenticated state on successful login', () async {
        // Arrange
        final mockUser = User(
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
          role: UserRole.student,
        );
        final mockAuthResponse = AuthResponse(
          token: 'test_token',
          refreshToken: 'test_refresh_token',
          user: mockUser,
        );

        when(mockAuthRepository.login(any, any))
            .thenAnswer((_) async => mockAuthResponse);

        // Act
        await authProvider.login('test@example.com', 'password');

        // Assert
        expect(authProvider.isAuthenticated, true);
        expect(authProvider.currentUser, mockUser);
        expect(authProvider.error, null);
        verify(mockAuthRepository.login('test@example.com', 'password'));
      });

      test('should set error state on login failure', () async {
        // Arrange
        when(mockAuthRepository.login(any, any))
            .thenThrow(AuthException('Invalid credentials'));

        // Act
        await authProvider.login('test@example.com', 'wrong_password');

        // Assert
        expect(authProvider.isAuthenticated, false);
        expect(authProvider.currentUser, null);
        expect(authProvider.error, 'Invalid credentials');
        expect(authProvider.isLoading, false);
      });

      test('should handle network errors during login', () async {
        // Arrange
        when(mockAuthRepository.login(any, any))
            .thenThrow(NetworkException('Connection timeout'));

        // Act
        await authProvider.login('test@example.com', 'password');

        // Assert
        expect(authProvider.isAuthenticated, false);
        expect(authProvider.error, 'Connection timeout');
      });
    });

    group('register', () {
      test('should set authenticated state on successful registration', () async {
        // Arrange
        final mockUser = User(
          id: '2',
          email: 'newuser@example.com',
          username: 'newuser',
          role: UserRole.student,
        );
        final mockAuthResponse = AuthResponse(
          token: 'new_token',
          refreshToken: 'new_refresh_token',
          user: mockUser,
        );

        when(mockAuthRepository.register(any, any, any))
            .thenAnswer((_) async => mockAuthResponse);

        // Act
        await authProvider.register('newuser@example.com', 'password123', 'newuser');

        // Assert
        expect(authProvider.isAuthenticated, true);
        expect(authProvider.currentUser, mockUser);
        expect(authProvider.error, null);
        verify(mockAuthRepository.register('newuser@example.com', 'password123', 'newuser'));
      });

      test('should set error state on registration failure', () async {
        // Arrange
        when(mockAuthRepository.register(any, any, any))
            .thenThrow(ValidationException('Email already exists', {}));

        // Act
        await authProvider.register('existing@example.com', 'password', 'user');

        // Assert
        expect(authProvider.isAuthenticated, false);
        expect(authProvider.currentUser, null);
        expect(authProvider.error, 'Email already exists');
      });

      test('should set loading state during registration', () async {
        // Arrange
        final mockAuthResponse = AuthResponse(
          token: 'token',
          refreshToken: 'refresh_token',
          user: User(
            id: '1',
            email: 'test@example.com',
            username: 'testuser',
            role: UserRole.student,
          ),
        );

        when(mockAuthRepository.register(any, any, any))
            .thenAnswer((_) async {
          await Future.delayed(const Duration(milliseconds: 100));
          return mockAuthResponse;
        });

        // Act
        final registerFuture = authProvider.register('test@example.com', 'password', 'user');
        
        // Assert loading state
        expect(authProvider.isLoading, true);
        
        await registerFuture;
        expect(authProvider.isLoading, false);
      });
    });

    group('logout', () {
      test('should clear authenticated state on logout', () async {
        // Arrange - set initial authenticated state
        final mockUser = User(
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
          role: UserRole.student,
        );
        final mockAuthResponse = AuthResponse(
          token: 'test_token',
          refreshToken: 'test_refresh_token',
          user: mockUser,
        );

        when(mockAuthRepository.login(any, any))
            .thenAnswer((_) async => mockAuthResponse);
        when(mockAuthRepository.logout())
            .thenAnswer((_) async {});

        await authProvider.login('test@example.com', 'password');
        expect(authProvider.isAuthenticated, true);

        // Act
        await authProvider.logout();

        // Assert
        expect(authProvider.isAuthenticated, false);
        expect(authProvider.currentUser, null);
        expect(authProvider.error, null);
        verify(mockAuthRepository.logout());
      });

      test('should clear state even if logout API call fails', () async {
        // Arrange - set initial authenticated state
        final mockUser = User(
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
          role: UserRole.student,
        );
        final mockAuthResponse = AuthResponse(
          token: 'test_token',
          refreshToken: 'test_refresh_token',
          user: mockUser,
        );

        when(mockAuthRepository.login(any, any))
            .thenAnswer((_) async => mockAuthResponse);
        when(mockAuthRepository.logout())
            .thenThrow(NetworkException('Connection failed'));

        await authProvider.login('test@example.com', 'password');

        // Act
        await authProvider.logout();

        // Assert - should still clear state
        expect(authProvider.isAuthenticated, false);
        expect(authProvider.currentUser, null);
      });
    });

    group('error handling', () {
      test('should clear error when starting new login', () async {
        // Arrange - set initial error state
        when(mockAuthRepository.login(any, any))
            .thenThrow(AuthException('Initial error'));
        await authProvider.login('test@example.com', 'wrong_password');
        expect(authProvider.error, 'Initial error');

        // Setup successful login
        final mockAuthResponse = AuthResponse(
          token: 'test_token',
          refreshToken: 'test_refresh_token',
          user: User(
            id: '1',
            email: 'test@example.com',
            username: 'testuser',
            role: UserRole.student,
          ),
        );
        when(mockAuthRepository.login(any, any))
            .thenAnswer((_) async => mockAuthResponse);

        // Act
        await authProvider.login('test@example.com', 'correct_password');

        // Assert
        expect(authProvider.error, null);
        expect(authProvider.isAuthenticated, true);
      });

      test('should clear error when starting new registration', () async {
        // Arrange - set initial error state
        when(mockAuthRepository.register(any, any, any))
            .thenThrow(ValidationException('Initial error', {}));
        await authProvider.register('test@example.com', 'password', 'user');
        expect(authProvider.error, 'Initial error');

        // Setup successful registration
        final mockAuthResponse = AuthResponse(
          token: 'test_token',
          refreshToken: 'test_refresh_token',
          user: User(
            id: '1',
            email: 'test@example.com',
            username: 'testuser',
            role: UserRole.student,
          ),
        );
        when(mockAuthRepository.register(any, any, any))
            .thenAnswer((_) async => mockAuthResponse);

        // Act
        await authProvider.register('test@example.com', 'password', 'user');

        // Assert
        expect(authProvider.error, null);
        expect(authProvider.isAuthenticated, true);
      });
    });

    group('edge cases', () {
      test('should handle initialization error gracefully', () async {
        // Arrange
        when(mockAuthRepository.isAuthenticated())
            .thenThrow(Exception('Storage error'));
        when(mockAuthRepository.logout())
            .thenAnswer((_) async {});

        // Act
        final provider = AuthProvider(authRepository: mockAuthRepository);
        await Future.delayed(Duration.zero);

        // Assert - should fallback to logout
        expect(provider.isAuthenticated, false);
        expect(provider.currentUser, null);
        verify(mockAuthRepository.logout());
      });

      test('should handle null user from getCurrentUser', () async {
        // Arrange
        when(mockAuthRepository.isAuthenticated())
            .thenAnswer((_) async => true);
        when(mockAuthRepository.getCurrentUser())
            .thenAnswer((_) async => null);

        // Act
        final provider = AuthProvider(authRepository: mockAuthRepository);
        await Future.delayed(Duration.zero);

        // Assert - should remain unauthenticated if no user
        expect(provider.isAuthenticated, false);
        expect(provider.currentUser, null);
      });
    });
  });
}