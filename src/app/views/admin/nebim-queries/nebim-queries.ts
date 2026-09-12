import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { NebimQueriesService } from '@/app/core/services/nebim-queries.service';
import {
  CreateNebimQueryCategoryRequest,
  CreateNebimQueryParameterRequest,
  CreateNebimQueryRequest,
  NebimQueryCategory,
  NebimQuery,
  NebimQueryExecutionRequest,
  NebimQueryParameter,
  NebimToolExecutionResponse,
  UpdateNebimQueryCategoryRequest,
  UpdateNebimQueryParameterRequest,
  UpdateNebimQueryRequest,
} from '@/app/core/models/nebim/nebim-query.models';

type AdminView = 'queries' | 'categories';
type QueryDetailView = 'parameters' | 'test';

interface NebimQueryForm {
  queryKey: string;
  toolName: string;
  toolDescription: string;
  queryText: string;
  resultMode: string;
  routeType: string;
  schemaJson: string;
  examplePrompt: string;
  isActive: boolean;
  isReadOnly: boolean;
  timeoutSeconds: number;
  maxRows: number | null;
  categoryIds: string[];
}

interface NebimParameterForm {
  parameterName: string;
  jsonName: string;
  dataType: string;
  description: string;
  isRequired: boolean;
  defaultValue: string;
  sortOrder: number;
}

interface NebimCategoryForm {
  name: string;
  description: string;
  keywords: string;
  isActive: boolean;
}

@Component({
  selector: 'app-nebim-queries-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nebim-queries.html',
  styleUrls: ['./nebim-queries.scss'],
})
export class NebimQueriesPage implements OnInit {
  readonly resultModeOptions: string[] = ['list', 'object'];
  readonly defaultResultMode = 'list';
  readonly defaultRouteType = 'live_query';
  readonly dataTypeOptions: string[] = ['string', 'int', 'int32', 'int64', 'number', 'decimal', 'double', 'boolean', 'date', 'datetime', 'guid', 'json', 'object'];

  activeView: AdminView = 'queries';
  activeQueryDetailView: QueryDetailView = 'parameters';

  queries: NebimQuery[] = [];
  categories: NebimQueryCategory[] = [];
  parameters: NebimQueryParameter[] = [];

  loading = false;
  categoriesLoading = false;
  parametersLoading = false;
  executing = false;

  showModal = false;
  editMode = false;
  selectedQuery: NebimQuery | null = null;

  showParameterModal = false;
  parameterEditMode = false;
  selectedParameter: NebimQueryParameter | null = null;
  activeQuery: NebimQuery | null = null;

  showCategoryModal = false;
  categoryEditMode = false;
  selectedCategory: NebimQueryCategory | null = null;

  filterText = '';
  filteredItems: NebimQuery[] = [];
  pagedItems: NebimQuery[] = [];
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  totalPagesArray: number[] = [];

  parameterFilterText = '';
  filteredParameters: NebimQueryParameter[] = [];
  pagedParameters: NebimQueryParameter[] = [];
  parameterCurrentPage = 1;
  parameterPageSize = 10;
  parameterTotalPages = 1;
  parameterTotalPagesArray: number[] = [];

  categoryFilterText = '';
  filteredCategories: NebimQueryCategory[] = [];
  pagedCategories: NebimQueryCategory[] = [];
  categoryCurrentPage = 1;
  categoryPageSize = 10;
  categoryTotalPages = 1;
  categoryTotalPagesArray: number[] = [];

  queryForm: NebimQueryForm = this.createEmptyQueryForm();
  parameterForm: NebimParameterForm = this.createEmptyParameterForm();
  categoryForm: NebimCategoryForm = this.createEmptyCategoryForm();
  suggestedCategoryIds: string[] = [];
  executionArgumentsJson = '{}';
  executionResult: NebimToolExecutionResponse | null = null;

  constructor(
    private nebimQueriesService: NebimQueriesService,
    private authStateService: AuthStateService,
  ) {}

  ngOnInit(): void {
    void this.loadCategories();
    void this.loadQueries();
  }

  switchView(view: AdminView): void {
    this.activeView = view;
  }

  switchQueryDetailView(view: QueryDetailView): void {
    this.activeQueryDetailView = view;
  }

  generateSchemaJsonFromQuery(): void {
    const validationError = this.validateQueryText(this.queryForm.queryText);
    if (validationError) {
      alert(validationError);
      return;
    }

    const generatedSchema = this.buildSchemaJsonFromQuery(this.queryForm.queryText);
    if (!generatedSchema) {
      alert('Schema JSON üretilemedi. Sorguda SELECT alanlarının alias veya kolon adlarıyla açık olması gerekiyor.');
      return;
    }

    this.queryForm.schemaJson = generatedSchema;
  }

