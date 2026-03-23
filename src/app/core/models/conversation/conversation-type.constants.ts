export interface ConversationType {
    key: string;
    label: string;
    icon: string;
    path: string;
}

export const CONVERSATION_TYPES: ConversationType[] = [
    {
        key: 'messages',
        label: 'Gelen Mesajlar',
        icon: 'fa-solid fa-inbox',
        path: 'messages',
    },
    {
        key: 'archived-messages',
        label: 'Arşivlenenler',
        icon: 'fa-solid fa-box-archive',
        path: 'archived-messages',
    },
    {
        key: 'locked-messages',
        label: 'Kilitlenenler',
        icon: 'fa-solid fa-lock',
        path: 'locked-messages',
    },
    {
        key: 'escalated-messages',
        label: 'Temsilciye Aktarılanlar',
        icon: 'fa-solid fa-headset',
        path: 'escalated-messages',
    },
];

export const DEFAULT_CONVERSATION_TYPE = 'messages';

export function isValidConversationType(type: string): boolean {
    return CONVERSATION_TYPES.some(ct => ct.path === type);
}
