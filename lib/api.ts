// ─── lib/api.ts — Re-export from utils/api.ts ──────────────────────────────
//
// This file exists for backward compatibility.
// New code should import from '@/utils' or '@/utils/api' directly.
//

export {
  api,
  request,
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  loadRefreshToken,
} from '@/utils/api';

export type { HttpMethod, RequestOptions } from '@/utils/api';

// Default export for legacy `import api from '@/lib/api'` usage
export { api as default } from '@/utils/api';
