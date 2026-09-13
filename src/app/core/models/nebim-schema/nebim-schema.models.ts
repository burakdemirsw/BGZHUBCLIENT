export type IntLike = number | string;

export interface NebimSchemaObjectResponse {
    id: string;
    companyId: string;
    schemaName: string | null;
    objectName: string | null;
    objectType: string | null;
    procedureCount: IntLike;
    domain: string | null;
    businessName: string | null;
    description: string | null;
    priority: IntLike;
    isAllowed: boolean;
    lastSyncedAt: string;
    columnCount: IntLike;
    isBlocked?: boolean;
    createdDate?: string;
    updatedDate?: string;
}

export interface NebimSchemaColumnResponse {
    id: string;
    companyId: string;
    schemaObjectId: string;
    objectName: string | null;
    columnName: string | null;
    dataType: string | null;
    maxLength: IntLike;
    precision: IntLike;
    scale: IntLike;
    isNullable: boolean;
    columnOrder: IntLike;
    businessName: string | null;
    description: string | null;
    isFilterable: boolean;
    isSortable: boolean;
    isGroupable: boolean;
    isMetricSource: boolean;
    isDateField: boolean;
    isAllowed: boolean;
    isCoreColumn: boolean;
    coreOrder: IntLike;
    lastSyncedAt: string;
    isBlocked?: boolean;
    createdDate?: string;
    updatedDate?: string;
}

export interface NebimSchemaCategoryResponse {
    id: string;
    name: string | null;
    description: string | null;
    keywords: string | null;
    isActive: boolean;
    isBlocked?: boolean;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreateNebimSchemaObjectRequest {
    domain: string | null;
    businessName: string | null;
    description: string | null;
    priority: IntLike;
    isAllowed: boolean;
}

export interface UpdateNebimSchemaObjectRequest {
    domain: string | null;
    businessName: string | null;
    description: string | null;
    priority: IntLike;
    isAllowed: boolean;
}

export interface CreateNebimSchemaColumnRequest {
    schemaObjectId: string;
    businessName: string | null;
    description: string | null;
    isFilterable: boolean;
    isSortable: boolean;
    isGroupable: boolean;
    isMetricSource: boolean;
    isDateField: boolean;
    isAllowed: boolean;
    isCoreColumn: boolean;
    coreOrder: IntLike;
}

export interface UpdateNebimSchemaColumnRequest {
    businessName: string | null;
    description: string | null;
    isFilterable: boolean;
    isSortable: boolean;
    isGroupable: boolean;
    isMetricSource: boolean;
    isDateField: boolean;
    isAllowed: boolean;
    isCoreColumn: boolean;
    coreOrder: IntLike;
}

export interface CreateNebimSchemaCategoryRequest {
    name: string | null;
    description: string | null;
    keywords: string | null;
    isActive: boolean;
}

export interface UpdateNebimSchemaCategoryRequest {
    name: string | null;
    description: string | null;
    keywords: string | null;
    isActive: boolean;
}

export interface SetNebimSchemaObjectCategoriesRequest {
    categoryIds: string[];
}
