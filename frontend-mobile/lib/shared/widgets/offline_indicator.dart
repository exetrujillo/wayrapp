///
/// Offline Indicator Widget for displaying network connectivity status.
/// 
/// This widget provides visual feedback to users when the device is offline
/// or has limited connectivity. It can be used as a banner, overlay, or
/// inline component to inform users about network status.
/// 
/// @module OfflineIndicator
/// @category Widgets
/// @author Exequiel Trujillo
/// @since 1.0.0
/// 
/// @example
/// // Use as a banner at the top of the screen
/// Column(
///   children: [
///    OfflineIndicator(),
///     Expanded(child: MainContent()),
///   ],
/// )
///

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/connectivity_provider.dart';
import '../../core/network/connectivity_service.dart';

/// Widget that displays an offline indicator when network is unavailable
class OfflineIndicator extends StatelessWidget {
  /// Whether to show the indicator as a banner (default) or inline
  final bool showAsBanner;
  
  /// Custom message to display when offline
  final String? customMessage;
  
  /// Whether to show retry button
  final bool showRetryButton;
  
  /// Callback when retry button is pressed
  final VoidCallback? onRetry;
  
  /// Background color for the indicator
  final Color? backgroundColor;
  
  /// Text color for the indicator
  final Color? textColor;
  
  /// Icon to display alongside the message
  final IconData? icon;

