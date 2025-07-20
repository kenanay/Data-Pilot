/*
Data Pipeline Dashboard - Logs Hook

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import { useState, useEffect, useCallback, useRef } from 'react';

// WebSocket base URL - should be moved to environment config
const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

export const useLogs = (sessionId) => {
  const [logs, setLogs] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connecting', 'connected', 'disconnected', 'error'
  const [error, setError] = useState(null);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  // Add a new log entry
  const addLog = useCallback((logEntry) => {
    const newLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level: 'info',
      ...logEntry
    };

    setLogs(prevLogs => {
      const updatedLogs = [...prevLogs, newLog];
      // Keep only last 1000 logs to prevent memory issues
      return updatedLogs.slice(-1000);
    });
  }, []);

  // Clear all logs
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    setConnectionStatus('connecting');
    setError(null);

    try {
      const wsUrl = `${WS_BASE_URL}/ws/logs/${sessionId}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected for logs');
        setConnectionStatus('connected');
        setError(null);
        reconnectAttemptsRef.current = 0;
        
        // Send initial log
        addLog({
          level: 'info',
          message: `WebSocket connection established for session ${sessionId.slice(-8)}`,
          details: { session_id: sessionId }
        });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle different message types
          switch (data.type) {
            case 'log':
              addLog({
                level: data.level || 'info',
                message: data.message,
                details: data.details,
                stepId: data.step_id,
                timestamp: data.timestamp
              });
              break;
              
            case 'state_update':
              addLog({
                level: 'info',
                message: `Pipeline state updated: Step ${data.current_step + 1} - ${data.step_status}`,
                details: data,
                stepId: data.current_step
              });
              break;
              
            case 'progress':
              addLog({
                level: 'info',
                message: `${data.message} (${Math.round(data.progress * 100)}%)`,
                details: { progress: data.progress },
                stepId: data.step_id
              });
              break;
              
            case 'error':
              addLog({
                level: 'error',
                message: data.message || 'An error occurred',
                details: data.details,
                stepId: data.step_id
              });
              break;
              
            default:
              // Generic log message
              addLog({
                level: data.level || 'info',
                message: data.message || JSON.stringify(data),
                details: data
              });
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
          addLog({
            level: 'warning',
            message: 'Received malformed log message',
            details: { raw_message: event.data, error: err.message }
          });
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket connection error');
        addLog({
          level: 'error',
          message: 'WebSocket connection error occurred',
          details: { error: error.message }
        });
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setConnectionStatus('disconnected');
        
        addLog({
          level: 'warning',
          message: `WebSocket connection closed (${event.code}: ${event.reason || 'Unknown reason'})`,
          details: { code: event.code, reason: event.reason }
        });

        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = reconnectDelay * reconnectAttemptsRef.current;
          
          addLog({
            level: 'info',
            message: `Attempting to reconnect in ${delay / 1000} seconds... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`,
            details: { attempt: reconnectAttemptsRef.current, delay }
          });

          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError('Failed to reconnect after maximum attempts');
          addLog({
            level: 'error',
            message: 'Failed to reconnect to WebSocket after maximum attempts',
            details: { max_attempts: maxReconnectAttempts }
          });
        }
      };

    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setConnectionStatus('error');
      setError(err.message);
      addLog({
        level: 'error',
        message: 'Failed to establish WebSocket connection',
        details: { error: err.message }
      });
    }
  }, [sessionId, addLog]);

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Component unmounting');
      wsRef.current = null;
    }

    setConnectionStatus('disconnected');
  }, []);

  // Manual reconnect
  const reconnect = useCallback(() => {
    disconnectWebSocket();
    reconnectAttemptsRef.current = 0;
    setTimeout(connectWebSocket, 1000);
  }, [connectWebSocket, disconnectWebSocket]);

  // Send a custom log message (for testing or manual logging)
  const sendLog = useCallback((message, level = 'info', details = {}) => {
    addLog({
      level,
      message,
      details,
      timestamp: new Date().toISOString()
    });
  }, [addLog]);

  // Initialize WebSocket connection
  useEffect(() => {
    // Add initial session log
    addLog({
      level: 'info',
      message: `Session ${sessionId.slice(-8)} initialized`,
      details: { session_id: sessionId, timestamp: new Date().toISOString() }
    });

    // Connect to WebSocket
    connectWebSocket();

    // Cleanup on unmount
    return () => {
      disconnectWebSocket();
    };
  }, [sessionId, connectWebSocket, disconnectWebSocket, addLog]);

  // Heartbeat to keep connection alive
  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      }
    }, 30000); // Send ping every 30 seconds

    return () => clearInterval(heartbeatInterval);
  }, []);

  return {
    logs,
    connectionStatus,
    error,
    addLog,
    clearLogs,
    reconnect,
    sendLog,
    isConnected: connectionStatus === 'connected',
    isConnecting: connectionStatus === 'connecting'
  };
};