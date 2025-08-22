import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_form_builder/flutter_form_builder.dart';
import 'package:form_builder_validators/form_builder_validators.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../shared/widgets/error_display.dart';
import '../providers/auth_provider.dart';

/// Screen for user authentication (login)
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormBuilderState>();
  bool _obscurePassword = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Login'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          if (authProvider.isAuthenticated) {
            // Auto-navigate to dashboard when authenticated
            WidgetsBinding.instance.addPostFrameCallback((_) {
              context.go('/dashboard');
            });
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(AppConstants.defaultPadding),
            child: FormBuilder(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: AppConstants.largePadding),
                  
                  // App logo/icon
                  const Icon(
                    Icons.school,
                    size: 80,
                    color: Color(AppConstants.primaryColorValue),
                  ),
                  const SizedBox(height: AppConstants.defaultPadding),
                  
                  Text(
                    'Welcome to WayrApp',
                    style: Theme.of(context).textTheme.headlineSmall,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppConstants.smallPadding),
                  
                  Text(
                    'Sign in to continue your language learning journey',
                    style: Theme.of(context).textTheme.bodyMedium,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppConstants.largePadding),

                  // Email field
                  FormBuilderTextField(
                    key: const Key('email_field'),
                    name: 'email',
                    decoration: const InputDecoration(
                      labelText: 'Email',
                      hintText: 'Enter your email address',
                      prefixIcon: Icon(Icons.email),
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    validator: FormBuilderValidators.compose([
                      FormBuilderValidators.required(errorText: 'Email is required'),
                      FormBuilderValidators.email(errorText: 'Please enter a valid email'),
                    ]),
                  ),
                  const SizedBox(height: AppConstants.defaultPadding),

                  // Password field
                  FormBuilderTextField(
                    key: const Key('password_field'),
                    name: 'password',
                    decoration: InputDecoration(
                      labelText: 'Password',
                      hintText: 'Enter your password',
                      prefixIcon: const Icon(Icons.lock),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword ? Icons.visibility : Icons.visibility_off,
                        ),
                        onPressed: () {
                          setState(() {
                            _obscurePassword = !_obscurePassword;
                          });
                        },
                      ),
                      border: const OutlineInputBorder(),
                    ),
                    obscureText: _obscurePassword,
                    textInputAction: TextInputAction.done,
                    validator: FormBuilderValidators.compose([
                      FormBuilderValidators.required(errorText: 'Password is required'),
                      FormBuilderValidators.minLength(
                        AppConstants.minPasswordLength,
                        errorText: 'Password must be at least ${AppConstants.minPasswordLength} characters',
                      ),
                    ]),
                    onSubmitted: (_) => _login(),
                  ),
                  const SizedBox(height: AppConstants.largePadding),

                  // Login button
                  ElevatedButton(
                    onPressed: authProvider.isLoading ? null : _login,
                    child: authProvider.isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Login'),
                  ),
                  const SizedBox(height: AppConstants.defaultPadding),

                  // Register link
                  TextButton(
                    onPressed: () => context.go('/register'),
                    child: const Text('Don\'t have an account? Register'),
                  ),
                  const SizedBox(height: AppConstants.defaultPadding),

                  // Error display
                  if (authProvider.error != null)
                    ErrorDisplay(
                      message: authProvider.error!,
                      onRetry: _login,
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void _login() {
    if (_formKey.currentState!.saveAndValidate()) {
      final formData = _formKey.currentState!.value;
      final authProvider = context.read<AuthProvider>();
      authProvider.login(
        formData['email']?.toString().trim() ?? '',
        formData['password']?.toString() ?? '',
      );
    }
  }
}