export interface Product {
    id: string;
    productCode?: string;
    name?: string;
    description?: string;
    imageUrl?: string;
    productUrl?: string;
    brand?: string;
    category?: string;
    price?: number;
    salePrice?: number;
    currency?: string;
    availability?: string;
    condition?: string;
    itemGroupId?: string;
    color?: string;
    size?: string;
    barcode?: string;
    stockQuantity?: number;
    additionalImages?: string;
    integrationId?: string;
    isActive?: boolean;
    isBlocked?: boolean;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreateProductRequest {
    productCode: string;
    name: string;
    description: string;
    imageUrl: string;
    productUrl: string;
    brand: string;
    category: string;
    price: number;
    salePrice: number;
    currency: string;
    availability: string;
    condition: string;
    itemGroupId: string;
    color: string;
    size: string;
    additionalImages: string;
    integrationId: string;
}

export interface UpdateProductRequest {
    productCode: string;
    name: string;
    description: string;
    imageUrl: string;
    productUrl: string;
    brand: string;
    category: string;
    price: number;
    salePrice: number;
    currency: string;
    availability: string;
    condition: string;
    itemGroupId: string;
    color: string;
    size: string;
    additionalImages: string;
    isActive: boolean;
    integrationId: string;
}
