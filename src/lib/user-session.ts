export const SESSION_ACTIVE_WINDOW_MS = 2 * 60 * 1000;

export type UserSessionSnapshot = {
  sessionStatus?: string | null;
  lastLoginAt?: Date | null;
  lastSeenAt?: Date | null;
  loggedOutAt?: Date | null;
  forceLogoutAt?: Date | null;
};

export type UserPresence = 'logged_in' | 'away' | 'logged_out';

export function buildLoginSessionData(now = new Date()) {
  return {
    sessionStatus: 'logged_in',
    lastLoginAt: now,
    lastSeenAt: now,
    loggedOutAt: null,
    forceLogoutAt: null,
  };
}

export function buildHeartbeatSessionData(now = new Date()) {
  return {
    sessionStatus: 'logged_in',
    lastSeenAt: now,
  };
}

export function buildLogoutSessionData(now = new Date(), force = false) {
  return {
    sessionStatus: 'logged_out',
    loggedOutAt: now,
    forceLogoutAt: force ? now : null,
  };
}

export function getUserPresence(user: UserSessionSnapshot, now = new Date()): UserPresence {
  const lastLoginAt = user.lastLoginAt?.getTime() ?? 0;
  const loggedOutAt = user.loggedOutAt?.getTime() ?? 0;

  if (user.forceLogoutAt) return 'logged_out';
  if (user.sessionStatus === 'logged_out' && (!lastLoginAt || loggedOutAt >= lastLoginAt)) {
    return 'logged_out';
  }
  if (!lastLoginAt) return 'logged_out';

  const lastSeenAt = user.lastSeenAt?.getTime() ?? 0;
  if (!lastSeenAt) return 'away';

  return now.getTime() - lastSeenAt <= SESSION_ACTIVE_WINDOW_MS ? 'logged_in' : 'away';
}
