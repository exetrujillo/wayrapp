import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'features/server_selection/presentation/screens/server_selection_screen.dart';
import 'features/authentication/presentation/screens/login_screen.dart';
import 'features/authentication/presentation/screens/register_screen.dart';
import 'features/authentication/presentation/providers/auth_provider.dart';
import 'features/server_selection/presentation/providers/server_config_provider.dart';
import 'features/dashboard/presentation/screens/dashboard_screen.dart';

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer2<AuthProvider, ServerConfigProvider>(
      builder: (context, authProvider, serverProvider, child) {
        final router = GoRouter(
          initialLocation: _getInitialRoute(authProvider, serverProvider),
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
            
            // If not connected to server, redirect to server selection
            if (!isServerConnected && state.matchedLocation != '/server-selection') {
              return '/server-selection';
            }
            
            // If connected but not authenticated, redirect to login
            if (isServerConnected && !isAuthenticated && 
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
        );
      },
    );
  }

  String _getInitialRoute(AuthProvider authProvider, ServerConfigProvider serverProvider) {
    if (!serverProvider.isConnected) {
      return '/server-selection';
    }
    if (!authProvider.isAuthenticated) {
      return '/login';
    }
    return '/dashboard';
  }
}