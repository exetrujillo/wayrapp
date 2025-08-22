/// Application-wide constants
class AppConstants {
  // App Information
  static const String appName = 'WayrApp Mobile';
  static const String appVersion = '1.0.0';
  
  // API Configuration
  static const String defaultServerUrl = 'https://wayrapp.vercel.app';
  static const String apiVersion = 'v1';
  static const String healthCheckEndpoint = '/health';
  
  // API Endpoints
  static const String loginEndpoint = '/api/v1/auth/login';
  static const String registerEndpoint = '/api/v1/auth/register';
  static const String refreshTokenEndpoint = '/api/v1/auth/refresh';
  static const String logoutEndpoint = '/api/v1/auth/logout';
  static const String coursesEndpoint = '/api/v1/courses';
  
  // Network Configuration
  static const int connectionTimeout = 30000; // 30 seconds
  static const int receiveTimeout = 30000; // 30 seconds
  
  // Storage Keys
  static const String serverUrlKey = 'server_url';
  static const String languageKey = 'selected_language';
  static const String themeKey = 'selected_theme';
  
  // UI Constants
  static const double defaultPadding = 16.0;
  static const double smallPadding = 8.0;
  static const double largePadding = 24.0;
  
  // Colors (WayrApp brand colors)
  static const int primaryColorValue = 0xFF50A8B1;
  
  // Validation
  static const int minPasswordLength = 8;
  static const int maxPasswordLength = 128;
}