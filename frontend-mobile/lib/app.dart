import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'features/server_selection/presentation/screens/server_selection_screen.dart';
import 'features/authentication/presentation/screens/login_screen.dart';
import 'features/authentication/presentation/screens/register_screen.dart';
import 'features/authentication/presentation/providers/auth_provider.dart';
import 'features/server_selection/presentation/providers/server_config_provider.dart';
import 'features/dashboard/presentation/screens/dashboard_screen.dart';
import 'shared/providers/connectivity_provider.dart';
import 'shared/widgets/offline_indicator.dart';

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer3<AuthProvider, ServerConfigProvider, ConnectivityProvider>(
      builder: (context, authProvider, serverProvider, connectivityProvider, child) {
        final router = GoRouter(
          initialLocation: _getInitialRoute(authProvider, serverProvider, connectivityProvider),
          routes: [
            GoRoute(
              path: '/server-selection',
              builder: (context, state) => const ServerSelectionScreen(),
            ),
            GoRoute(
              path: '/login',
              builder: (context, state) => const LoginScreen(),
            ),
            GoRoute(
              path: '/register',
              builder: (context, state) => const RegisterScreen(),
            ),
            GoRoute(
              path: '/dashboard',
              builder: (context, state) => const DashboardScreen(),
            ),
          ],
          redirect: (context, state) {
            final isAuthenticated = authProvider.isAuthenticated;
            final isServerConnected = serverProvider.isConnected;
            final isOnline = connectivityProvider.isConnected;
            final hasOfflineData = authProvider.hasOfflineData;
            
            // Allow offline access if user has cached data
            if (!isOnline && hasOfflineData && state.matchedLocation != '/dashboard') {
              return '/dashboard';
            }
            
            // If not connected to server and online, redirect to server selection
            if (isOnline && !isServerConnected && state.matchedLocation != '/server-selection') {
              return '/server-selection';
            }
            
            // If connected but not authenticated and online, redirect to login
            if (isOnline && isServerConnected && !isAuthenticated && 
                state.matchedLocation != '/login' && 
                state.matchedLocation != '/register') {
              return '/login';
            }
            
            // If authenticated, redirect to dashboard
            if (isAuthenticated && state.matchedLocation == '/login') {
              return '/dashboard';
            }
            
            return null;
          },
        );

        return MaterialApp.router(
          title: 'WayrApp Mobile',
          theme: ThemeData(
            colorScheme: ColorScheme.fromSeed(
              seedColor: const Color(0xFF50A8B1), // WayrApp primary color
            ),
            useMaterial3: true,
          ),
          routerConfig: router,
          builder: (context, child) {
            return Stack(
              children: [
                child!,
                // Floating offline indicator
                const FloatingOfflineIndicator(),
              ],
            );
          },
        );
      },
    );
  }

  String _getInitialRoute(
    AuthProvider authProvider, 
    ServerConfigProvider serverProvider, 
    ConnectivityProvider connectivityProvider,
  ) {
    final isOnline = connectivityProvider.isConnected;
    final hasOfflineData = authProvider.hasOfflineData;
    
    // If offline but has cached data, go to dashboard
    if (!isOnline && hasOfflineData) {
      return '/dashboard';
    }
    
    // If online but no server connection, go to server selection
    if (isOnline && !serverProvider.isConnected) {
      return '/server-selection';
    }
    
    // If online and connected but not authenticated, go to login
    if (isOnline && serverProvider.isConnected && !authProvider.isAuthenticated) {
      return '/login';
    }
    
    // If authenticated, go to dashboard
    if (authProvider.isAuthenticated) {
      return '/dashboard';
    }
    
    // Default fallback
    return '/server-selection';
  }
}