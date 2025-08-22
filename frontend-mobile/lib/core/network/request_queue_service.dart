/// Request Queue Service for handling offline scenarios with automatic retry.
/// 
/// This service queues network requests when the device is offline and
/// automatically retries them when connectivity is restored. It provides
/// exponential backoff retry logic and persistent storage for queued requests.
/// 
/// @module RequestQueueService
/// @category Network
/// @author Exequiel Trujillo
/// @since 1.0.0
/// 
/// Example:
/// ```dart
/// // Queue a request for later execution
/// final queueService = RequestQueueService.instance;
/// await queueService.queueRequest(
///   QueuedRequest(
///     id: 'unique-id',
///     method: 'POST',
///     url: '/api/v1/progress',
///     data: {'lessonId': '123', 'completed': true},
///   ),
/// );
/// ```
library;

import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';
import 'connectivity_service.dart';

/// Enum representing the priority of queued requests
enum RequestPriority {
  /// Low priority requests (analytics, non-critical updates)
  low,
  /// Normal priority requests (most user actions)
  normal,
  /// High priority requests (critical user data, authentication)
  high,
  /// Critical priority requests (must be executed as soon as possible)
  critical,
}

/// Enum representing the current status of a queued request
enum RequestStatus {
  /// Request is queued and waiting to be executed
  queued,
  /// Request is currently being executed
  executing,
  /// Request completed successfully
  completed,
  /// Request failed and will be retried
  failed,
  /// Request failed permanently (max retries exceeded)
  permanentlyFailed,
}

/// Data class representing a queued network request
class QueuedRequest {
  /// Unique identifier for the request
  final String id;
  
  /// HTTP method (GET, POST, PUT, DELETE, etc.)
  final String method;
  
  /// Request URL (relative or absolute)
  final String url;
  
  /// Request data/body
  final Map<String, dynamic>? data;
  
  /// Request headers
  final Map<String, String>? headers;
  
  /// Query parameters
  final Map<String, dynamic>? queryParameters;
  
  /// Request priority
  final RequestPriority priority;
  
  /// Current status of the request
  RequestStatus status;
  
  /// Number of retry attempts made
  int retryCount;
  
  /// Maximum number of retry attempts
  final int maxRetries;
  
  /// Timestamp when the request was created
  final DateTime createdAt;
  
  /// Timestamp of the last attempt
  DateTime? lastAttemptAt;
  
  /// Last error message, if any
  String? lastError;
  
  /// Whether this request requires authentication
  final bool requiresAuth;
  
  /// Custom retry delay in seconds (overrides exponential backoff)
  final int? customRetryDelay;

  QueuedRequest({
    required this.id,
    required this.method,
    required this.url,
    this.data,
    this.headers,
    this.queryParameters,
    this.priority = RequestPriority.normal,
    this.status = RequestStatus.queued,
    this.retryCount = 0,
    this.maxRetries = 3,
    DateTime? createdAt,
    this.lastAttemptAt,
    this.lastError,
    this.requiresAuth = true,
    this.customRetryDelay,
  }) : createdAt = createdAt ?? DateTime.now();

  /// Creates a QueuedRequest from JSON data.
  /// 
  /// [json] JSON representation of the request
  /// Returns the deserialized request
  factory QueuedRequest.fromJson(Map<String, dynamic> json) {
    return QueuedRequest(
      id: json['id'] as String,
      method: json['method'] as String,
      url: json['url'] as String,
      data: json['data'] != null ? Map<String, dynamic>.from(json['data'] as Map) : null,
      headers: json['headers'] != null ? Map<String, String>.from(json['headers'] as Map) : null,
      queryParameters: json['queryParameters'] != null 
          ? Map<String, dynamic>.from(json['queryParameters'] as Map) : null,
      priority: RequestPriority.values[json['priority'] as int? ?? 1],
      status: RequestStatus.values[json['status'] as int? ?? 0],
      retryCount: json['retryCount'] as int? ?? 0,
      maxRetries: json['maxRetries'] as int? ?? 3,
      createdAt: DateTime.parse(json['createdAt'] as String),
      lastAttemptAt: json['lastAttemptAt'] != null 
          ? DateTime.parse(json['lastAttemptAt'] as String) : null,
      lastError: json['lastError'] as String?,
      requiresAuth: json['requiresAuth'] as bool? ?? true,
      customRetryDelay: json['customRetryDelay'] as int?,
    );
  }

