import type { SecurityLevel } from '../constants/enums';

interface SecurityFlags {
  has_api_keys: boolean;
  has_user_data: boolean;
  has_payment_data: boolean;
  has_ip_sensitive: boolean;
  has_credentials: boolean;
}

/**
 * セキュリティフラグから最低限必要なsecurity.levelを算出する。
 *
 * - has_payment_data=true OR has_credentials=true → "high" 強制
 * - has_user_data=true OR has_ip_sensitive=true → "medium" 以上
 * - 上記いずれもfalse → "low" 可
 */
export function calculateMinSecurityLevel(flags: SecurityFlags): SecurityLevel {
  if (flags.has_payment_data || flags.has_credentials) {
    return 'high';
  }
  if (flags.has_user_data || flags.has_ip_sensitive) {
    return 'medium';
  }
  return 'low';
}
