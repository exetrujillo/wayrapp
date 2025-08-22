import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../authentication/presentation/providers/auth_provider.dart';
import '../../../server_selection/presentation/providers/server_config_provider.dart';

/// Dashboard screen showing main navigation and user information
class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        actions: [
          // User menu with logout and server change options
          Consumer<AuthProvider>(
            builder: (context, authProvider, child) {
              final user = authProvider.currentUser;
              return PopupMenuButton<String>(
                icon: CircleAvatar(
                  backgroundColor: Theme.of(context).colorScheme.primary,
                  child: Text(
                    user?.name.isNotEmpty == true 
                        ? user!.name[0].toUpperCase()
                        : 'U',
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.onPrimary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                onSelected: (value) {
                  if (value == 'logout') {
                    _logout(context);
                  } else if (value == 'change_server') {
                    _changeServer(context);
                  }
                },
                itemBuilder: (context) => [
                  PopupMenuItem(
                    value: 'user_info',
                    enabled: false,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user?.name ?? 'User',
                          style: Theme.of(context).textTheme.titleSmall,
                        ),
                        Text(
                          user?.email ?? '',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        const Divider(),
                      ],
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'change_server',
                    child: ListTile(
                      leading: Icon(Icons.cloud),
                      title: Text('Change Server'),
                      contentPadding: EdgeInsets.zero,
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'logout',
                    child: ListTile(
                      leading: Icon(Icons.logout),
                      title: Text('Logout'),
                      contentPadding: EdgeInsets.zero,
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            Consumer<AuthProvider>(
              builder: (context, authProvider, child) {
                final user = authProvider.currentUser;
                return UserAccountsDrawerHeader(
                  accountName: Text(user?.name ?? 'User'),
                  accountEmail: Text(user?.email ?? ''),
                  currentAccountPicture: CircleAvatar(
                    backgroundColor: Theme.of(context).colorScheme.onPrimary,
                    child: Text(
                      user?.name.isNotEmpty == true 
                          ? user!.name[0].toUpperCase()
                          : 'U',
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.primary,
                        fontWeight: FontWeight.bold,
                        fontSize: 24,
                      ),
                    ),
                  ),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primary,
                  ),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.dashboard),
              title: const Text('Dashboard'),
              selected: true,
              onTap: () => Navigator.pop(context),
            ),
            ListTile(
              leading: const Icon(Icons.book),
              title: const Text('Courses'),
              subtitle: const Text('Coming soon'),
              enabled: false,
              onTap: () {
                Navigator.pop(context);
                _showComingSoonDialog(context, 'Course browsing');
              },
            ),
            ListTile(
              leading: const Icon(Icons.quiz),
              title: const Text('Exercises'),
              subtitle: const Text('Coming soon'),
              enabled: false,
              onTap: () {
                Navigator.pop(context);
                _showComingSoonDialog(context, 'Exercise practice');
              },
            ),
            ListTile(
              leading: const Icon(Icons.offline_bolt),
              title: const Text('Offline Content'),
              subtitle: const Text('Coming soon'),
              enabled: false,
              onTap: () {
                Navigator.pop(context);
                _showComingSoonDialog(context, 'Offline functionality');
              },
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.settings),
              title: const Text('Settings'),
              subtitle: const Text('Coming soon'),
              enabled: false,
              onTap: () {
                Navigator.pop(context);
                _showComingSoonDialog(context, 'Settings');
              },
            ),
            ListTile(
              leading: const Icon(Icons.help),
              title: const Text('Help & Support'),
              subtitle: const Text('Coming soon'),
              enabled: false,
              onTap: () {
                Navigator.pop(context);
                _showComingSoonDialog(context, 'Help & Support');
              },
            ),
          ],
        ),
      ),
      body: Consumer2<AuthProvider, ServerConfigProvider>(
        builder: (context, authProvider, serverProvider, child) {
          final user = authProvider.currentUser;
          
          return Padding(
            padding: const EdgeInsets.all(AppConstants.defaultPadding),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Welcome card
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(AppConstants.defaultPadding),
                    child: Column(
                      children: [
                        const Icon(
                          Icons.celebration,
                          size: 64,
                          color: Color(AppConstants.primaryColorValue),
                        ),
                        const SizedBox(height: AppConstants.defaultPadding),
                        Text(
                          'Welcome to WayrApp!',
                          style: Theme.of(context).textTheme.headlineSmall,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: AppConstants.smallPadding),
                        if (user != null) ...[
                          Text(
                            'Hello, ${user.name}!',
                            style: Theme.of(context).textTheme.bodyLarge,
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: AppConstants.smallPadding),
                          Text(
                            'Role: ${user.role.name.toUpperCase()}',
                            style: Theme.of(context).textTheme.bodyMedium,
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: AppConstants.defaultPadding),

                // Server info card
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(AppConstants.defaultPadding),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.cloud_done, color: Colors.green),
                            const SizedBox(width: AppConstants.smallPadding),
                            Text(
                              'Connected to Server',
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                          ],
                        ),
                        const SizedBox(height: AppConstants.smallPadding),
                        Text(
                          serverProvider.serverUrl ?? 'Unknown',
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ],
                    ),
                  ),
                ),
                const Spacer(),

                // Status info
                Container(
                  padding: const EdgeInsets.all(AppConstants.defaultPadding),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    children: [
                      Text(
                        'Flutter Migration - Phase 1 Complete! ✅',
                        style: Theme.of(context).textTheme.titleSmall,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: AppConstants.smallPadding),
                      Text(
                        'Server selection and authentication are working perfectly.',
                        style: Theme.of(context).textTheme.bodySmall,
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  /// Shows logout confirmation dialog
  void _logout(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              context.read<AuthProvider>().logout();
              context.go('/login');
            },
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }

  /// Shows server change confirmation dialog
  void _changeServer(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Change Server'),
        content: const Text('This will log you out and return to server selection.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              context.read<AuthProvider>().logout();
              context.read<ServerConfigProvider>().clearServer();
              context.go('/server-selection');
            },
            child: const Text('Change Server'),
          ),
        ],
      ),
    );
  }

  /// Shows coming soon dialog for future features
  void _showComingSoonDialog(BuildContext context, String feature) {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Coming Soon'),
        content: Text('$feature will be available in the next development phase.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }
}