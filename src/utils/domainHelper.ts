/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Utility functions to detect domain environment and manage feature visibility.
 */

export const isRealDomain = (): boolean => {
  const hostname = window.location.hostname;
  
  // Real deployed domains in Cloud Run typically include '-pre-' or lack typical development indicators.
  // In the current AI Studio setup:
  // - Development URL: ais-dev-*.run.app
  // - Shared/Real URL: ais-pre-*.run.app or custom domains
  const isPre = hostname.includes('-pre-');
  const isProd = !hostname.includes('localhost') && !hostname.includes('127.0.0.1') && !hostname.includes('-dev-');
  
  return isPre || isProd;
};

export const shouldShowAdmin = (): boolean => {
  // Query parameter bypass: if url contains '?admin=true' or '&admin=true' or similar, override hiding
  const searchParams = new URLSearchParams(window.location.search);
  const adminParam = searchParams.get('admin');
  
  if (adminParam === 'true') {
    return true;
  }
  
  // By default, do NOT show admin options on the real production domain
  if (isRealDomain()) {
    return false;
  }
  
  return true;
};