  onQueryMetaChanged(): void {
    this.evaluateSuggestedCategories();
  }

  autoSelectCategoriesFromQueryMeta(): void {
    const sourceText = `${this.queryForm.queryKey} ${this.queryForm.toolName}`.trim();
    if (!sourceText) {
      alert('Önce Query Key veya Tool Name girin.');
      return;
    }

    const selectedCategoryIds = this.getSuggestedCategoryIds();
    if (!selectedCategoryIds.length) {
      alert('Eşleşen kategori bulunamadı.');
      return;
    }

    this.queryForm.categoryIds = Array.from(new Set(selectedCategoryIds));
    this.evaluateSuggestedCategories();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilterAndPaging();
  }

  setPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
    this.applyFilterAndPaging();
  }

  applyFilterAndPaging(): void {
    const filter = (this.filterText || '').toLowerCase();
    this.filteredItems = this.queries.filter((item) =>
      (item.queryKey || '').toLowerCase().includes(filter)
      || (item.toolName || '').toLowerCase().includes(filter)
      || (item.toolDescription || '').toLowerCase().includes(filter)
      || (item.resultMode || '').toLowerCase().includes(filter)
      || (item.routeType || '').toLowerCase().includes(filter),
    );

    this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
    this.totalPagesArray = Array.from({ length: this.totalPages }, (_, index) => index + 1);
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
  }

  onParameterFilterChange(): void {
    this.parameterCurrentPage = 1;
    this.applyParameterFilterAndPaging();
  }

  setParameterPage(page: number): void {
    if (page < 1 || page > this.parameterTotalPages) {
      return;
    }

    this.parameterCurrentPage = page;
    this.applyParameterFilterAndPaging();
  }

  applyParameterFilterAndPaging(): void {
    const filter = (this.parameterFilterText || '').toLowerCase();
    this.filteredParameters = this.parameters.filter((item) =>
      (item.parameterName || '').toLowerCase().includes(filter)
      || (item.jsonName || '').toLowerCase().includes(filter)
      || (item.dataType || '').toLowerCase().includes(filter)
      || (item.description || '').toLowerCase().includes(filter),
    );

    this.parameterTotalPages = Math.max(1, Math.ceil(this.filteredParameters.length / this.parameterPageSize));
    this.parameterTotalPagesArray = Array.from({ length: this.parameterTotalPages }, (_, index) => index + 1);
    if (this.parameterCurrentPage > this.parameterTotalPages) {
      this.parameterCurrentPage = this.parameterTotalPages;
    }

    const start = (this.parameterCurrentPage - 1) * this.parameterPageSize;
    this.pagedParameters = this.filteredParameters.slice(start, start + this.parameterPageSize);
  }

  onCategoryFilterChange(): void {
    this.categoryCurrentPage = 1;
    this.applyCategoryFilterAndPaging();
  }

  setCategoryPage(page: number): void {
    if (page < 1 || page > this.categoryTotalPages) {
      return;
    }

    this.categoryCurrentPage = page;
    this.applyCategoryFilterAndPaging();
  }

  applyCategoryFilterAndPaging(): void {
    const filter = (this.categoryFilterText || '').toLowerCase();
    this.filteredCategories = this.categories.filter((item) =>
      (item.name || '').toLowerCase().includes(filter)
      || (item.description || '').toLowerCase().includes(filter)
      || (item.keywords || '').toLowerCase().includes(filter),
    );

    this.categoryTotalPages = Math.max(1, Math.ceil(this.filteredCategories.length / this.categoryPageSize));
    this.categoryTotalPagesArray = Array.from({ length: this.categoryTotalPages }, (_, index) => index + 1);
    if (this.categoryCurrentPage > this.categoryTotalPages) {
      this.categoryCurrentPage = this.categoryTotalPages;
    }

    const start = (this.categoryCurrentPage - 1) * this.categoryPageSize;
    this.pagedCategories = this.filteredCategories.slice(start, start + this.categoryPageSize);
  }

  async loadQueries(): Promise<void> {
    const companyId = this.authStateService.profile?.companyId || '';
    if (!companyId) {
      this.queries = [];
      this.applyFilterAndPaging();
      return;
    }

    this.loading = true;
    try {
      const response = await this.nebimQueriesService.getByCompany(companyId);
      this.queries = this.extractArray<NebimQuery>(response);
      this.applyFilterAndPaging();

      if (this.activeQuery) {
        const refreshedQuery = this.queries.find((item) => item.id === this.activeQuery?.id) || null;
        if (refreshedQuery) {
          await this.selectQuery(refreshedQuery);
        } else {
          this.clearSelection();
        }
      }
    } catch (error) {
      console.error('Nebim queries load error:', error);
    } finally {
      this.loading = false;
    }
  }

  async loadCategories(): Promise<void> {
    this.categoriesLoading = true;
    try {
      const response = await this.nebimQueriesService.getCategories();
      this.categories = this.extractArray<NebimQueryCategory>(response);
      this.applyCategoryFilterAndPaging();
    } catch (error) {
      console.error('Nebim query categories load error:', error);
      this.categories = [];
      this.applyCategoryFilterAndPaging();
    } finally {
      this.categoriesLoading = false;
    }
  }

  onCategorySelectionChange(categoryId: string, checked: boolean): void {
    const selected = new Set(this.queryForm.categoryIds);
    if (checked) {
      selected.add(categoryId);
    } else {
      selected.delete(categoryId);
    }

    this.queryForm.categoryIds = Array.from(selected);
  }

  isCategorySelected(categoryId: string): boolean {
    return this.queryForm.categoryIds.includes(categoryId);
  }

  openCreateCategory(): void {
    this.categoryEditMode = false;
    this.selectedCategory = null;
    this.categoryForm = this.createEmptyCategoryForm();
    this.showCategoryModal = true;
  }

  openEditCategory(category: NebimQueryCategory): void {
    this.categoryEditMode = true;
    this.selectedCategory = category;
    this.categoryForm = {
      name: category.name || '',
      description: category.description || '',
      keywords: category.keywords || '',
      isActive: category.isActive,
    };
    this.showCategoryModal = true;
  }

  async saveCategory(): Promise<void> {
    const payload = this.toCategoryPayload();
    try {
      if (this.categoryEditMode && this.selectedCategory) {
        const request: UpdateNebimQueryCategoryRequest = payload;
        await this.nebimQueriesService.updateCategory(this.selectedCategory.id, request);
      } else {
        const request: CreateNebimQueryCategoryRequest = payload;
        await this.nebimQueriesService.createCategory(request);
      }

      this.showCategoryModal = false;
      await this.loadCategories();
      await this.loadQueries();
    } catch (error) {
      console.error('Nebim query category save error:', error);
    }
  }

  async deleteCategory(category: NebimQueryCategory): Promise<void> {
    if (!confirm(`"${category.name || 'Kategori'}" kategorisini silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      await this.nebimQueriesService.deleteCategory(category.id);
      this.queryForm.categoryIds = this.queryForm.categoryIds.filter((item) => item !== category.id);
      await this.loadCategories();
      await this.loadQueries();
    } catch (error) {
      console.error('Nebim query category delete error:', error);
    }
  }

  async selectQuery(query: NebimQuery): Promise<void> {
    this.activeQuery = query;
    this.activeQueryDetailView = 'parameters';
    this.executionResult = null;
    this.executionArgumentsJson = this.buildArgumentsJson(query.parameters || []);
    await this.loadParameters(query.id);
  }

  async loadParameters(nebimQueryId: string): Promise<void> {
    this.parametersLoading = true;
    try {
      const response = await this.nebimQueriesService.getParametersByQuery(nebimQueryId);
      this.parameters = this.extractArray<NebimQueryParameter>(response).sort((left, right) => left.sortOrder - right.sortOrder);
      this.applyParameterFilterAndPaging();
      this.executionArgumentsJson = this.buildArgumentsJson(this.parameters);
    } catch (error) {
      console.error('Nebim query parameters load error:', error);
      this.parameters = [];
      this.applyParameterFilterAndPaging();
    } finally {
      this.parametersLoading = false;
    }
  }

  openCreate(): void {
    this.editMode = false;
    this.selectedQuery = null;
    this.queryForm = this.createEmptyQueryForm();
    this.suggestedCategoryIds = [];
    this.showModal = true;
  }

  openEdit(query: NebimQuery): void {
    this.editMode = true;
    this.selectedQuery = query;
    this.queryForm = {
      queryKey: query.queryKey || '',
      toolName: query.toolName || '',
      toolDescription: query.toolDescription || '',
      queryText: query.queryText || '',
      resultMode: this.normalizeResultMode(query.resultMode),
      routeType: this.defaultRouteType,
      schemaJson: query.schemaJson || '',
      examplePrompt: query.examplePrompt || '',
      isActive: query.isActive,
      isReadOnly: query.isReadOnly,
      timeoutSeconds: query.timeoutSeconds,
      maxRows: query.maxRows,
      categoryIds: (query.categories || []).map((category) => category.id),
    };
    this.evaluateSuggestedCategories();
    this.showModal = true;
  }

  async save(): Promise<void> {
    const companyId = this.authStateService.profile?.companyId || '';
    if (!companyId) {
      return;
    }

    this.evaluateSuggestedCategories();

    const queryValidationError = this.validateQueryText(this.queryForm.queryText);
    if (queryValidationError) {
      alert(queryValidationError);
      return;
    }

    if (!this.queryForm.categoryIds.length) {
      alert('Sorgu kaydı için en az bir kategori seçmelisiniz.');
      return;
    }

    const payload = this.toQueryPayload(companyId);
    try {
      if (this.editMode && this.selectedQuery) {
        const request: UpdateNebimQueryRequest = payload;
        await this.nebimQueriesService.update(this.selectedQuery.id, request);
      } else {
        const request: CreateNebimQueryRequest = payload;
        const createResponse = await this.nebimQueriesService.create(request);
        const createdQueryId = createResponse.data?.id || null;

        this.showModal = false;
        await this.loadQueries();

        const createdQuery = createdQueryId
          ? this.queries.find((item) => item.id === createdQueryId) || null
          : this.queries.find((item) => item.queryKey === payload.queryKey && item.toolName === payload.toolName) || null;

        if (createdQuery) {
          await this.selectQuery(createdQuery);
        }
        return;
      }

      this.showModal = false;
      await this.loadQueries();
    } catch (error) {
      console.error('Nebim query save error:', error);
    }
  }

  async deleteQuery(query: NebimQuery): Promise<void> {
    if (!confirm(`"${query.toolName || query.queryKey || 'Sorgu'}" sorgusunu silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      await this.nebimQueriesService.delete(query.id);
      if (this.activeQuery?.id === query.id) {
        this.clearSelection();
      }
      await this.loadQueries();
    } catch (error) {
      console.error('Nebim query delete error:', error);
    }
  }

  async copyQuery(query: NebimQuery): Promise<void> {
    const companyId = this.authStateService.profile?.companyId || '';
    if (!companyId) {
      return;
    }

    const sourceQueryText = query.queryText || '';
    const queryValidationError = this.validateQueryText(sourceQueryText);
    if (queryValidationError) {
      alert(`Kopyalanacak sorgu gecersiz: ${queryValidationError}`);
      return;
    }

    let createdQueryId: string | null = null;

    try {
      const sourceParametersResponse = await this.nebimQueriesService.getParametersByQuery(query.id);
      const sourceParameters = this.extractArray<NebimQueryParameter>(sourceParametersResponse).sort((left, right) => left.sortOrder - right.sortOrder);

      const copyQueryKey = this.buildCopyValue(query.queryKey, (value, index) => index === 1 ? `${value}_copy` : `${value}_copy_${index}`, (item) => item.queryKey);
      const copyToolName = this.buildCopyValue(query.toolName, (value, index) => index === 1 ? `${value} Kopya` : `${value} Kopya ${index}`, (item) => item.toolName);

      const request: CreateNebimQueryRequest = {
        companyId,
        queryKey: copyQueryKey,
        toolName: copyToolName,
        toolDescription: query.toolDescription || '',
        queryText: sourceQueryText,
        resultMode: this.normalizeResultMode(query.resultMode),
        routeType: this.defaultRouteType,
        schemaJson: query.schemaJson || '',
        examplePrompt: query.examplePrompt || '',
        isActive: query.isActive,
        isReadOnly: query.isReadOnly,
        timeoutSeconds: query.timeoutSeconds,
        maxRows: query.maxRows,
        categoryIds: (query.categories || []).map((category) => category.id),
      };

      await this.nebimQueriesService.create(request);
      await this.loadQueries();

      const createdQuery = this.queries.find((item) => item.queryKey === copyQueryKey && item.toolName === copyToolName) || null;
      if (!createdQuery) {
        throw new Error('Copied query could not be resolved after create.');
      }

      createdQueryId = createdQuery.id;

      for (const parameter of sourceParameters) {
        const parameterRequest: CreateNebimQueryParameterRequest = {
          nebimQueryId: createdQueryId,
          parameterName: parameter.parameterName || '',
          jsonName: parameter.jsonName || '',
          dataType: parameter.dataType || 'string',
          description: parameter.description || '',
          isRequired: parameter.isRequired,
          defaultValue: parameter.defaultValue || '',
          sortOrder: parameter.sortOrder,
        };

        await this.nebimQueriesService.createParameter(parameterRequest);
      }

      await this.loadQueries();
      const copiedQuery = this.queries.find((item) => item.id === createdQueryId) || null;
      if (copiedQuery) {
        await this.selectQuery(copiedQuery);
      }
    } catch (error) {
      if (createdQueryId) {
        try {
          await this.nebimQueriesService.delete(createdQueryId);
          await this.loadQueries();
        } catch (cleanupError) {
          console.error('Nebim query copy cleanup error:', cleanupError);
        }
      }

      console.error('Nebim query copy error:', error);
      alert('Sorgu kopyalanırken hata oluştu.');
    }
  }

  openCreateParameter(): void {
    if (!this.activeQuery) {
      return;
    }

    this.parameterEditMode = false;
    this.selectedParameter = null;
    this.parameterForm = this.createEmptyParameterForm();
    this.showParameterModal = true;
  }

  openEditParameter(parameter: NebimQueryParameter): void {
    this.parameterEditMode = true;
    this.selectedParameter = parameter;
    this.parameterForm = {
      parameterName: parameter.parameterName || '',
      jsonName: parameter.jsonName || '',
      dataType: parameter.dataType || '',
      description: parameter.description || '',
      isRequired: parameter.isRequired,
      defaultValue: parameter.defaultValue || '',
      sortOrder: parameter.sortOrder,
    };
    this.showParameterModal = true;
  }

  async saveParameter(): Promise<void> {
    if (!this.activeQuery) {
      return;
    }

    const payload = this.toParameterPayload(this.activeQuery.id);
    try {
      if (this.parameterEditMode && this.selectedParameter) {
        const request: UpdateNebimQueryParameterRequest = payload;
        await this.nebimQueriesService.updateParameter(this.selectedParameter.id, request);
      } else {
        const request: CreateNebimQueryParameterRequest = payload;
        await this.nebimQueriesService.createParameter(request);
      }

      this.showParameterModal = false;
      await this.loadParameters(this.activeQuery.id);
      await this.loadQueries();
    } catch (error) {
      console.error('Nebim query parameter save error:', error);
    }
  }

  async deleteParameter(parameter: NebimQueryParameter): Promise<void> {
    if (!confirm(`"${parameter.parameterName || parameter.jsonName || 'Parametre'}" parametresini silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      await this.nebimQueriesService.deleteParameter(parameter.id);
      if (this.activeQuery) {
        await this.loadParameters(this.activeQuery.id);
      }
    } catch (error) {
      console.error('Nebim query parameter delete error:', error);
    }
  }

  async executeQuery(): Promise<void> {
    const companyId = this.authStateService.profile?.companyId || '';
    if (!this.activeQuery || !companyId) {
      return;
    }

    try {
      JSON.parse(this.executionArgumentsJson || '{}');
    } catch {
      alert('Argüman JSON formatı geçersiz.');
      return;
    }

    this.executing = true;
    this.executionResult = null;
    try {
      const request: NebimQueryExecutionRequest = {
        companyId,
        toolName: this.activeQuery.toolName,
        argumentsJson: this.executionArgumentsJson,
      };
      const response = await this.nebimQueriesService.execute(request);
      this.executionResult = response.data;
    } catch (error) {
      console.error('Nebim query execute error:', error);
    } finally {
      this.executing = false;
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.suggestedCategoryIds = [];
  }

  closeParameterModal(): void {
    this.showParameterModal = false;
  }

  closeCategoryModal(): void {
    this.showCategoryModal = false;
  }

  formatDate(value?: string): string {
    if (!value) {
      return '-';
    }

    return new Date(value).toLocaleString('tr-TR');
  }

  getUnselectedSuggestedCategories(): NebimQueryCategory[] {
    const selectedIds = new Set(this.queryForm.categoryIds);
    return this.categories.filter((category) => this.suggestedCategoryIds.includes(category.id) && !selectedIds.has(category.id));
  }

  private clearSelection(): void {
    this.activeQuery = null;
    this.parameters = [];
    this.filteredParameters = [];
    this.pagedParameters = [];
    this.parameterTotalPages = 1;
    this.parameterTotalPagesArray = [];
    this.executionArgumentsJson = '{}';
    this.executionResult = null;
  }

  private createEmptyQueryForm(): NebimQueryForm {
    return {
      queryKey: '',
      toolName: '',
      toolDescription: '',
      queryText: '',
      resultMode: this.defaultResultMode,
      routeType: this.defaultRouteType,
      schemaJson: '{\n  "type": "object",\n  "properties": {}\n}',
      examplePrompt: '',
      isActive: true,
      isReadOnly: true,
      timeoutSeconds: 30,
      maxRows: 100,
      categoryIds: [],
    };
  }

  private createEmptyParameterForm(): NebimParameterForm {
    return {
      parameterName: '',
      jsonName: '',
      dataType: 'string',
      description: '',
      isRequired: true,
      defaultValue: '',
      sortOrder: this.parameters.length + 1,
    };
  }

  private createEmptyCategoryForm(): NebimCategoryForm {
    return {
      name: '',
      description: '',
      keywords: '',
      isActive: true,
    };
  }

  private toQueryPayload(companyId: string): CreateNebimQueryRequest {
    return {
      companyId,
      queryKey: this.queryForm.queryKey.trim(),
      toolName: this.queryForm.toolName.trim(),
      toolDescription: this.queryForm.toolDescription.trim(),
      queryText: this.queryForm.queryText,
      resultMode: this.normalizeResultMode(this.queryForm.resultMode),
      routeType: this.defaultRouteType,
      schemaJson: this.queryForm.schemaJson,
      examplePrompt: this.queryForm.examplePrompt,
      isActive: this.queryForm.isActive,
      isReadOnly: this.queryForm.isReadOnly,
      timeoutSeconds: Number(this.queryForm.timeoutSeconds),
      maxRows: this.queryForm.maxRows === null || this.queryForm.maxRows === undefined ? null : Number(this.queryForm.maxRows),
      categoryIds: this.queryForm.categoryIds,
    };
  }

  private toParameterPayload(nebimQueryId: string): CreateNebimQueryParameterRequest {
    return {
      nebimQueryId,
      parameterName: this.parameterForm.parameterName.trim(),
      jsonName: this.parameterForm.jsonName.trim(),
      dataType: this.parameterForm.dataType.trim(),
      description: this.parameterForm.description.trim(),
      isRequired: this.parameterForm.isRequired,
      defaultValue: this.parameterForm.defaultValue,
      sortOrder: Number(this.parameterForm.sortOrder),
    };
  }

  private toCategoryPayload(): CreateNebimQueryCategoryRequest {
    return {
      name: this.categoryForm.name.trim(),
      description: this.categoryForm.description.trim(),
      keywords: this.categoryForm.keywords.trim(),
      isActive: this.categoryForm.isActive,
    };
  }

  private buildArgumentsJson(parameters: NebimQueryParameter[]): string {
    const args: Record<string, unknown> = {};

    for (const parameter of parameters) {
      const key = parameter.jsonName || parameter.parameterName;
      if (!key) {
        continue;
      }

      args[key] = this.coerceDefaultValue(parameter.defaultValue, parameter.dataType);
    }

    return JSON.stringify(args, null, 2);
  }

  private normalizeResultMode(value?: string | null): string {
    return value === 'object' ? 'object' : this.defaultResultMode;
  }

  private buildCopyValue(
    value: string | null | undefined,
    formatter: (baseValue: string, index: number) => string,
    selector: (query: NebimQuery) => string | null | undefined,
  ): string {
    const baseValue = (value || 'query').trim() || 'query';
    let index = 1;
    let candidate = formatter(baseValue, index);

    while (this.queries.some((item) => (selector(item) || '').trim().toLowerCase() === candidate.toLowerCase())) {
      index += 1;
      candidate = formatter(baseValue, index);
    }

    return candidate;
  }

  private validateQueryText(queryText: string): string | null {
    const normalizedQuery = queryText.trim().toLowerCase();

    if (!normalizedQuery) {
      return 'Sorgu metni zorunludur.';
    }

    if (normalizedQuery.includes('for json path')) {
      return 'Sorgu içinde "FOR JSON PATH" kullanılamaz.';
    }

    if (!normalizedQuery.startsWith('select') && !normalizedQuery.startsWith('with')) {
      return 'Sorgu mutlaka SELECT veya WITH ile başlamalıdır.';
    }

    return null;
  }

  private buildSchemaJsonFromQuery(queryText: string): string | null {
    const selectClause = this.extractSelectClause(queryText);
    if (!selectClause) {
      return null;
    }

    const columns = this.splitTopLevelCsv(selectClause)
      .map((column, index) => this.parseSelectedColumn(column, index))
      .filter((column): column is { name: string; schema: Record<string, string | boolean> } => column !== null);

    if (!columns.length) {
      return null;
    }

    const properties = columns.reduce<Record<string, Record<string, string | boolean>>>((accumulator, column) => {
      accumulator[column.name] = column.schema;
      return accumulator;
    }, {});

    const schema = {
      type: 'object',
      properties,
      required: columns.map((column) => column.name),
    };

    return JSON.stringify(schema, null, 2);
  }

  private extractSelectClause(queryText: string): string | null {
    const lowerQuery = queryText.toLowerCase();
    const selectIndex = lowerQuery.indexOf('select');
    if (selectIndex < 0) {
      return null;
    }

    let depth = 0;
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let fromIndex = -1;

    for (let index = selectIndex + 'select'.length; index < queryText.length; index += 1) {
      const char = queryText[index];
      const nextChar = queryText[index + 1];

      if (char === '\'' && !inDoubleQuote) {
        if (inSingleQuote && nextChar === '\'') {
          index += 1;
          continue;
        }
        inSingleQuote = !inSingleQuote;
        continue;
      }

      if (char === '"' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
        continue;
      }

      if (inSingleQuote || inDoubleQuote) {
        continue;
      }

      if (char === '(') {
        depth += 1;
        continue;
      }

      if (char === ')') {
        depth = Math.max(0, depth - 1);
        continue;
      }

      if (depth === 0 && lowerQuery.slice(index, index + 4) === 'from') {
        const prevChar = queryText[index - 1] || ' ';
        const nextBoundaryChar = queryText[index + 4] || ' ';
        if (/\s/.test(prevChar) && /\s/.test(nextBoundaryChar)) {
          fromIndex = index;
          break;
        }
      }
    }

    if (fromIndex < 0) {
      return null;
    }

    return queryText.slice(selectIndex + 'select'.length, fromIndex).trim();
  }

  private splitTopLevelCsv(value: string): string[] {
    const parts: string[] = [];
    let current = '';
    let depth = 0;
    let inSingleQuote = false;
    let inDoubleQuote = false;

    for (let index = 0; index < value.length; index += 1) {
      const char = value[index];
      const nextChar = value[index + 1];

      if (char === '\'' && !inDoubleQuote) {
        if (inSingleQuote && nextChar === '\'') {
          current += `${char}${nextChar}`;
          index += 1;
          continue;
        }
        inSingleQuote = !inSingleQuote;
        current += char;
        continue;
      }

      if (char === '"' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
        current += char;
        continue;
      }

      if (!inSingleQuote && !inDoubleQuote) {
        if (char === '(') {
          depth += 1;
        } else if (char === ')') {
          depth = Math.max(0, depth - 1);
        } else if (char === ',' && depth === 0) {
          if (current.trim()) {
            parts.push(current.trim());
          }
          current = '';
          continue;
        }
      }

      current += char;
    }

    if (current.trim()) {
      parts.push(current.trim());
    }

    return parts;
  }

  private parseSelectedColumn(columnExpression: string, index: number): { name: string; schema: Record<string, string | boolean> } | null {
    const normalized = columnExpression.replace(/\s+/g, ' ').trim();
    if (!normalized) {
      return null;
    }

    const aliasByEquals = this.splitAliasEqualsExpression(normalized);
    const aliasByAs = normalized.match(/\s+as\s+(\[[^\]]+\]|"[^"]+"|`[^`]+`|[a-zA-Z_][\w$]*)$/i);
    let outputName = aliasByEquals?.alias || aliasByAs?.[1] || '';
    const sourceExpression = aliasByEquals?.expression || normalized;

    if (!outputName) {
      const aliasByTail = normalized.match(/(?:^|\s)(\[[^\]]+\]|"[^"]+"|`[^`]+`|[a-zA-Z_][\w$]*)$/);
      const tailValue = aliasByTail?.[1] || '';
      if (tailValue && !tailValue.includes('.') && tailValue.toLowerCase() !== normalized.toLowerCase()) {
        outputName = tailValue;
      }
    }

    if (!outputName) {
      const lastSegment = normalized.split('.').pop() || normalized;
      outputName = lastSegment;
    }

    if (!outputName) {
      outputName = this.extractFallbackColumnName(sourceExpression, index);
    }

    const cleanedName = this.cleanSqlIdentifier(outputName);
    if (!cleanedName || cleanedName === '*') {
      const fallbackName = this.extractFallbackColumnName(sourceExpression, index);
      if (!fallbackName) {
        return null;
      }

      return {
        name: fallbackName,
        schema: this.inferSchemaForColumn(fallbackName, sourceExpression),
      };
    }

    return {
      name: cleanedName,
      schema: this.inferSchemaForColumn(cleanedName, sourceExpression),
    };
  }

  private splitAliasEqualsExpression(value: string): { alias: string; expression: string } | null {
    const fastMatch = value.match(/^\s*(\[[^\]]+\]|"[^"]+"|`[^`]+`|[a-zA-Z_][\w$]*)\s*=\s*([\s\S]+)$/);
    if (fastMatch) {
      const cleanedAlias = this.cleanSqlIdentifier(fastMatch[1]);
      const expression = fastMatch[2].trim();
      if (cleanedAlias && expression) {
        return {
          alias: cleanedAlias,
          expression,
        };
      }
    }

    let depth = 0;
    let inSingleQuote = false;
    let inDoubleQuote = false;

    for (let index = 0; index < value.length; index += 1) {
      const char = value[index];
      const nextChar = value[index + 1];

      if (char === '\'' && !inDoubleQuote) {
        if (inSingleQuote && nextChar === '\'') {
          index += 1;
          continue;
        }
        inSingleQuote = !inSingleQuote;
        continue;
      }

      if (char === '"' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
        continue;
      }

      if (inSingleQuote || inDoubleQuote) {
        continue;
      }

      if (char === '(') {
        depth += 1;
        continue;
      }

      if (char === ')') {
        depth = Math.max(0, depth - 1);
        continue;
      }

      if (char === '=' && depth === 0) {
        const alias = value.slice(0, index).trim();
        const expression = value.slice(index + 1).trim();
        const cleanedAlias = this.cleanSqlIdentifier(alias);
        if (cleanedAlias && expression) {
          return {
            alias: cleanedAlias,
            expression,
          };
        }
      }
    }

    return null;
  }

  private cleanSqlIdentifier(value: string): string {
    return value
      .trim()
      .replace(/^\[(.*)\]$/, '$1')
      .replace(/^"(.*)"$/, '$1')
      .replace(/^`(.*)`$/, '$1')
      .replace(/;$/, '');
  }

  private extractFallbackColumnName(expression: string, index: number): string {
    const simpleColumnMatch = expression.match(/(?:^|\s)(?:[a-zA-Z_][\w$]*\.)?(\[[^\]]+\]|"[^"]+"|`[^`]+`|[a-zA-Z_][\w$]*)\s*$/);
    if (simpleColumnMatch?.[1]) {
      return this.cleanSqlIdentifier(simpleColumnMatch[1]);
    }

    const aliasLeadMatch = expression.match(/^\s*(\[[^\]]+\]|"[^"]+"|`[^`]+`|[a-zA-Z_][\w$]*)/);
    if (aliasLeadMatch?.[1]) {
      return this.cleanSqlIdentifier(aliasLeadMatch[1]);
    }

    return `field${index + 1}`;
  }

  private inferSchemaForColumn(columnName: string, expression: string): Record<string, string | boolean> {
    const loweredName = columnName.toLowerCase();
    const loweredExpression = expression.toLowerCase();

    if (/(cast\s*\(.+?\s+as\s+(decimal|numeric|money|float|real|int|bigint|smallint|tinyint))/i.test(loweredExpression)
      || /(count\(|sum\(|avg\(|min\(|max\(|nullif\()/i.test(loweredExpression)) {
      return { type: 'number' };
    }

    if (/case\s+when.+then\s+[01]\s+else\s+[01]\s+end/i.test(loweredExpression)) {
      return { type: 'boolean' };
    }

    if (/(^is|^has|flag|active|passive|enabled|disabled|approved)/.test(loweredName)) {
      return { type: 'boolean' };
    }

    if (/(date|time)/.test(loweredName)) {
      return { type: 'string', format: 'date-time' };
    }

    if (/(count|total|qty|quantity|amount|price|rate|number|no$|row)/.test(loweredName)
      || /(count\(|sum\(|avg\(|min\(|max\()/i.test(loweredExpression)) {
      return { type: 'number' };
    }

    if (/(^id$|id$|guid|code$|code_|email|phone|name|address|description)/.test(loweredName)) {
      return { type: 'string' };
    }

    return { type: 'string' };
  }

  private coerceDefaultValue(value: string | null, dataType: string | null): unknown {
    if (value === null || value === '') {
      return '';
    }

    switch ((dataType || '').toLowerCase()) {
      case 'int':
      case 'int32':
      case 'int64':
      case 'number':
      case 'decimal':
      case 'double':
        return Number(value);
      case 'bool':
      case 'boolean':
        return value.toLowerCase() === 'true';
      case 'json':
      case 'object':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  }

  private matchesCategory(sourceText: string, category: NebimQueryCategory): boolean {
    const normalizedSource = this.normalizeCategoryMatchText(sourceText);
    const normalizedName = this.normalizeCategoryMatchText(category.name || '');
    const keywordTokens = this.tokenizeCategoryKeywords(category.keywords || '');

    if (normalizedName && (normalizedSource.includes(normalizedName) || normalizedName.includes(normalizedSource))) {
      return true;
    }

    return keywordTokens.some((token) => normalizedSource.includes(token) || token.includes(normalizedSource));
  }

  private evaluateSuggestedCategories(): void {
    this.suggestedCategoryIds = this.getSuggestedCategoryIds();
  }

  private getSuggestedCategoryIds(): string[] {
    const sourceText = `${this.queryForm.queryKey} ${this.queryForm.toolName}`.trim();
    if (!sourceText) {
      return [];
    }

    return this.categories
      .filter((category) => this.matchesCategory(sourceText, category))
      .map((category) => category.id);
  }

  private tokenizeCategoryKeywords(value: string): string[] {
    return value
      .split(/[;,\n|]+/)
      .map((token) => this.normalizeCategoryMatchText(token))
      .filter((token) => token.length > 1);
  }

  private normalizeCategoryMatchText(value: string): string {
    return value
      .toLocaleLowerCase('tr-TR')
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9ğıüşöçİI]+/gi, '');
  }

  private extractArray<T>(response: { data: T[] | T | null } | null | undefined): T[] {
    const raw = response?.data;
    if (Array.isArray(raw)) {
      return raw;
    }
    if ((raw as { $values?: T[] } | null)?.$values) {
      return (raw as { $values: T[] }).$values;
    }
    if ((raw as { items?: T[] } | null)?.items) {
      return (raw as { items: T[] }).items;
    }
    if (raw) {
      return [raw as T];
    }
    return [];
  }
}
