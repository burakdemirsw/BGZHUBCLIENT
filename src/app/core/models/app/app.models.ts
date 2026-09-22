/**
 * Uygulamalar (/api/Apps) modelleri — v1.yaml
 */

/** AppResponse */
export interface AppResponse {
    id: string;
    code: string | null;
    name: string | null;
    description: string | null;
    isActive: boolean;
    createdDate: string;
    updatedDate: string;
}

/** POST /Apps — kod tekil olmalı, backend büyük harfe çevirir */
export interface CreateAppRequest {
    code: string | null;
    name: string | null;
    description: string | null;
    isActive?: boolean;
}

/** POST /Apps/update/{id} — kod değişmez */
export interface UpdateAppRequest {
    name: string | null;
    description: string | null;
    isActive: boolean;
}

/** AppUserResponse — uygulama ile kullanıcı arasındaki bağ */
export interface AppUserResponse {
    id: string;
    applicationId: string;
    applicationCode: string | null;
    applicationName: string | null;
    userId: string;
    isActive: boolean;
    createdDate: string;
    updatedDate: string;
}

/** POST /Apps/users */
export interface CreateAppUserRequest {
    applicationId: string;
    userId: string;
    isActive?: boolean;
}

/** POST /Apps/users/update/{id} */
export interface UpdateAppUserRequest {
    isActive: boolean;
}