  /// Converts the QueuedRequest to JSON.
  /// 
  /// Returns JSON representation of the request
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'method': method,
      'url': url,
      'data': data,
      'headers': headers,
      'queryParameters': queryParameters,
      'priority': priority.index,
      'status': status.index,
      'retryCount': retryCount,
      'maxRetries': maxRetries,
      'createdAt': createdAt.toIso8601String(),
      'lastAttemptAt': lastAttemptAt?.toIso8601String(),
      'lastError': lastError,
      'requiresAuth': requiresAuth,
      'customRetryDelay': customRetryDelay,
    };
  }

  /// Creates a copy of the request with updated fields.
  QueuedRequest copyWith({
    RequestStatus? status,
    int? retryCount,
    DateTime? lastAttemptAt,
    String? lastError,
  }) {
    return QueuedRequest(
      id: id,
      method: method,
      url: url,
      data: data,
      headers: headers,
      queryParameters: queryParameters,
      priority: priority,
      status: status ?? this.status,
      retryCount: retryCount ?? this.retryCount,
      maxRetries: maxRetries,
      createdAt: createdAt,
      lastAttemptAt: lastAttemptAt ?? this.lastAttemptAt,
      lastError: lastError ?? this.lastError,
      requiresAuth: requiresAuth,
      customRetryDelay: customRetryDelay,
    );
  }
}

/// Service for managing queued network requests with automatic retry
class RequestQueueService {
  static RequestQueueService? _instance;
  static RequestQueueService get instance => _instance ??= RequestQueueService._internal();
  
  RequestQueueService._internal();

  static const String _queueKey = 'request_queue';
  
  final List<QueuedRequest> _queue = [];
  final ConnectivityService _connectivityService = ConnectivityService.instance;
  
  StreamSubscription<bool>? _connectivitySubscription;
  Timer? _processingTimer;
  bool _isProcessing = false;
  bool _isInitialized = false;

  /// Stream controller for queue status updates
  final StreamController<List<QueuedRequest>> _queueController = 
      StreamController<List<QueuedRequest>>.broadcast();
  
  /// Stream of queue updates
  Stream<List<QueuedRequest>> get queueStream => _queueController.stream;
  
  /// Current queue contents
  List<QueuedRequest> get queue => List.unmodifiable(_queue);
  
  /// Number of requests in the queue
  int get queueLength => _queue.length;
  
  /// Whether the service is currently processing requests
  bool get isProcessing => _isProcessing;

  /**
   * Initializes the request queue service.
   * 
   * This method loads any persisted requests from storage and starts
   * monitoring connectivity to process queued requests when online.
   * 
   * @returns {Future<void>} Completes when initialization is finished
   */
  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      // Load persisted queue from storage
      await _loadQueueFromStorage();
      
      // Start listening to connectivity changes
      _connectivitySubscription = _connectivityService.connectionStream.listen(
        _onConnectivityChanged,
        onError: (Object error) {
          debugPrint('RequestQueueService connectivity error: $error');
        },
      );
      
      // Start processing if we're online
      if (_connectivityService.isConnected) {
        _startProcessing();
      }
      
