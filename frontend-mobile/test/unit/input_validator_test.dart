import 'package:flutter_test/flutter_test.dart';

import 'package:wayrapp_mobile/core/utils/input_validator.dart';
import 'package:wayrapp_mobile/core/errors/exceptions.dart';

void main() {
  group('InputValidator', () {
    group('validateEmail', () {
      test('should return null for valid email addresses', () {
        final validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'user+tag@example.org',
          'user123@test-domain.com',
          'a@b.co',
        ];

        for (final email in validEmails) {
          final result = InputValidator.validateEmail(email);
          expect(result, null, reason: 'Should be valid: $email');
        }
      });

      test('should return error message for invalid email addresses', () {
        final invalidEmails = [
          'invalid-email',
          '@example.com',
          'user@',
          'user@.com',
          'user..name@example.com',
          'user@example.',
          '',
          ' ',
        ];

        for (final email in invalidEmails) {
          final result = InputValidator.validateEmail(email);
          expect(result, isNotNull, reason: 'Should be invalid: $email');
          expect(result, contains('valid email'));
        }
      });

      test('should return error message for null email', () {
        final result = InputValidator.validateEmail(null);
        expect(result, 'Email is required');
      });

      test('should handle very long emails', () {
        final longEmail = 'a' * 250 + '@example.com';
        final result = InputValidator.validateEmail(longEmail);
        expect(result, 'Email is too long');
      });
    });

    group('validatePassword', () {
      test('should return null for valid strong passwords', () {
        final validPasswords = [
          'MySecureP@ssw0rd',
          'Password123!',
          'StrongP@ss1',
        ];

        for (final password in validPasswords) {
          final result = InputValidator.validatePassword(password, requireStrong: true);
          expect(result, null, reason: 'Should be valid: $password');
        }
      });

      test('should return null for valid weak passwords when not requiring strong', () {
        final weakPasswords = [
          'password123',
          'abcdefgh',
          'simple12',
        ];

        for (final password in weakPasswords) {
          final result = InputValidator.validatePassword(password, requireStrong: false);
          expect(result, null, reason: 'Should be valid: $password');
        }
      });

      test('should return error message for short passwords', () {
        final shortPasswords = [
          '',
          'a',
          'ab',
          'abc',
          'abcd',
          'abcde',
          'abcdef',
          'abcdefg', // 7 characters - too short
        ];

        for (final password in shortPasswords) {
          final result = InputValidator.validatePassword(password);
          expect(result, isNotNull, reason: 'Should be invalid: $password');
          expect(result, contains('at least 8 characters'));
        }
      });

      test('should return error message for long passwords', () {
        final longPassword = 'A' * 129 + '1!'; // 131 characters - too long
        final result = InputValidator.validatePassword(longPassword);
        expect(result, isNotNull);
        expect(result, contains('too long'));
      });

      test('should return error message for null password', () {
        final result = InputValidator.validatePassword(null);
        expect(result, 'Password is required');
      });

      test('should enforce strong password requirements', () {
        final weakPasswords = {
          'password123': 'uppercase letter',
          'PASSWORD123': 'lowercase letter',
          'PasswordABC': 'number',
          'Password123': 'special character',
        };

        weakPasswords.forEach((password, expectedError) {
          final result = InputValidator.validatePassword(password, requireStrong: true);
          expect(result, isNotNull, reason: 'Should be invalid: $password');
          expect(result, contains(expectedError));
        });
      });
    });

    group('validatePasswordConfirmation', () {
      test('should return null when passwords match', () {
        final result = InputValidator.validatePasswordConfirmation('password123', 'password123');
        expect(result, null);
      });

      test('should return error when passwords do not match', () {
        final result = InputValidator.validatePasswordConfirmation('password123', 'different123');
        expect(result, 'Passwords do not match');
      });

      test('should return error for null confirmation', () {
        final result = InputValidator.validatePasswordConfirmation('password123', null);
        expect(result, 'Password confirmation is required');
      });

      test('should return error for empty confirmation', () {
        final result = InputValidator.validatePasswordConfirmation('password123', '');
        expect(result, 'Password confirmation is required');
      });
    });

    group('validateName', () {
      test('should return null for valid names', () {
        final validNames = [
          'John Doe',
          'Alice',
          'Bob Smith Jr.',
          'María García',
        ];

        for (final name in validNames) {
          final result = InputValidator.validateName(name, required: false);
          expect(result, null, reason: 'Should be valid: $name');
        }
      });

      test('should return null for null name when not required', () {
        final result = InputValidator.validateName(null, required: false);
        expect(result, null);
      });

      test('should return error for null name when required', () {
        final result = InputValidator.validateName(null, required: true);
        expect(result, 'Name is required');
      });

      test('should return error for empty name when required', () {
        final result = InputValidator.validateName('', required: true);
        expect(result, 'Name is required');
      });

      test('should return error for long names', () {
        final longName = 'a' * 101; // 101 characters - too long
        final result = InputValidator.validateName(longName);
        expect(result, isNotNull);
        expect(result, contains('too long'));
      });

      test('should return error for names with dangerous characters', () {
        final dangerousNames = [
          'John<script>',
          'Alice"test',
          "Bob'test",
          'Eve>test',
        ];

        for (final name in dangerousNames) {
          final result = InputValidator.validateName(name);
          expect(result, isNotNull, reason: 'Should be invalid: $name');
          expect(result, contains('invalid characters'));
        }
      });
    });

    group('validateServerUrl', () {
      test('should return null for valid URLs', () {
        final validUrls = [
          'https://example.com',
          'http://test.org',
          'https://api.wayrapp.com/v1',
          'https://subdomain.example.co.uk',
          'http://localhost:3000',
          'https://192.168.1.1:8080',
        ];

        for (final url in validUrls) {
          final result = InputValidator.validateServerUrl(url);
          expect(result, null, reason: 'Should be valid: $url');
        }
      });

      test('should return error message for invalid URLs', () {
        final invalidUrls = [
          'not-a-url',
          'ftp://example.com', // unsupported scheme
          'example.com', // missing scheme
          'https://',
          'https://.',
          '',
          ' ',
        ];

        for (final url in invalidUrls) {
          final result = InputValidator.validateServerUrl(url);
          expect(result, isNotNull, reason: 'Should be invalid: $url');
        }
      });

      test('should return error message for null URL', () {
        final result = InputValidator.validateServerUrl(null);
        expect(result, 'Server URL is required');
      });
    });

    group('sanitizeInput', () {
      test('should remove potentially dangerous characters', () {
        final testCases = {
          '<script>alert("xss")</script>': 'scriptalert(xss)/script',
          'user"name': 'username',
          "user'name": 'username',
          'user<name>': 'username',
          '  spaced input  ': 'spaced input',
          'normal_input-123': 'normal_input-123',
        };

        testCases.forEach((input, expected) {
          final result = InputValidator.sanitizeInput(input);
          expect(result, expected, reason: 'Input: $input');
        });
      });

      test('should handle empty input', () {
        final result = InputValidator.sanitizeInput('');
        expect(result, '');
      });
    });

    group('validateAndSanitizeEmail', () {
      test('should return sanitized email for valid input', () {
        final result = InputValidator.validateAndSanitizeEmail('  TEST@EXAMPLE.COM  ');
        expect(result, 'test@example.com');
      });

      test('should throw ValidationException for invalid email', () {
        expect(
          () => InputValidator.validateAndSanitizeEmail('invalid-email'),
          throwsA(isA<ValidationException>()),
        );
      });
    });

    group('validateLoginCredentials', () {
      test('should not throw for valid credentials', () {
        expect(
          () => InputValidator.validateLoginCredentials('test@example.com', 'password123'),
          returnsNormally,
        );
      });

      test('should throw ValidationException for invalid credentials', () {
        expect(
          () => InputValidator.validateLoginCredentials('invalid-email', '123'),
          throwsA(isA<ValidationException>()),
        );
      });
    });

    group('validateRegistrationData', () {
      test('should not throw for valid registration data', () {
        expect(
          () => InputValidator.validateRegistrationData(
            'test@example.com',
            'StrongP@ss1',
            'StrongP@ss1',
            'Test User',
          ),
          returnsNormally,
        );
      });

      test('should throw ValidationException for invalid registration data', () {
        expect(
          () => InputValidator.validateRegistrationData(
            'invalid-email',
            'weak',
            'different',
            null,
          ),
          throwsA(isA<ValidationException>()),
        );
      });
    });

    group('edge cases', () {
      test('should handle unicode characters in email', () {
        final unicodeEmail = 'tëst@éxample.com';
        final result = InputValidator.validateEmail(unicodeEmail);
        expect(result, null);
      });

      test('should handle unicode characters in name', () {
        final unicodeName = 'José María';
        final result = InputValidator.validateName(unicodeName);
        expect(result, null);
      });

      test('should handle very long inputs gracefully', () {
        final veryLongInput = 'a' * 1000;
        
        // Should handle without throwing
        expect(() => InputValidator.validateEmail(veryLongInput), returnsNormally);
        expect(() => InputValidator.validatePassword(veryLongInput), returnsNormally);
        expect(() => InputValidator.validateName(veryLongInput), returnsNormally);
        expect(() => InputValidator.sanitizeInput(veryLongInput), returnsNormally);
      });

      test('should handle malformed URLs gracefully', () {
        final malformedUrls = [
          'ht://invalid',
          'https:////',
          'https://.',
          'https://[invalid]',
        ];

        for (final url in malformedUrls) {
          expect(() => InputValidator.validateServerUrl(url), returnsNormally);
        }
      });
    });
  });
}