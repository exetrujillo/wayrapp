import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_form_builder/flutter_form_builder.dart';
import 'package:form_builder_validators/form_builder_validators.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../shared/widgets/error_display.dart';
import '../providers/auth_provider.dart';

/// Screen for user registration
class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormBuilderState>();
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Register'),
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
                  const SizedBox(height: AppConstants.defaultPadding),
                  
                  // App logo/icon
                  const Icon(
                    Icons.person_add,
                    size: 80,
                    color: Color(AppConstants.primaryColorValue),
                  ),
                  const SizedBox(height: AppConstants.defaultPadding),
                  
                  Text(
                    'Create Account',
                    style: Theme.of(context).textTheme.headlineSmall,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppConstants.smallPadding),
                  
                  Text(
                    'Join WayrApp to start your language learning adventure',
                    style: Theme.of(context).textTheme.bodyMedium,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppConstants.largePadding),

                  // Name field
                  FormBuilderTextField(
                    name: 'name',
                    decoration: const InputDecoration(
                      labelText: 'Full Name (Optional)',
                      hintText: 'Enter your full name',
                      prefixIcon: Icon(Icons.person),
                      border: OutlineInputBorder(),
                    ),
                    textInputAction: TextInputAction.next,
                    textCapitalization: TextCapitalization.words,
                    validator: FormBuilderValidators.compose([
                      // Name is optional, so no required validator
                      FormBuilderValidators.maxLength(100, errorText: 'Name must be less than 100 characters'),
                    ]),
                  ),
                  const SizedBox(height: AppConstants.defaultPadding),

                  // Email field
                  FormBuilderTextField(
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
                    textInputAction: TextInputAction.next,
                    validator: FormBuilderValidators.compose([
                      FormBuilderValidators.required(errorText: 'Password is required'),
                      FormBuilderValidators.minLength(
                        AppConstants.minPasswordLength,
                        errorText: 'Password must be at least ${AppConstants.minPasswordLength} characters',
                      ),
                    ]),
                  ),
                  const SizedBox(height: AppConstants.defaultPadding),

                  // Confirm password field
                  FormBuilderTextField(
                    name: 'confirmPassword',
                    decoration: InputDecoration(
                      labelText: 'Confirm Password',
                      hintText: 'Confirm your password',
                      prefixIcon: const Icon(Icons.lock_outline),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscureConfirmPassword ? Icons.visibility : Icons.visibility_off,
                        ),
                        onPressed: () {
                          setState(() {
                            _obscureConfirmPassword = !_obscureConfirmPassword;
                          });
                        },
                      ),
                      border: const OutlineInputBorder(),
                    ),
                    obscureText: _obscureConfirmPassword,
                    textInputAction: TextInputAction.done,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please confirm your password';
                      }
                      
                      final password = _formKey.currentState?.fields['password']?.value;
                      if (value != password) {
                        return 'Passwords do not match';
                      }
                      
                      return null;
                    },
                    onSubmitted: (_) => _register(),
                  ),
                  const SizedBox(height: AppConstants.largePadding),

                  // Register button
                  ElevatedButton(
                    onPressed: authProvider.isLoading ? null : _register,
                    child: authProvider.isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Register'),
                  ),
                  const SizedBox(height: AppConstants.defaultPadding),

                  // Login link
                  TextButton(
                    onPressed: () => context.go('/login'),
                    child: const Text('Already have an account? Login'),
                  ),
                  const SizedBox(height: AppConstants.defaultPadding),

                  // Error display
                  if (authProvider.error != null)
                    ErrorDisplay(
                      message: authProvider.error!,
                      onRetry: _register,
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void _register() {
    if (_formKey.currentState!.saveAndValidate()) {
      final formData = _formKey.currentState!.value;
      final authProvider = context.read<AuthProvider>();
      
      final name = formData['name']?.toString().trim();
      authProvider.register(
        formData['email']?.toString().trim() ?? '',
        formData['password']?.toString() ?? '',
        name?.isEmpty == true ? null : name,
      );
    }
  }
}