      _isInitialized = true;
      debugPrint('RequestQueueService initialized with ${_queue.length} queued requests');
    } catch (e) {
      debugPrint('Failed to initialize RequestQueueService: $e');
    }
  }

  /**
   * Queues a network request for later execution.
   * 
   * @param {QueuedRequest} request - The request to queue
   * @returns {Future<void>} Completes when the request is queued
   * 
   * @example
   * await requestQueueService.queueRequest(
   *   QueuedRequest(
   *     id: 'progress-update-123',
   *     method: 'POST',
   *     url: '/api/v1/progress',
   *     data: {'lessonId': '123', 'completed': true},
   *     priority: RequestPriority.high,
   *   ),
   * );
   */
  Future<void> queueRequest(QueuedRequest request) async {
    try {
      // Check if request with same ID already exists
      final existingIndex = _queue.indexWhere((r) => r.id == request.id);
      if (existingIndex != -1) {
        // Update existing request
        _queue[existingIndex] = request;
        debugPrint('Updated existing request in queue: ${request.id}');
      } else {
        // Add new request
        _queue.add(request);
        debugPrint('Added new request to queue: ${request.id}');
      }
      
      // Sort queue by priority (critical first, then high, normal, low)
      _queue.sort((a, b) => b.priority.index.compareTo(a.priority.index));
      
      // Persist queue to storage
      await _saveQueueToStorage();
      
      // Notify listeners
      _queueController.add(List.from(_queue));
      
      // Start processing if we're online and not already processing
      if (_connectivityService.isConnected && !_isProcessing) {
        _startProcessing();
      }
    } catch (e) {
      debugPrint('Failed to queue request ${request.id}: $e');
    }
  }

  /**
   * Removes a request from the queue.
   * 
   * @param {String} requestId - ID of the request to remove
   * @returns {Future<bool>} True if the request was removed
   */
  Future<bool> removeRequest(String requestId) async {
    try {
      final index = _queue.indexWhere((r) => r.id == requestId);
      if (index != -1) {
        _queue.removeAt(index);
        await _saveQueueToStorage();
        _queueController.add(List.from(_queue));
        debugPrint('Removed request from queue: $requestId');
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Failed to remove request $requestId: $e');
      return false;
    }
  }

  /**
   * Clears all requests from the queue.
   * 
   * @returns {Future<void>} Completes when the queue is cleared
   */
  Future<void> clearQueue() async {
    try {
      _queue.clear();
      await _saveQueueToStorage();
      _queueController.add(List.from(_queue));
      debugPrint('Cleared request queue');
    } catch (e) {
      debugPrint('Failed to clear queue: $e');
    }
  }

  /**
   * Forces processing of the queue (useful for manual retry).
   * 
   * @returns {Future<void>} Completes when processing attempt is finished
   */
  Future<void> forceProcessQueue() async {
    if (_connectivityService.isConnected) {
      await _processQueue();
    } else {
      debugPrint('Cannot process queue: device is offline');
    }
  }

  /**
   * Handles connectivity changes.
   */
  void _onConnectivityChanged(bool isConnected) {
    if (isConnected && !_isProcessing && _queue.isNotEmpty) {
      debugPrint('Connection restored, starting queue processing');
      _startProcessing();
    } else if (!isConnected && _isProcessing) {
      debugPrint('Connection lost, stopping queue processing');
      _stopProcessing();
    }
  }

  /**
   * Starts the queue processing timer.
   */
  void _startProcessing() {
    if (_isProcessing || _queue.isEmpty) return;
    
    _isProcessing = true;
    _processingTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      _processQueue();
    });
    
    // Process immediately
    _processQueue();
  }

  /**
   * Stops the queue processing timer.
   */
  void _stopProcessing() {
    _isProcessing = false;
    _processingTimer?.cancel();
    _processingTimer = null;
  }

  /**
   * Processes queued requests.
   */
  Future<void> _processQueue() async {
    if (!_connectivityService.isConnected || _queue.isEmpty) {
      if (_queue.isEmpty) {
        _stopProcessing();
      }
      return;
    }

    final requestsToProcess = _queue
        .where((r) => r.status == RequestStatus.queued || r.status == RequestStatus.failed)
        .where((r) => _shouldRetryRequest(r))
        .take(3) // Process up to 3 requests at a time
        .toList();

    for (final request in requestsToProcess) {
      await _executeRequest(request);
    }

    // Remove completed and permanently failed requests
    _queue.removeWhere((r) => 
        r.status == RequestStatus.completed || 
        r.status == RequestStatus.permanentlyFailed);

    await _saveQueueToStorage();
    _queueController.add(List.from(_queue));
  }

  /**
   * Determines if a request should be retried based on its retry count and timing.
   */
  bool _shouldRetryRequest(QueuedRequest request) {
    if (request.retryCount >= request.maxRetries) {
      return false;
    }

    if (request.lastAttemptAt == null) {
      return true;
    }

    final timeSinceLastAttempt = DateTime.now().difference(request.lastAttemptAt!);
    final retryDelay = request.customRetryDelay != null
        ? Duration(seconds: request.customRetryDelay!)
        : _calculateRetryDelay(request.retryCount);

    return timeSinceLastAttempt >= retryDelay;
  }

  /**
   * Calculates exponential backoff delay for retries.
   */
  Duration _calculateRetryDelay(int retryCount) {
    const baseDelay = 2; // 2 seconds base delay
    const maxDelay = 300; // 5 minutes max delay
    final delay = min(baseDelay * pow(2, retryCount), maxDelay);
    return Duration(seconds: delay.toInt());
  }

  /**
   * Executes a single queued request.
   */
  Future<void> _executeRequest(QueuedRequest request) async {
    try {
      // Update request status to executing
      final index = _queue.indexWhere((r) => r.id == request.id);
      if (index == -1) return;

      _queue[index] = request.copyWith(
        status: RequestStatus.executing,
        lastAttemptAt: DateTime.now(),
      );

      debugPrint('Executing queued request: ${request.id}');

      // Create Dio instance (this should ideally be injected)
      final dio = Dio();
      
      // Execute the request
      await dio.request<dynamic>(
        request.url,
        data: request.data,
        queryParameters: request.queryParameters,
        options: Options(
          method: request.method,
          headers: request.headers,
        ),
      );

      // Request succeeded
      _queue[index] = request.copyWith(
        status: RequestStatus.completed,
        lastError: null,
      );

      debugPrint('Successfully executed queued request: ${request.id}');
    } catch (e) {
      // Request failed
      final index = _queue.indexWhere((r) => r.id == request.id);
      if (index == -1) return;

      final newRetryCount = request.retryCount + 1;
      final status = newRetryCount >= request.maxRetries
          ? RequestStatus.permanentlyFailed
          : RequestStatus.failed;

      _queue[index] = request.copyWith(
        status: status,
        retryCount: newRetryCount,
        lastError: e.toString(),
      );

      debugPrint('Failed to execute queued request ${request.id}: $e (attempt $newRetryCount/${request.maxRetries})');
    }
  }

  /**
   * Loads the queue from persistent storage.
   */
  Future<void> _loadQueueFromStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final queueJson = prefs.getString(_queueKey);
      
      if (queueJson != null) {
        final List<dynamic> queueList = jsonDecode(queueJson) as List<dynamic>;
        _queue.clear();
        _queue.addAll(queueList.map((json) => QueuedRequest.fromJson(json as Map<String, dynamic>)));
        
        // Reset executing status to queued (in case app was killed during execution)
        for (int i = 0; i < _queue.length; i++) {
          if (_queue[i].status == RequestStatus.executing) {
            _queue[i] = _queue[i].copyWith(status: RequestStatus.queued);
          }
        }
        
        debugPrint('Loaded ${_queue.length} requests from storage');
      }
    } catch (e) {
      debugPrint('Failed to load queue from storage: $e');
    }
  }

  /**
   * Saves the queue to persistent storage.
   */
  Future<void> _saveQueueToStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final queueJson = jsonEncode(_queue.map((r) => r.toJson()).toList());
      await prefs.setString(_queueKey, queueJson);
    } catch (e) {
      debugPrint('Failed to save queue to storage: $e');
    }
  }

  /**
   * Disposes of the service and cleans up resources.
   */
  void dispose() {
    _connectivitySubscription?.cancel();
    _processingTimer?.cancel();
    _queueController.close();
    debugPrint('RequestQueueService disposed');
  }
}