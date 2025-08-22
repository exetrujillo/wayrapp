import 'package:json_annotation/json_annotation.dart';

part 'server_config.g.dart';

/// Server configuration model for storing server connection details
@JsonSerializable()
class ServerConfig {
  final String url;
  final String name;
  final bool isDefault;
  final DateTime? lastConnected;
  final ServerStatus status;

  const ServerConfig({
    required this.url,
    required this.name,
    this.isDefault = false,
    this.lastConnected,
    this.status = ServerStatus.unknown,
  });

  /// Create a copy of this ServerConfig with updated fields
  ServerConfig copyWith({
    String? url,
    String? name,
    bool? isDefault,
    DateTime? lastConnected,
    ServerStatus? status,
  }) {
    return ServerConfig(
      url: url ?? this.url,
      name: name ?? this.name,
      isDefault: isDefault ?? this.isDefault,
      lastConnected: lastConnected ?? this.lastConnected,
      status: status ?? this.status,
    );
  }

  /// Create ServerConfig from JSON
  factory ServerConfig.fromJson(Map<String, dynamic> json) => _$ServerConfigFromJson(json);

  /// Convert ServerConfig to JSON
  Map<String, dynamic> toJson() => _$ServerConfigToJson(this);

  /// Create default WayrApp server configuration
  factory ServerConfig.defaultServer() {
    return const ServerConfig(
      url: 'https://wayrapp.vercel.app',
      name: 'Official WayrApp Server',
      isDefault: true,
      status: ServerStatus.unknown,
    );
  }

  /// Create custom server configuration
  factory ServerConfig.custom({
    required String url,
    String? name,
  }) {
    return ServerConfig(
      url: url,
      name: name ?? 'Custom Server',
      isDefault: false,
      status: ServerStatus.unknown,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ServerConfig &&
          runtimeType == other.runtimeType &&
          url == other.url &&
          name == other.name &&
          isDefault == other.isDefault &&
          lastConnected == other.lastConnected &&
          status == other.status;

  @override
  int get hashCode =>
      url.hashCode ^
      name.hashCode ^
      isDefault.hashCode ^
      lastConnected.hashCode ^
      status.hashCode;

  @override
  String toString() {
    return 'ServerConfig{url: $url, name: $name, isDefault: $isDefault, lastConnected: $lastConnected, status: $status}';
  }
}

/// Server connection status enumeration
enum ServerStatus {
  @JsonValue('unknown')
  unknown,
  
  @JsonValue('connected')
  connected,
  
  @JsonValue('disconnected')
  disconnected,
  
  @JsonValue('error')
  error,
  
  @JsonValue('testing')
  testing,
  
  @JsonValue('offline')
  offline,
}

/// Extension methods for ServerStatus
extension ServerStatusExtension on ServerStatus {
  /// Get user-friendly display name for the status
  String get displayName {
    switch (this) {
      case ServerStatus.unknown:
        return 'Unknown';
      case ServerStatus.connected:
        return 'Connected';
      case ServerStatus.disconnected:
        return 'Disconnected';
      case ServerStatus.error:
        return 'Error';
      case ServerStatus.testing:
        return 'Testing...';
      case ServerStatus.offline:
        return 'Offline';
    }
  }

  /// Get appropriate icon for the status
  String get iconName {
    switch (this) {
      case ServerStatus.unknown:
        return 'help_outline';
      case ServerStatus.connected:
        return 'check_circle';
      case ServerStatus.disconnected:
        return 'cancel';
      case ServerStatus.error:
        return 'error';
      case ServerStatus.testing:
        return 'sync';
      case ServerStatus.offline:
        return 'wifi_off';
    }
  }

  /// Check if the status indicates a successful connection
  bool get isConnected => this == ServerStatus.connected;

  /// Check if the status indicates an error state
  bool get hasError => this == ServerStatus.error;

  /// Check if the status indicates testing is in progress
  bool get isTesting => this == ServerStatus.testing;
}