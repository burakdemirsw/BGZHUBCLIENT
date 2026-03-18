// ── Shortcut Type ──

export interface ShortcutType {
    id: string;
    userId: string;
    name: string;
    description: string;
    colorCode: string;
    isBlocked?: boolean;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreateShortcutTypeRequest {
    userId: string;
    name: string;
    description: string;
    colorCode: string;
}

export interface UpdateShortcutTypeRequest {
    name: string;
    description: string;
    colorCode: string;
    isBlocked: boolean;
}

// ── Shortcut ──

export interface Shortcut {
    id: string;
    shortcutTypeId: string;
    userId: string;
    name: string;
    shortCode: string;
    content: string;
    isShared: boolean;
    isBlocked?: boolean;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreateShortcutRequest {
    userId: string;
    shortcutTypeId: string;
    name: string;
    shortCode: string;
    content: string;
    isShared: boolean;
}

export interface UpdateShortcutRequest {
    shortcutTypeId: string;
    name: string;
    shortCode: string;
    content: string;
    isShared: boolean;
    isBlocked: boolean;
}
