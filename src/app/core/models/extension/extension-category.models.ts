/** Extension'ların gruplandığı kategori (ör: Pazaryeri, Web Sitesi, Kargo). */
export interface ExtensionCategory {
    id: string;
    code: string;
    name: string;
    description: string | null;
    photoUrl: string | null;
    sortOrder: number;
    isActive: boolean;
    extensionCount: number;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreateExtensionCategoryRequest {
    code: string;
    name: string;
    description?: string | null;
    photoUrl?: string | null;
    sortOrder?: number;
    isActive?: boolean;
}

export interface UpdateExtensionCategoryRequest {
    name: string;
    description?: string | null;
    photoUrl?: string | null;
    sortOrder?: number;
    isActive?: boolean;
}
