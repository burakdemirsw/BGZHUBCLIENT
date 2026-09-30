import { WmsClaimStatusesService } from '@/app/core/services/wms/wms-claim-statuses.service';
import { WmsReturnReasonsService } from '@/app/core/services/wms/wms-return-reasons.service';
import { WmsAfterReturnActionsService } from '@/app/core/services/wms/wms-after-return-actions.service';

/** Talep ekranlarında kod → metin çevirileri */
export interface ClaimCodeLabels {
    /** statusCode (metne çevrilmiş) → açıklama */
    statuses: Record<string, string>;
    /** returnCode → iade nedeni açıklaması */
    reasons: Record<string, string>;
    /** actionCode → talep tipi açıklaması */
    actions: Record<string, string>;
    /** statusCode → durum talebi kapatıyor mu (kabul / red / iptal) */
    closed: Record<string, boolean>;
}

/**
 * Liste ve detay ekranlarının ortak sözlüğü.
 * Talep kayıtları yalnızca kod taşıdığı için açıklamalar tanım tablolarından çekilir;
 * bir liste alınamazsa o alan kodla gösterilir, ekran çalışmaya devam eder.
 */
export async function buildClaimCodeLabels(
    statusService: WmsClaimStatusesService,
    reasonsService: WmsReturnReasonsService,
    actionsService: WmsAfterReturnActionsService,
): Promise<ClaimCodeLabels> {
    const [statusList, reasonList, actionList] = await Promise.all([
        statusService.getLookupItems().catch(() => []),
        reasonsService.getLookupItems().catch(() => []),
        actionsService.getLookupItems().catch(() => []),
    ]);

    const statuses: Record<string, string> = {};
    const closed: Record<string, boolean> = {};
    for (const status of statusList) {
        const code = String(status.statusCode ?? '');
        statuses[code] = status.statusDescription || code;
        closed[code] = !!status.isClosed;
    }

    const reasons: Record<string, string> = {};
    for (const reason of reasonList) {
        if (reason.returnCode) reasons[reason.returnCode] = reason.returnReasonDescription || reason.returnCode;
    }

    const actions: Record<string, string> = {};
    for (const action of actionList) {
        if (action.actionCode) actions[action.actionCode] = action.actionDescription || action.actionCode;
    }

    return { statuses, reasons, actions, closed };
}
