/** dbo.CompanySettingDefinitions.DataType değerleri (backend CompanySettingDataTypes). */
export type CompanySettingDataType = 'int' | 'decimal' | 'bool' | 'string' | 'time';

// ── Kategoriler ──

export interface CompanySettingCategory {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  definitionCount: number;
  createdDate?: string;
  updatedDate?: string;
}

export interface CreateCompanySettingCategoryRequest {
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive?: boolean;
}

export interface UpdateCompanySettingCategoryRequest {
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

// ── Tanımlar ──

export interface CompanySettingDefinition {
  id: string;
  key: string;
  categoryCode: string;
  categoryName: string | null;
  displayName: string;
  description: string | null;
  dataType: CompanySettingDataType;
  inputType: string;
  isRequired: boolean;
  placeholder: string | null;
  defaultValue: string | null;
  minValue: string | null;
  maxValue: string | null;
  sortOrder: number;
  isActive: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface CreateCompanySettingDefinitionRequest {
  key: string;
  categoryCode: string;
  displayName: string;
  description: string | null;
  dataType: CompanySettingDataType;
  inputType: string | null;
  isRequired: boolean;
  placeholder: string | null;
  defaultValue: string | null;
  minValue: string | null;
  maxValue: string | null;
  sortOrder: number;
  isActive?: boolean;
}

/** Veri tipi ve anahtar oluşturulduktan sonra değiştirilemez. */
export interface UpdateCompanySettingDefinitionRequest {
  categoryCode: string;
  displayName: string;
  description: string | null;
  inputType: string | null;
  isRequired: boolean;
  placeholder: string | null;
  defaultValue: string | null;
  minValue: string | null;
  maxValue: string | null;
  sortOrder: number;
  isActive: boolean;
}

// ── Şirket değerleri ──

export interface CompanySettingField {
  definitionId: string;
  key: string;
  displayName: string;
  description: string | null;
  dataType: CompanySettingDataType;
  inputType: string;
  isRequired: boolean;
  placeholder: string | null;
  defaultValue: string | null;
  minValue: string | null;
  maxValue: string | null;
  sortOrder: number;
  /** Şirketin kaydettiği değer; null ise varsayılan geçerlidir. */
  value: string | null;
  effectiveValue: string | null;
  updatedDate: string | null;
}

export interface CompanySettingGroup {
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  settings: CompanySettingField[];
}

export interface CompanySettingsResponse {
  companyId: string;
  categories: CompanySettingGroup[];
}

export interface CompanySettingValueRequest {
  key: string;
  /** Boş/null gönderilirse şirket değeri silinir ve varsayılana dönülür. */
  value: string | null;
}

export interface UpdateCompanySettingsRequest {
  settings: CompanySettingValueRequest[];
}
