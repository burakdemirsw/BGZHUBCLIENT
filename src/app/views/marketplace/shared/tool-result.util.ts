import { MarketplaceToolResult } from '@/app/core/models/marketplace/marketplace.models';

/** dataJson içinden çözülen tek kayıt */
export type ToolRow = Record<string, unknown>;

export interface ToolResultRows {
    rows: ToolRow[];
    rowCount: number;
    error: string | null;
}

const ARRAY_KEYS = ['items', 'content', 'data', 'result', 'results', 'records', 'list', 'orders', 'questions', 'rows'];

/**
 * Tipli karşılığı olmayan uç noktaların `dataJson` alanını satır listesine çevirir.
 * (Beymen siparişleri/soruları, Hepsiburada soruları)
 */
export function parseToolResult(result: MarketplaceToolResult | null): ToolResultRows {
    if (!result) return { rows: [], rowCount: 0, error: null };
    if (result.success === false) {
        return { rows: [], rowCount: 0, error: result.errorMessage || 'İstek başarısız oldu.' };
    }
    if (!result.dataJson) {
        return { rows: [], rowCount: Number(result.rowCount) || 0, error: null };
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(result.dataJson);
    } catch {
        return { rows: [], rowCount: 0, error: 'Yanıt çözümlenemedi (geçersiz JSON).' };
    }

    const rows = toRows(parsed);
    return { rows, rowCount: Number(result.rowCount) || rows.length, error: null };
}

function toRows(value: unknown): ToolRow[] {
    if (Array.isArray(value)) return value.map(asRow);
    if (value && typeof value === 'object') {
        const obj = value as ToolRow;
        for (const key of ARRAY_KEYS) {
            if (Array.isArray(obj[key])) return (obj[key] as unknown[]).map(asRow);
        }
        // Tek seviye daha derine bak (ör: { data: { content: [...] } })
        for (const nested of Object.values(obj)) {
            if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
                const inner = nested as ToolRow;
                for (const key of ARRAY_KEYS) {
                    if (Array.isArray(inner[key])) return (inner[key] as unknown[]).map(asRow);
                }
            }
        }
        return [obj];
    }
    return [];
}

function asRow(value: unknown): ToolRow {
    return value && typeof value === 'object' && !Array.isArray(value) ? value as ToolRow : { value };
}
