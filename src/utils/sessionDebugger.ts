export interface SessionDebugInfo {
  timestamp: string;
  event: string;
  sessionId?: string;
  userId?: string;
  hasSession: boolean;
  hasUser: boolean;
  cookies: Record<string, string>;
  authState: string;
  additionalData?: Record<string, unknown>;
}

export interface CookieInfo {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  secure?: boolean;
  sameSite?: string;
  expires?: string;
}

export interface SessionData {
  id?: string;
  expires_at?: number | string;
  access_token?: string;
  refresh_token?: string;
}

export interface UserData {
  id?: string;
  email?: string;
  created_at?: string;
}

class SessionDebugger {
  private logs: SessionDebugInfo[] = [];
  private maxLogs = 100;
  private isEnabled = true;

  constructor() {
    if (typeof window !== 'undefined') {
      // Add global event listeners for debugging
      this.setupGlobalListeners();
    }
  }

  private setupGlobalListeners() {
    // Listen for storage changes (cookies, localStorage, etc.)
    window.addEventListener('storage', (e) => {
      this.log('storage-change', {
        key: e.key,
        oldValue: e.oldValue,
        newValue: e.newValue,
        url: e.url
      });
    });

    // Listen for page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.log('visibility-change', {
        hidden: document.hidden,
        visibilityState: document.visibilityState
      });
    });

    // Listen for beforeunload events
    window.addEventListener('beforeunload', () => {
      this.log('before-unload', {
        url: window.location.href
      });
    });
  }

  log(event: string, additionalData?: Record<string, unknown>) {
    if (!this.isEnabled) return;

    const debugInfo: SessionDebugInfo = {
      timestamp: new Date().toISOString(),
      event,
      hasSession: false,
      hasUser: false,
      cookies: this.getAllCookies(),
      authState: 'unknown',
      additionalData
    };

    this.logs.unshift(debugInfo);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Also log to console for immediate debugging
    console.log(`[SessionDebug] ${event}:`, debugInfo);
  }

  logSessionState(session: unknown, user: unknown, event: string) {
    const sessionData = session as Record<string, unknown> | null;
    const userData = user as Record<string, unknown> | null;
    
    const debugInfo: SessionDebugInfo = {
      timestamp: new Date().toISOString(),
      event,
      sessionId: sessionData?.id as string || 'none',
      userId: userData?.id as string || 'none',
      hasSession: !!session,
      hasUser: !!user,
      cookies: this.getAllCookies(),
      authState: session ? 'authenticated' : 'unauthenticated',
      additionalData: {
        sessionExpiresAt: sessionData?.expires_at,
        userEmail: userData?.email as string,
        userCreatedAt: userData?.created_at as string,
        sessionAccessToken: sessionData?.access_token ? 'present' : 'missing',
        sessionRefreshToken: sessionData?.refresh_token ? 'present' : 'missing'
      }
    };

    this.logs.unshift(debugInfo);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    console.log(`[SessionDebug] ${event}:`, debugInfo);
  }

  private getAllCookies(): Record<string, string> {
    if (typeof document === 'undefined') return {};
    
    const cookies: Record<string, string> = {};
    try {
      document.cookie.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
          cookies[name] = decodeURIComponent(value);
        }
      });
    } catch (error) {
      console.warn('Failed to read cookies:', error);
    }
    return cookies;
  }

  getCookieInfo(name: string): CookieInfo | null {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.trim().split('=');
      if (cookieName === name) {
        return {
          name: cookieName,
          value: decodeURIComponent(cookieValue || ''),
          // Note: We can't get all cookie attributes from document.cookie
          // This would require server-side access or a more sophisticated approach
        };
      }
    }
    return null;
  }

  getLogs(): SessionDebugInfo[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Method to check for common session issues
  diagnoseSessionIssues(): string[] {
    const issues: string[] = [];
    const recentLogs = this.logs.slice(0, 10);

    // Check for rapid sign-in/sign-out cycles
    const signInEvents = recentLogs.filter(log => log.event.includes('SIGNED_IN'));
    const signOutEvents = recentLogs.filter(log => log.event.includes('SIGNED_OUT'));
    
    if (signInEvents.length > 0 && signOutEvents.length > 0) {
      const timeDiff = new Date(signInEvents[0].timestamp).getTime() - new Date(signOutEvents[0].timestamp).getTime();
      if (Math.abs(timeDiff) < 5000) { // Less than 5 seconds
        issues.push('Rapid sign-in/sign-out cycle detected (possible session conflict)');
      }
    }

    // Check for missing session cookies
    const supabaseCookies = recentLogs[0]?.cookies;
    if (supabaseCookies && Object.keys(supabaseCookies).length > 0) {
      // Check if cookies object has auth token keys
      const hasAuthToken = Object.keys(supabaseCookies).some(key => 
        key.includes('auth-token') || key.includes('supabase')
      );
      if (!hasAuthToken) {
        issues.push('Missing Supabase auth token cookies');
      }
    } else {
      // Check current cookies directly from document
      const currentCookies = this.getAllCookies();
      const hasCurrentAuthToken = Object.keys(currentCookies).some(key => 
        key.includes('auth-token') || key.includes('supabase')
      );
      
      if (!hasCurrentAuthToken) {
        issues.push('Missing Supabase auth token cookies');
      }
    }

    // Check for session expiration
    const sessionLogs = recentLogs.filter(log => log.hasSession);
    if (sessionLogs.length > 0) {
      const session = sessionLogs[0];
      if (session.additionalData?.sessionExpiresAt) {
        const expiresAt = new Date(session.additionalData.sessionExpiresAt as string);
        const now = new Date();
        if (expiresAt < now) {
          issues.push('Session has expired');
        }
      }
    }

    return issues;
  }
}

// Create singleton instance
export const sessionDebugger = new SessionDebugger();