  ///
  /// Creates an OfflineIndicator widget.
  /// 
  /// @param {bool} showAsBanner - Whether to display as a banner or inline
  /// @param {String?} customMessage - Custom message to display when offline
  /// @param {bool} showRetryButton - Whether to show a retry button
  /// @param {VoidCallback?} onRetry - Callback for retry button press
  /// @param {Color?} backgroundColor - Background color for the indicator
  /// @param {Color?} textColor - Text color for the indicator
  /// @param {IconData?} icon - Icon to display alongside the message
  ///
  const OfflineIndicator({
    super.key,
    this.showAsBanner = true,
    this.customMessage,
    this.showRetryButton = true,
    this.onRetry,
    this.backgroundColor,
    this.textColor,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer<ConnectivityProvider>(
      builder: (context, connectivity, child) {
        // Don't show indicator if connected
        if (connectivity.isConnected) {
          return const SizedBox.shrink();
        }

        final theme = Theme.of(context);
        final effectiveBackgroundColor = backgroundColor ?? 
            theme.colorScheme.errorContainer;
        final effectiveTextColor = textColor ?? 
            theme.colorScheme.onErrorContainer;
        final effectiveIcon = icon ?? Icons.wifi_off;

        final message = customMessage ?? _getOfflineMessage(connectivity.connectionType);

        if (showAsBanner) {
          return _buildBanner(
            context,
            message,
            effectiveBackgroundColor,
            effectiveTextColor,
            effectiveIcon,
            connectivity,
          );
        } else {
          return _buildInlineIndicator(
            context,
            message,
            effectiveBackgroundColor,
            effectiveTextColor,
            effectiveIcon,
            connectivity,
          );
        }
      },
    );
  }

  ///
  /// Builds the banner-style offline indicator.
  ///
  Widget _buildBanner(
    BuildContext context,
    String message,
    Color backgroundColor,
    Color textColor,
    IconData iconData,
    ConnectivityProvider connectivity,
  ) {
    return Material(
      color: backgroundColor,
      elevation: 4,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: SafeArea(
          bottom: false,
          child: Row(
            children: [
              Icon(
                iconData,
                color: textColor,
                size: 20,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      message,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: textColor,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    if (connectivity.connectionType != NetworkConnectionType.none)
                      Text(
                        'Connected to ${connectivity.connectionTypeDescription.toLowerCase()} but no internet access',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: textColor.withValues(alpha: 0.8),
                        ),
                      ),
                  ],
                ),
              ),
              if (showRetryButton)
                TextButton(
                  onPressed: () => _handleRetry(connectivity),
                  style: TextButton.styleFrom(
                    foregroundColor: textColor,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                  child: const Text('Retry'),
                ),
            ],
          ),
        ),
      ),
    );
  }

  ///
  /// Builds the inline-style offline indicator.
  ///
  Widget _buildInlineIndicator(
    BuildContext context,
    String message,
    Color backgroundColor,
    Color textColor,
    IconData iconData,
    ConnectivityProvider connectivity,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: textColor.withValues(alpha: 0.2),
          width: 1,
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Icon(
                iconData,
                color: textColor,
                size: 24,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  message,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: textColor,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
          if (connectivity.connectionType != NetworkConnectionType.none) ...[
            const SizedBox(height: 8),
            Text(
              'Connected to ${connectivity.connectionTypeDescription.toLowerCase()} but no internet access',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: textColor.withValues(alpha: 0.8),
              ),
              textAlign: TextAlign.center,
            ),
          ],
          if (showRetryButton) ...[
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _handleRetry(connectivity),
                icon: const Icon(Icons.refresh),
                label: const Text('Check Connection'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: textColor,
                  foregroundColor: backgroundColor,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  ///
  /// Gets an appropriate offline message based on connection type.
  ///
  String _getOfflineMessage(NetworkConnectionType connectionType) {
    switch (connectionType) {
      case NetworkConnectionType.none:
        return 'No internet connection';
      case NetworkConnectionType.mobile:
      case NetworkConnectionType.wifi:
      case NetworkConnectionType.ethernet:
      case NetworkConnectionType.vpn:
      case NetworkConnectionType.bluetooth:
      case NetworkConnectionType.other:
        return 'No internet access';
    }
  }

  ///
  /// Handles retry button press.
  ///
  void _handleRetry(ConnectivityProvider connectivity) {
    if (onRetry != null) {
      onRetry!();
    } else {
      connectivity.checkConnectivity();
    }
  }
}

/// A specialized offline indicator for use in app bars
class AppBarOfflineIndicator extends StatelessWidget implements PreferredSizeWidget {
  /// Height of the offline indicator
  final double height;

  const AppBarOfflineIndicator({
    super.key,
    this.height = 40,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer<ConnectivityProvider>(
      builder: (context, connectivity, child) {
        if (connectivity.isConnected) {
          return const SizedBox.shrink();
        }

        return Container(
          height: height,
          color: Theme.of(context).colorScheme.errorContainer,
          child: Center(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.wifi_off,
                  size: 16,
                  color: Theme.of(context).colorScheme.onErrorContainer,
                ),
                const SizedBox(width: 8),
                Text(
                  'Offline',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.onErrorContainer,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Size get preferredSize => Size.fromHeight(height);
}

/// A floating offline indicator that appears as a snackbar-like overlay
class FloatingOfflineIndicator extends StatefulWidget {
  /// Duration to show the indicator when going offline
  final Duration showDuration;
  
  /// Duration to show the indicator when coming back online
  final Duration onlineShowDuration;

  const FloatingOfflineIndicator({
    super.key,
    this.showDuration = const Duration(seconds: 5),
    this.onlineShowDuration = const Duration(seconds: 2),
  });

  @override
  State<FloatingOfflineIndicator> createState() => _FloatingOfflineIndicatorState();
}

class _FloatingOfflineIndicatorState extends State<FloatingOfflineIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<Offset> _slideAnimation;
  bool _isVisible = false;
  bool _wasOffline = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, -1),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<ConnectivityProvider>(
      builder: (context, connectivity, child) {
        _handleConnectivityChange(connectivity.isConnected);

        if (!_isVisible) {
          return const SizedBox.shrink();
        }

        return Positioned(
          top: MediaQuery.of(context).padding.top,
          left: 16,
          right: 16,
          child: SlideTransition(
            position: _slideAnimation,
            child: Material(
              elevation: 8,
              borderRadius: BorderRadius.circular(8),
              color: connectivity.isConnected
                  ? Colors.green
                  : Theme.of(context).colorScheme.errorContainer,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  children: [
                    Icon(
                      connectivity.isConnected ? Icons.wifi : Icons.wifi_off,
                      color: connectivity.isConnected
                          ? Colors.white
                          : Theme.of(context).colorScheme.onErrorContainer,
                      size: 20,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        connectivity.isConnected
                            ? 'Back online'
                            : 'No internet connection',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: connectivity.isConnected
                              ? Colors.white
                              : Theme.of(context).colorScheme.onErrorContainer,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  void _handleConnectivityChange(bool isConnected) {
    if (!isConnected && !_wasOffline) {
      // Just went offline
      _showIndicator(widget.showDuration);
      _wasOffline = true;
    } else if (isConnected && _wasOffline) {
      // Just came back online
      _showIndicator(widget.onlineShowDuration);
      _wasOffline = false;
    }
  }

  void _showIndicator(Duration duration) {
    setState(() {
      _isVisible = true;
    });
    
    _animationController.forward();
    
    Future.delayed(duration, () {
      if (mounted) {
        _animationController.reverse().then((_) {
          if (mounted) {
            setState(() {
              _isVisible = false;
            });
          }
        });
      }
    });
  }
}