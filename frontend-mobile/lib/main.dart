import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'app.dart';
import 'core/network/api_client.dart';
import 'features/server_selection/presentation/providers/server_config_provider.dart';
import 'features/server_selection/data/repositories/server_repository.dart';
import 'features/authentication/presentation/providers/auth_provider.dart';
import 'features/authentication/data/repositories/auth_repository_impl.dart';
import 'shared/providers/connectivity_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  runApp(const WayrApp());
}

class WayrApp extends StatelessWidget {
  const WayrApp({super.key});

  @override
  Widget build(BuildContext context) {
    // Create API client with default URL (will be updated by server selection)
    final apiClient = ApiClient(baseUrl: 'https://wayrapp.vercel.app');
    final authRepository = AuthRepositoryImpl(apiClient: apiClient);
    
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ConnectivityProvider()),
        ChangeNotifierProvider(create: (_) => ServerConfigProvider(
          serverRepository: ServerRepositoryImpl(),
        )),
        ChangeNotifierProvider(create: (_) => AuthProvider(
          authRepository: authRepository,
        )),
      ],
      child: const MyApp(),
    );
  }
}