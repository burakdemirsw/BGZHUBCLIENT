/**
 * Backend log tarihlerini saat dilimi bilgisi olmadan döner ve iki farklı zaman tabanı kullanır:
 * - AiRequestLog.CreatedDate        → DateTime.Now    (sunucu yerel saati)
 * - ExtensionRequestLog.CreatedDate → DateTime.UtcNow (UTC)
 * Doğru saat/dakika ve sıralama için tarih kaynağına göre yorumlanmalıdır.
 */
export type LogDateBase = 'local' | 'utc';

const ZONE_SUFFIX = /(z|[+-]\d{2}:?\d{2})$/i;

/** Log tarihini epoch (ms) olarak döner; saat dilimi varsa ona, yoksa verilen tabana göre yorumlar. */
export function parseLogDate(value: string | null | undefined, base: LogDateBase): number {
    if (!value) return 0;
    const trimmed = value.trim();
    const iso = ZONE_SUFFIX.test(trimmed) || base === 'local' ? trimmed : `${trimmed}Z`;
    const time = new Date(iso).getTime();
    return Number.isFinite(time) ? time : 0;
}
