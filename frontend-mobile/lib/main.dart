import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'app.dart';
import 'core/network/api_client.dart';
import 'core/network/connectivity_service.dart';
import 'core/network/request_queue_service.dart';
import 'features/server_selection/presentation/providers/server_config_provider.dart';
import 'features/server_selection/data/repositories/server_repository.dart';
import 'features/authentication/presentation/providers/auth_provider.dart';
import 'features/authentication/data/repositories/auth_repository_impl.dart';
import 'shared/providers/connectivity_provider.dart';
import 'shared/services/local_storage_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize core services
  await LocalStorageService.instance.initialize();
  await ConnectivityService.instance.initialize();
  await RequestQueueService.instance.initialize();
  
  runApp(const WayrApp());
}

class WayrApp extends StatefulWidget {
  const WayrApp({super.key});

  @override
  State<WayrApp> createState() => _WayrAppState();
}

class _WayrAppState extends State<WayrApp> {
  late ConnectivityProvider _connectivityProvider;
  late ServerConfigProvider _serverConfigProvider;
  late AuthProvider _authProvider;

  @override
  void initState() {
    super.initState();
    _initializeProviders();
  }

  void _initializeProviders() {
    // Create API client with default URL (will be updated by server selection)
    final apiClient = ApiClient(baseUrl: 'https://wayrapp.vercel.app');
    final authRepository = AuthRepositoryImpl(apiClient: apiClient);
    
    // Initialize connectivity provider
    _connectivityProvider = ConnectivityProvider();
    _connectivityProvider.initialize();
    
    // Initialize server config provider with connectivity awareness
    _serverConfigProvider = ServerConfigProvider(
      serverRepository: ServerRepositoryImpl(),
      connectivityProvider: _connectivityProvider,
    );
    
    // Initialize auth provider with connectivity awareness
    _authProvider = AuthProvider(
      authRepository: authRepository,
      connectivityProvider: _connectivityProvider,
    );
    
    // Listen to connectivity changes and update other providers
    _connectivityProvider.addListener(_onConnectivityChanged);
  }

  void _onConnectivityChanged() {
    if (_connectivityProvider.isConnected) {
      // Connection restored - trigger sync operations
      _serverConfigProvider.onNetworkRestored();
      _authProvider.syncWithServer();
    }
  }

  @override
  void dispose() {
    _connectivityProvider.removeListener(_onConnectivityChanged);
    _connectivityProvider.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: _connectivityProvider),
        ChangeNotifierProvider.value(value: _serverConfigProvider),
        ChangeNotifierProvider.value(value: _authProvider),
      ],
      child: const MyApp(),
    );
  }
}