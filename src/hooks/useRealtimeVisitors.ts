import { useState, useEffect, useCallback } from 'react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/realtime-visitors`;

// Generate a unique session ID for this browser tab
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('visitor-session-id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    sessionStorage.setItem('visitor-session-id', sessionId);
  }
  return sessionId;
};

export const useRealtimeVisitors = () => {
  const [activeUsers, setActiveUsers] = useState<number>(220); // Default fallback
  const [isLoading, setIsLoading] = useState(true);

  // Send heartbeat to track this session
  const sendHeartbeat = useCallback(async () => {
    try {
      const sessionId = getSessionId();
      const page = window.location.pathname;

      await fetch(`${FUNCTION_URL}?action=heartbeat&page=${encodeURIComponent(page)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ sessionId }),
      });
    } catch (error) {
      console.error('Failed to send heartbeat:', error);
    }
  }, []);

  // Fetch current active user count
  const fetchActiveUsers = useCallback(async () => {
    try {
      const response = await fetch(`${FUNCTION_URL}?action=count`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch active users');
      }

      const data = await response.json();
      setActiveUsers(data.activeUsers);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch active users:', error);
      // Keep the previous value or use fallback
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial heartbeat and fetch
    sendHeartbeat();
    fetchActiveUsers();

    // Send heartbeat every 30 seconds
    const heartbeatInterval = setInterval(sendHeartbeat, 30000);

    // Fetch active users every 5 seconds
    const fetchInterval = setInterval(fetchActiveUsers, 5000);

    // Cleanup on unmount
    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(fetchInterval);
    };
  }, [sendHeartbeat, fetchActiveUsers]);

  return { activeUsers, isLoading };
};
