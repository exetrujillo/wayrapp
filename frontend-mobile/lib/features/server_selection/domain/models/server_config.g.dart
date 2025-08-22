// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'server_config.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ServerConfig _$ServerConfigFromJson(Map<String, dynamic> json) => ServerConfig(
      url: json['url'] as String,
      name: json['name'] as String,
      isDefault: json['isDefault'] as bool? ?? false,
      lastConnected: json['lastConnected'] == null
          ? null
          : DateTime.parse(json['lastConnected'] as String),
      status: $enumDecodeNullable(_$ServerStatusEnumMap, json['status']) ??
          ServerStatus.unknown,
    );

Map<String, dynamic> _$ServerConfigToJson(ServerConfig instance) =>
    <String, dynamic>{
      'url': instance.url,
      'name': instance.name,
      'isDefault': instance.isDefault,
      'lastConnected': instance.lastConnected?.toIso8601String(),
      'status': _$ServerStatusEnumMap[instance.status]!,
    };

const _$ServerStatusEnumMap = {
  ServerStatus.unknown: 'unknown',
  ServerStatus.connected: 'connected',
  ServerStatus.disconnected: 'disconnected',
  ServerStatus.error: 'error',
  ServerStatus.testing: 'testing',
};
