/**
 * セキュリティフラグから最低限必要なsecurity.levelを算出する。
 *
 * - has_payment_data=true OR has_credentials=true → "high" 強制
 * - has_user_data=true OR has_ip_sensitive=true → "medium" 以上
 * - 上記いずれもfalse → "low" 可
 */
export function calculateMinSecurityLevel(flags) {
    if (flags.has_payment_data || flags.has_credentials) {
        return 'high';
    }
    if (flags.has_user_data || flags.has_ip_sensitive) {
        return 'medium';
    }
    return 'low';
}
