import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../shared/widgets/error_display.dart';
import '../providers/server_config_provider.dart';

/// Screen for selecting and connecting to a WayrApp server
class ServerSelectionScreen extends StatefulWidget {
  const ServerSelectionScreen({super.key});

  @override
  State<ServerSelectionScreen> createState() => _ServerSelectionScreenState();
}

class _ServerSelectionScreenState extends State<ServerSelectionScreen> {
  final _formKey = GlobalKey<FormState>();
  final _urlController = TextEditingController();
  bool _useCustomServer = false;

  @override
  void initState() {
    super.initState();
    _urlController.text = AppConstants.defaultServerUrl;
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Select Server'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: Consumer<ServerConfigProvider>(
        builder: (context, serverProvider, child) {

          return SingleChildScrollView(
            padding: const EdgeInsets.all(AppConstants.defaultPadding),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Icon(
                    Icons.cloud,
                    size: 80,
                    color: Color(AppConstants.primaryColorValue),
                  ),
                  const SizedBox(height: AppConstants.largePadding),
                  
                  Text(
                    'Connect to WayrApp Server',
                    style: Theme.of(context).textTheme.headlineSmall,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppConstants.defaultPadding),
                  
                  Text(
                    'Choose a server to connect to for your language learning experience.',
                    style: Theme.of(context).textTheme.bodyMedium,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppConstants.largePadding),

                  // Default server option
                  Card(
                    color: !_useCustomServer 
                        ? Theme.of(context).colorScheme.primaryContainer
                        : null,
                    child: ListTile(
                      leading: Icon(
                        !_useCustomServer ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                        color: !_useCustomServer 
                            ? Theme.of(context).colorScheme.primary
                            : null,
                      ),
                      title: const Text('Official WayrApp Server'),
                      subtitle:const Text(AppConstants.defaultServerUrl),
                      onTap: () {
                        setState(() {
                          _useCustomServer = false;
                          _urlController.text = AppConstants.defaultServerUrl;
                        });
                      },
                    ),
                  ),
                  const SizedBox(height: AppConstants.smallPadding),

                  // Custom server option
                  Card(
                    color: _useCustomServer 
                        ? Theme.of(context).colorScheme.primaryContainer
                        : null,
                    child: ListTile(
                      leading: Icon(
                        _useCustomServer ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                        color: _useCustomServer 
                            ? Theme.of(context).colorScheme.primary
                            : null,
                      ),
                      title: const Text('Custom Server'),
                      subtitle: const Text('Enter your own server URL'),
                      onTap: () {
                        setState(() {
                          _useCustomServer = true;
                          if (_urlController.text == AppConstants.defaultServerUrl) {
                            _urlController.clear();
                          }
                        });
                      },
                    ),
                  ),
                  const SizedBox(height: AppConstants.defaultPadding),

                  // URL input field
                  if (_useCustomServer)
                    TextFormField(
                      controller: _urlController,
                      decoration: const InputDecoration(
                        labelText: 'Server URL',
                        hintText: 'https://your-server.com',
                        prefixIcon: Icon(Icons.link),
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: TextInputType.url,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter a server URL';
                        }
                        if (!_isValidUrl(value)) {
                          return 'Please enter a valid URL';
                        }
                        return null;
                      },
                    ),
                  const SizedBox(height: AppConstants.largePadding),

                  // Connect button
                  ElevatedButton(
                    onPressed: serverProvider.isLoading ? null : _connectToServer,
                    child: serverProvider.isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Connect'),
                  ),
                  const SizedBox(height: AppConstants.defaultPadding),

                  // Error display
                  if (serverProvider.error != null)
                    ErrorDisplay(
                      message: serverProvider.error!,
                      onRetry: _connectToServer,
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void _connectToServer() {
    if (_formKey.currentState!.validate()) {
      final serverProvider = context.read<ServerConfigProvider>();
      serverProvider.setServer(_urlController.text.trim());
    }
  }

  bool _isValidUrl(String url) {
    try {
      final uri = Uri.parse(url.startsWith('http') ? url : 'https://$url');
      return uri.hasScheme && uri.hasAuthority;
    } catch (e) {
      return false;
    }
  }
}