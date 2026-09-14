import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
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

type AdminView = 'queries' | 'categories' | 'schema';
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

interface ConfettiPiece {
  id: number;
  left: number;
  delayMs: number;
  durationMs: number;
  rotateDeg: number;
  color: string;
}

interface QuickAddParameterItem {
  key: string;
  sourceQueryId: string;
  sourceQueryLabel: string;
  parameter: NebimQueryParameter;
}

interface CategorySchemaNode {
  id: string;
  label: string;
  shortLabel: string;
  queryCount: number;
  connectionCount: number;
  sharedWeight: number;
  x: number;
  y: number;
  radius: number;
  fill: string;
  stroke: string;
  textColor: string;
}

interface CategorySchemaEdge {
  key: string;
  fromId: string;
  toId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  weight: number;
  strokeWidth: number;
  opacity: number;
  stroke: string;
}

interface CategorySchemaGraph {
  nodes: CategorySchemaNode[];
  edges: CategorySchemaEdge[];
  maxNodeWeight: number;
  maxEdgeWeight: number;
}

@Component({
  selector: 'app-nebim-queries-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nebim-queries.html',
  styleUrls: ['./nebim-queries.scss'],
})
export class NebimQueriesPage implements OnInit {
  @ViewChild('schemaSvg') schemaSvg?: ElementRef<SVGSVGElement>;

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
  showQueryDetailModal = false;

  showParameterModal = false;
  parameterEditMode = false;
  selectedParameter: NebimQueryParameter | null = null;
  activeQuery: NebimQuery | null = null;
  showQuickAddParameterModal = false;
  quickAddParametersLoading = false;
  quickAddParameterFilterText = '';
  quickAddParameters: QuickAddParameterItem[] = [];
  filteredQuickAddParameters: QuickAddParameterItem[] = [];
  selectedQuickAddParameterKeys: string[] = [];

  showCategoryModal = false;
  categoryEditMode = false;
  selectedCategory: NebimQueryCategory | null = null;
  categoryModalSource: 'categoriesView' | 'queryModal' = 'categoriesView';
  showDeleteQueryModal = false;
  queryToDelete: NebimQuery | null = null;

  filterText = '';
  selectedQueryCategoryId = '';
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
  pendingAutoParameterNames: string[] = [];
  autoParameterDialogFlowActive = false;
  schemaGenerationNotice = '';
  schemaGenerationNoticeType: 'success' | 'warning' = 'success';
  autoActionsEnabled = true;
  autoCategorySelectionNotice = '';
  confettiPieces: ConfettiPiece[] = [];
  schemaGraph: CategorySchemaGraph = { nodes: [], edges: [], maxNodeWeight: 0, maxEdgeWeight: 0 };
  selectedSchemaNodeId: string | null = null;
  private draggingSchemaNodeId: string | null = null;
  private readonly schemaWidth = 960;
  private readonly schemaHeight = 560;
  private autoActionAudio = new Audio('assets/sounds/incoming-message-sound.mp3');

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
    this.setSchemaGenerationNotice('Schema Query Text üzerinden üretildi.', 'success');
  }

  onQueryTextChanged(): void {
    if (!this.autoActionsEnabled) {
      return;
    }

    this.autoGenerateSchemaFromQueryText();
  }

  onQueryMetaChanged(): void {
    this.applyQueryKeyToToolName();

    if (this.autoActionsEnabled) {
      this.applyQueryKeyToToolDescription();
    }

    this.evaluateSuggestedCategories();
    this.autoSelectSuggestedCategoriesIfNeeded();
  }

  copyQueryKeyToToolDescription(): void {
    this.applyQueryKeyToToolDescription();
  }

  onAutoActionsToggleChanged(): void {
    if (!this.autoActionsEnabled) {
      this.autoCategorySelectionNotice = '';
      this.autoParameterDialogFlowActive = false;
      this.pendingAutoParameterNames = [];
      return;
    }

    this.evaluateSuggestedCategories();
    this.applyQueryKeyToToolDescription();
    this.autoSelectSuggestedCategoriesIfNeeded();
    this.autoGenerateSchemaFromQueryText();
  }

  autoSelectCategoriesFromQueryMeta(): void {
    const sourceText = `${this.queryForm.queryKey} ${this.queryForm.toolName} ${this.queryForm.queryText}`.trim();
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

  setQueryCategoryFilter(categoryId: string): void {
    this.selectedQueryCategoryId = categoryId;
    this.currentPage = 1;
    this.applyFilterAndPaging();
  }

  getSortedQueryCategories(): NebimQueryCategory[] {
    return [...this.categories].sort((left, right) => (left.name || '').localeCompare(right.name || '', 'tr'));
  }

  getQueryCountByCategory(categoryId: string): number {
    return this.queries.filter((query) => this.queryHasCategory(query, categoryId)).length;
  }

  isQueryCategorySelected(categoryId: string): boolean {
    return this.selectedQueryCategoryId === categoryId;
  }

  hasCopyInQueryKey(queryKey: string | null | undefined): boolean {
    return (queryKey || '').toLowerCase().includes('_copy');
  }

  get showPassiveEditNotice(): boolean {
    return this.editMode && !this.queryForm.isActive;
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

    if (this.selectedQueryCategoryId) {
      this.filteredItems = this.filteredItems.filter((item) => this.queryHasCategory(item, this.selectedQueryCategoryId));
    }

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
      this.refreshCategorySchemaGraph();
      return;
    }

    this.loading = true;
    try {
      const response = await this.nebimQueriesService.getByCompany(companyId);
      this.queries = this.extractArray<NebimQuery>(response);
      this.applyFilterAndPaging();
      this.refreshCategorySchemaGraph();

      if (this.activeQuery) {
        const refreshedQuery = this.queries.find((item) => item.id === this.activeQuery?.id) || null;
        if (refreshedQuery) {
          await this.selectQuery(refreshedQuery, this.showQueryDetailModal);
        } else {
          this.clearSelection();
        }
      }
    } catch (error) {
      console.error('Nebim queries load error:', error);
      this.refreshCategorySchemaGraph();
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
      this.refreshCategorySchemaGraph();
      if (this.showModal) {
        this.evaluateSuggestedCategories();
        this.autoSelectSuggestedCategoriesIfNeeded();
      }
    } catch (error) {
      console.error('Nebim query categories load error:', error);
      this.categories = [];
      this.applyCategoryFilterAndPaging();
      this.refreshCategorySchemaGraph();
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

  openCreateCategory(source: 'categoriesView' | 'queryModal' = 'categoriesView'): void {
    this.categoryEditMode = false;
    this.selectedCategory = null;
    this.categoryForm = this.createEmptyCategoryForm();
    this.categoryModalSource = source;
    this.showCategoryModal = true;
  }

  openEditCategory(category: NebimQueryCategory): void {
    this.categoryEditMode = true;
    this.selectedCategory = category;
    this.categoryModalSource = 'categoriesView';
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
      let createdCategoryId: string | null = null;
      if (this.categoryEditMode && this.selectedCategory) {
        const request: UpdateNebimQueryCategoryRequest = payload;
        await this.nebimQueriesService.updateCategory(this.selectedCategory.id, request);
      } else {
        const request: CreateNebimQueryCategoryRequest = payload;
        const response = await this.nebimQueriesService.createCategory(request);
        createdCategoryId = response.data?.id || null;
      }

      this.showCategoryModal = false;
      await this.loadCategories();
      await this.loadQueries();

      if (!this.categoryEditMode && this.categoryModalSource === 'queryModal') {
        const payloadName = (payload.name || '').trim().toLowerCase();
        const fallbackCategory = this.categories.find((item) =>
          (item.name || '').trim().toLowerCase() === payloadName,
        );
        const categoryIdToSelect = createdCategoryId || fallbackCategory?.id || null;
        if (categoryIdToSelect) {
          this.onCategorySelectionChange(categoryIdToSelect, true);
        }
      }
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

  async selectQuery(query: NebimQuery, openDetailModal = true): Promise<void> {
    this.activeQuery = query;
    this.activeQueryDetailView = 'parameters';
    this.executionResult = null;
    this.executionArgumentsJson = this.buildArgumentsJson(query.parameters || []);
    await this.loadParameters(query.id);
    this.showQueryDetailModal = openDetailModal;
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
    this.schemaGenerationNotice = '';
    this.autoCategorySelectionNotice = '';
    this.autoActionsEnabled = true;
    this.showModal = true;
  }

  openEdit(query: NebimQuery): void {
    this.editMode = true;
    this.selectedQuery = query;
    const normalizedQueryKey = this.removeCopyTokenFromQueryKey(query.queryKey || '');
    this.queryForm = {
      queryKey: normalizedQueryKey,
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
    this.schemaGenerationNotice = '';
    this.autoCategorySelectionNotice = '';
    this.autoActionsEnabled = true;
    this.applyQueryKeyToToolName();
    this.autoSelectSuggestedCategoriesIfNeeded();
    this.showModal = true;
  }

  async save(): Promise<void> {
    const companyId = this.authStateService.profile?.companyId || '';
    if (!companyId) {
      return;
    }

    if (this.editMode) {
      const queryKeyValidationError = this.validateQueryKeyForEdit(this.queryForm.queryKey);
      if (queryKeyValidationError) {
        alert(queryKeyValidationError);
        return;
      }
    }

    this.evaluateSuggestedCategories();
    this.applyQueryKeyToToolName();

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
        this.autoParameterDialogFlowActive = false;
        this.pendingAutoParameterNames = [];
        const request: UpdateNebimQueryRequest = payload;
        await this.nebimQueriesService.update(this.selectedQuery.id, request);
      } else {
        const request: CreateNebimQueryRequest = payload;
        const detectedParameterNames = this.extractSqlParameterNames(payload.queryText || '');
        const createResponse = await this.nebimQueriesService.create(request);
        const createdQueryId = createResponse.data?.id || null;

        this.showModal = false;
        await this.loadQueries();

        const createdQuery = createdQueryId
          ? this.queries.find((item) => item.id === createdQueryId) || null
          : this.queries.find((item) => item.queryKey === payload.queryKey && item.toolName === payload.toolName) || null;

        if (createdQuery) {
          await this.selectQuery(createdQuery);

          if (detectedParameterNames.length > 0) {
            this.pendingAutoParameterNames = detectedParameterNames.filter((name) =>
              !this.parameters.some((parameter) => this.normalizeParameterName(parameter.jsonName || parameter.parameterName || '') === this.normalizeParameterName(name)),
            );
            this.autoParameterDialogFlowActive = this.autoActionsEnabled && this.pendingAutoParameterNames.length > 0;
            this.openNextAutoParameterDialog();
          }
        }
        return;
      }

      this.showModal = false;
      await this.loadQueries();
    } catch (error) {
      console.error('Nebim query save error:', error);
    }
  }

  requestDeleteQuery(query: NebimQuery): void {
    this.queryToDelete = query;
    this.showDeleteQueryModal = true;
  }

  async confirmDeleteQuery(): Promise<void> {
    if (!this.queryToDelete) {
      return;
    }

    try {
      await this.nebimQueriesService.delete(this.queryToDelete.id);
      if (this.activeQuery?.id === this.queryToDelete.id) {
        this.clearSelection();
      }
      this.closeDeleteQueryModal();
      await this.loadQueries();
    } catch (error) {
      console.error('Nebim query delete error:', error);
    }
  }

  async copyQuery(query: NebimQuery): Promise<void> {
    if (!confirm(`"${query.toolName || query.queryKey || 'Sorgu'}" kaydini kopyalamak istediginize emin misiniz?`)) {
      return;
    }

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
        isActive: false,
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
        await this.selectQuery(copiedQuery, false);
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

  async openQuickAddParameterModal(): Promise<void> {
    if (!this.activeQuery) {
      return;
    }

    this.showQuickAddParameterModal = true;
    this.quickAddParametersLoading = true;
    this.quickAddParameterFilterText = '';
    this.quickAddParameters = [];
    this.filteredQuickAddParameters = [];
    this.selectedQuickAddParameterKeys = [];

    const existingKeys = new Set(
      this.parameters.map((parameter) =>
        this.normalizeParameterName(parameter.jsonName || parameter.parameterName || ''),
      ),
    );

    const sourceQueries = this.queries.filter((query) => query.id !== this.activeQuery?.id);
    const results = await Promise.allSettled(
      sourceQueries.map(async (query) => ({
        query,
        response: await this.nebimQueriesService.getParametersByQuery(query.id),
      })),
    );

    const list: QuickAddParameterItem[] = [];
    for (const result of results) {
      if (result.status !== 'fulfilled') {
        continue;
      }

      const sourceQuery = result.value.query;
      const sourceLabel = sourceQuery.toolName || sourceQuery.queryKey || 'Adsiz Sorgu';
      const sourceParams = this.extractArray<NebimQueryParameter>(result.value.response)
        .sort((left, right) => left.sortOrder - right.sortOrder);

      for (const sourceParam of sourceParams) {
        const normalized = this.normalizeParameterName(sourceParam.jsonName || sourceParam.parameterName || '');
        if (!normalized || existingKeys.has(normalized)) {
          continue;
        }

        list.push({
          key: `${sourceQuery.id}:${sourceParam.id}`,
          sourceQueryId: sourceQuery.id,
          sourceQueryLabel: sourceLabel,
          parameter: sourceParam,
        });
      }
    }

    this.quickAddParameters = list.sort((left, right) => {
      const byQuery = left.sourceQueryLabel.localeCompare(right.sourceQueryLabel, 'tr');
      if (byQuery !== 0) {
        return byQuery;
      }
      return left.parameter.sortOrder - right.parameter.sortOrder;
    });

    this.applyQuickAddParameterFilter();
    this.quickAddParametersLoading = false;
  }

  closeQuickAddParameterModal(): void {
    this.showQuickAddParameterModal = false;
    this.quickAddParametersLoading = false;
    this.quickAddParameterFilterText = '';
    this.quickAddParameters = [];
    this.filteredQuickAddParameters = [];
    this.selectedQuickAddParameterKeys = [];
  }

  onQuickAddParameterFilterChange(): void {
    this.applyQuickAddParameterFilter();
  }

  isQuickAddParameterSelected(key: string): boolean {
    return this.selectedQuickAddParameterKeys.includes(key);
  }

  toggleQuickAddParameterSelection(key: string): void {
    if (this.isQuickAddParameterSelected(key)) {
      this.selectedQuickAddParameterKeys = this.selectedQuickAddParameterKeys.filter((item) => item !== key);
      return;
    }

    this.selectedQuickAddParameterKeys = [...this.selectedQuickAddParameterKeys, key];
  }

  selectAllFilteredQuickAddParameters(): void {
    const visibleKeys = this.filteredQuickAddParameters.map((item) => item.key);
    this.selectedQuickAddParameterKeys = Array.from(new Set([...this.selectedQuickAddParameterKeys, ...visibleKeys]));
  }

  clearAllQuickAddParameterSelections(): void {
    this.selectedQuickAddParameterKeys = [];
  }

  async addSelectedQuickAddParameters(): Promise<void> {
    if (!this.activeQuery || this.selectedQuickAddParameterKeys.length === 0) {
      return;
    }

    const selectedItems = this.filteredQuickAddParameters.length === this.quickAddParameters.length
      ? this.quickAddParameters.filter((item) => this.selectedQuickAddParameterKeys.includes(item.key))
      : this.quickAddParameters.filter((item) => this.selectedQuickAddParameterKeys.includes(item.key));

    const existingKeys = new Set(
      this.parameters.map((parameter) =>
        this.normalizeParameterName(parameter.jsonName || parameter.parameterName || ''),
      ),
    );
    let sortOrder = this.parameters.length
      ? Math.max(...this.parameters.map((parameter) => parameter.sortOrder)) + 1
      : 1;

    for (const selected of selectedItems) {
      const sourceParameter = selected.parameter;
      const normalized = this.normalizeParameterName(sourceParameter.jsonName || sourceParameter.parameterName || '');
      if (!normalized || existingKeys.has(normalized)) {
        continue;
      }

      const request: CreateNebimQueryParameterRequest = {
        nebimQueryId: this.activeQuery.id,
        parameterName: sourceParameter.parameterName || '',
        jsonName: sourceParameter.jsonName || sourceParameter.parameterName || '',
        dataType: sourceParameter.dataType || 'string',
        description: sourceParameter.description || sourceParameter.parameterName || '',
        isRequired: sourceParameter.isRequired,
        defaultValue: sourceParameter.defaultValue || '',
        sortOrder,
      };

      await this.nebimQueriesService.createParameter(request);
      existingKeys.add(normalized);
      sortOrder += 1;
    }

    this.closeQuickAddParameterModal();
    await this.loadParameters(this.activeQuery.id);
    await this.loadQueries();
  }

  onParameterNameChanged(): void {
    if (this.parameterEditMode) {
      return;
    }

    const value = this.parameterForm.parameterName || '';
    this.parameterForm.jsonName = value;
    this.parameterForm.description = value;
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

    if (!this.parameterEditMode) {
      this.onParameterNameChanged();
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

      if (!this.parameterEditMode && this.autoParameterDialogFlowActive && this.pendingAutoParameterNames.length > 0) {
        this.openNextAutoParameterDialog();
      }
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
    this.schemaGenerationNotice = '';
    this.autoCategorySelectionNotice = '';
  }

  closeQueryDetailModal(): void {
    this.showQueryDetailModal = false;
  }

  closeParameterModal(): void {
    this.showParameterModal = false;
    this.pendingAutoParameterNames = [];
    this.autoParameterDialogFlowActive = false;
  }

  closeCategoryModal(): void {
    this.showCategoryModal = false;
    this.categoryModalSource = 'categoriesView';
  }

  closeDeleteQueryModal(): void {
    this.showDeleteQueryModal = false;
    this.queryToDelete = null;
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

  get topSchemaNodes(): CategorySchemaNode[] {
    return [...this.schemaGraph.nodes]
      .sort((left, right) => {
        if (right.sharedWeight !== left.sharedWeight) {
          return right.sharedWeight - left.sharedWeight;
        }
        return right.queryCount - left.queryCount;
      })
      .slice(0, 6);
  }

  get selectedSchemaNode(): CategorySchemaNode | null {
    if (!this.selectedSchemaNodeId) {
      return null;
    }

    return this.schemaGraph.nodes.find((node) => node.id === this.selectedSchemaNodeId) || null;
  }

  isSchemaNodeSelected(nodeId: string): boolean {
    return this.selectedSchemaNodeId === nodeId;
  }

  onSchemaNodeMouseDown(node: CategorySchemaNode, event: MouseEvent): void {
    event.preventDefault();
    this.selectedSchemaNodeId = node.id;
    this.draggingSchemaNodeId = node.id;
  }

  @HostListener('window:mousemove', ['$event'])
  onSchemaWindowMouseMove(event: MouseEvent): void {
    if (!this.draggingSchemaNodeId) {
      return;
    }

    const svgEl = this.schemaSvg?.nativeElement;
    if (!svgEl) {
      return;
    }

    const targetNode = this.schemaGraph.nodes.find((node) => node.id === this.draggingSchemaNodeId);
    if (!targetNode) {
      return;
    }

    const rect = svgEl.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }

    const scaleX = this.schemaWidth / rect.width;
    const scaleY = this.schemaHeight / rect.height;
    const rawX = (event.clientX - rect.left) * scaleX;
    const rawY = (event.clientY - rect.top) * scaleY;

    targetNode.x = this.clamp(rawX, targetNode.radius + 8, this.schemaWidth - targetNode.radius - 8);
    targetNode.y = this.clamp(rawY, targetNode.radius + 8, this.schemaHeight - targetNode.radius - 20);
    this.updateSchemaEdgeCoordinates();
  }

  @HostListener('window:mouseup')
  onSchemaWindowMouseUp(): void {
    this.draggingSchemaNodeId = null;
  }

  private clearSelection(): void {
    this.activeQuery = null;
    this.showQueryDetailModal = false;
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

  private refreshCategorySchemaGraph(): void {
    const categoryItems = this.categories
      .filter((category) => !!category.id)
      .map((category) => ({
        id: category.id,
        label: (category.name || 'Adsiz Kategori').trim() || 'Adsiz Kategori',
      }));

    if (categoryItems.length === 0) {
      this.schemaGraph = { nodes: [], edges: [], maxNodeWeight: 0, maxEdgeWeight: 0 };
      return;
    }

    const queryIdsByCategory = new Map<string, Set<string>>();
    const coOccurrence = new Map<string, number>();

    for (const category of categoryItems) {
      queryIdsByCategory.set(category.id, new Set<string>());
    }

    for (const query of this.queries) {
      const queryId = query.id;
      if (!queryId) {
        continue;
      }

      const categoryIds = (query.categories || [])
        .map((category) => category.id)
        .filter((id): id is string => !!id && queryIdsByCategory.has(id));

      for (const categoryId of categoryIds) {
        queryIdsByCategory.get(categoryId)?.add(queryId);
      }

      for (let i = 0; i < categoryIds.length; i += 1) {
        for (let j = i + 1; j < categoryIds.length; j += 1) {
          const first = categoryIds[i];
          const second = categoryIds[j];
          const key = first < second ? `${first}__${second}` : `${second}__${first}`;
          coOccurrence.set(key, (coOccurrence.get(key) || 0) + 1);
        }
      }
    }

    const nodeWeights = categoryItems.map((category) => queryIdsByCategory.get(category.id)?.size || 0);
    const maxNodeWeight = Math.max(1, ...nodeWeights);
    const edgeWeights = Array.from(coOccurrence.values());
    const maxEdgeWeight = Math.max(1, ...edgeWeights, 1);

    const sharedWeightByCategory = new Map<string, number>();
    const connectionCountByCategory = new Map<string, number>();
    for (const category of categoryItems) {
      sharedWeightByCategory.set(category.id, 0);
      connectionCountByCategory.set(category.id, 0);
    }

    for (const [pairKey, pairWeight] of coOccurrence.entries()) {
      const [first, second] = pairKey.split('__');
      sharedWeightByCategory.set(first, (sharedWeightByCategory.get(first) || 0) + pairWeight);
      sharedWeightByCategory.set(second, (sharedWeightByCategory.get(second) || 0) + pairWeight);
      connectionCountByCategory.set(first, (connectionCountByCategory.get(first) || 0) + 1);
      connectionCountByCategory.set(second, (connectionCountByCategory.get(second) || 0) + 1);
    }

    const ranked = categoryItems
      .map((category) => {
        const queryCount = queryIdsByCategory.get(category.id)?.size || 0;
        const sharedWeight = sharedWeightByCategory.get(category.id) || 0;
        const connectionCount = connectionCountByCategory.get(category.id) || 0;
        const score = queryCount * 1.8 + sharedWeight * 1.2 + connectionCount;
        return {
          ...category,
          queryCount,
          sharedWeight,
          connectionCount,
          score,
        };
      })
      .sort((left, right) => right.score - left.score);

    const width = this.schemaWidth;
    const height = this.schemaHeight;
    const centerX = width / 2;
    const centerY = height / 2;
    const innerRadius = Math.min(width, height) * 0.24;
    const outerRadius = Math.min(width, height) * 0.39;
    const firstRingCount = Math.max(0, Math.ceil((ranked.length - 1) * 0.45));

    const palette = [18, 32, 96, 148, 205, 268, 334];
    const nodes: CategorySchemaNode[] = ranked.map((entry, index) => {
      let x = centerX;
      let y = centerY;

      if (index > 0) {
        const inFirstRing = index <= firstRingCount;
        const ringItems = inFirstRing ? firstRingCount : ranked.length - 1 - firstRingCount;
        const ringIndex = inFirstRing ? index - 1 : index - firstRingCount - 1;
        const radius = inFirstRing ? innerRadius : outerRadius;
        const angle = (ringItems > 0 ? (ringIndex / ringItems) * Math.PI * 2 : 0) - Math.PI / 2;
        x = centerX + Math.cos(angle) * radius;
        y = centerY + Math.sin(angle) * radius;
      }

      const weightRatio = entry.queryCount / maxNodeWeight;
      const sharedRatio = entry.sharedWeight / Math.max(1, maxEdgeWeight * 2);
      const visualRatio = Math.min(1, weightRatio * 0.7 + sharedRatio * 0.3);
      const radius = 28 + visualRatio * 24;
      const hue = palette[index % palette.length];
      const fillLightness = Math.round(52 - visualRatio * 17);
      const strokeLightness = Math.round(38 - visualRatio * 16);

      return {
        id: entry.id,
        label: entry.label,
        shortLabel: entry.label.length > 18 ? `${entry.label.slice(0, 16)}..` : entry.label,
        queryCount: entry.queryCount,
        connectionCount: entry.connectionCount,
        sharedWeight: entry.sharedWeight,
        x,
        y,
        radius,
        fill: `hsl(${hue} 72% ${fillLightness}%)`,
        stroke: `hsl(${hue} 78% ${strokeLightness}%)`,
        textColor: '#ffffff',
      };
    });

    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const edges: CategorySchemaEdge[] = Array.from(coOccurrence.entries())
      .map(([pairKey, weight]) => {
        const [fromId, toId] = pairKey.split('__');
        const fromNode = nodeById.get(fromId);
        const toNode = nodeById.get(toId);
        if (!fromNode || !toNode) {
          return null;
        }

        const ratio = weight / maxEdgeWeight;
        const edgeHue = 214 - Math.round(ratio * 178);
        return {
          key: pairKey,
          fromId,
          toId,
          fromX: fromNode.x,
          fromY: fromNode.y,
          toX: toNode.x,
          toY: toNode.y,
          weight,
          strokeWidth: 1.2 + ratio * 4.4,
          opacity: 0.2 + ratio * 0.68,
          stroke: `hsl(${edgeHue} 82% 45%)`,
        };
      })
      .filter((edge): edge is CategorySchemaEdge => edge !== null)
      .sort((left, right) => left.weight - right.weight);

    this.schemaGraph = {
      nodes,
      edges,
      maxNodeWeight,
      maxEdgeWeight,
    };

    if (!this.selectedSchemaNodeId || !nodes.some((node) => node.id === this.selectedSchemaNodeId)) {
      this.selectedSchemaNodeId = nodes[0]?.id || null;
    }

    this.updateSchemaEdgeCoordinates();
  }

  private updateSchemaEdgeCoordinates(): void {
    const nodeById = new Map(this.schemaGraph.nodes.map((node) => [node.id, node]));
    for (const edge of this.schemaGraph.edges) {
      const from = nodeById.get(edge.fromId);
      const to = nodeById.get(edge.toId);
      if (!from || !to) {
        continue;
      }

      edge.fromX = from.x;
      edge.fromY = from.y;
      edge.toX = to.x;
      edge.toY = to.y;
    }
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
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

  getDetectedParameterNamesForQueryForm(): string[] {
    return this.extractSqlParameterNames(this.queryForm.queryText || '');
  }

  private openNextAutoParameterDialog(): void {
    if (!this.activeQuery || this.pendingAutoParameterNames.length === 0) {
      this.pendingAutoParameterNames = [];
      this.autoParameterDialogFlowActive = false;
      return;
    }

    const nextParamName = this.pendingAutoParameterNames[0];
    this.pendingAutoParameterNames = this.pendingAutoParameterNames.slice(1);
    this.parameterEditMode = false;
    this.selectedParameter = null;
    this.parameterForm = {
      parameterName: nextParamName,
      jsonName: nextParamName,
      dataType: 'string',
      description: '',
      isRequired: true,
      defaultValue: '',
      sortOrder: this.parameters.length + 1,
    };
    this.showParameterModal = true;
  }

  private extractSqlParameterNames(queryText: string): string[] {
    const source = queryText || '';
    const found: string[] = [];
    const seen = new Set<string>();
    const pattern = /(^|[^@\w])@([A-Za-z_][A-Za-z0-9_]*)/g;

    let match: RegExpExecArray | null = pattern.exec(source);
    while (match) {
      const rawName = match[2] || '';
      const normalizedName = this.normalizeParameterName(rawName);
      if (normalizedName && !seen.has(normalizedName)) {
        seen.add(normalizedName);
        found.push(rawName);
      }
      match = pattern.exec(source);
    }

    return found;
  }

  private normalizeParameterName(name: string): string {
    return (name || '').replace(/^@+/, '').trim().toLowerCase();
  }

  private applyQueryKeyToToolDescription(): void {
    const normalized = (this.queryForm.queryKey || '')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    this.queryForm.toolDescription = normalized;
  }

  private applyQueryKeyToToolName(): void {
    this.queryForm.toolName = (this.queryForm.queryKey || '').trim();
  }

  private removeCopyTokenFromQueryKey(queryKey: string): string {
    return (queryKey || '')
      .replace(/_copy/gi, '')
      .replace(/__+/g, '_')
      .replace(/^_+|_+$/g, '')  
      .trim();
  }

  private queryHasCategory(query: NebimQuery, categoryId: string): boolean {
    return (query.categories || []).some((category) => category.id === categoryId);
  }

  private validateQueryText(queryText: string): string | null {
    const normalizedQuery = queryText.trim().toLowerCase();

    if (!normalizedQuery) {
      return 'Sorgu metni zorunludur.';
    }

    if (normalizedQuery.includes('for json path')) {
      return 'Sorgu içinde "FOR JSON PATH" kullanılamaz.';
    }

    const hasTopLevelSelect = this.extractTopLevelSelectClauses(queryText).length > 0;
    if (!hasTopLevelSelect) {
      return 'Sorgu içinde en az bir ust seviye SELECT bulunmalidir.';
    }

    return null;
  }

  private autoGenerateSchemaFromQueryText(): void {
    const queryText = this.queryForm.queryText || '';
    if (!queryText.trim()) {
      this.queryForm.schemaJson = '';
      this.schemaGenerationNotice = '';
      return;
    }

    const validationError = this.validateQueryText(queryText);
    if (validationError) {
      this.setSchemaGenerationNotice('Query Text geçerli olduğunda schema otomatik üretilecektir.', 'warning');
      return;
    }

    const generatedSchema = this.buildSchemaJsonFromQuery(queryText);
    if (!generatedSchema) {
      this.setSchemaGenerationNotice('Schema otomatik üretilemedi. Query\'den Üret butonu ile tekrar deneyin.', 'warning');
      return;
    }

    this.queryForm.schemaJson = generatedSchema;
    this.setSchemaGenerationNotice('Schema otomatik güncellendi.', 'success');
  }

  private setSchemaGenerationNotice(message: string, type: 'success' | 'warning'): void {
    this.schemaGenerationNotice = message;
    this.schemaGenerationNoticeType = type;
  }

  private validateQueryKeyForEdit(queryKey: string): string | null {
    const normalized = (queryKey || '').trim();
    if (!normalized) {
      return 'Query Key bos olamaz.';
    }

    if (/\s/.test(normalized)) {
      return 'Query Key bosluk iceremez.';
    }

    if (normalized.toLowerCase().includes('copy')) {
      return 'Query Key icinde "copy" gecemez.';
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
    const topLevelClauses = this.extractTopLevelSelectClauses(queryText)
      .filter((clause) => clause.trim().length > 0);

    if (topLevelClauses.length > 0) {
      const bestClause = topLevelClauses.reduce((best, current) => {
        const bestColumnCount = this.splitTopLevelCsv(best).length;
        const currentColumnCount = this.splitTopLevelCsv(current).length;
        if (currentColumnCount > bestColumnCount) {
          return current;
        }

        if (currentColumnCount === bestColumnCount && current.length > best.length) {
          return current;
        }

        return best;
      }, topLevelClauses[0]);

      return bestClause;
    }

    return this.extractSelectClauseByFallback(queryText);
  }

  private extractTopLevelSelectClauses(queryText: string): string[] {
    const selectClauses: string[] = [];
    const lowerQuery = queryText.toLowerCase();
    const selectIndexes = this.findTopLevelKeywordIndexes(queryText, lowerQuery, 'select');

    for (const selectIndex of selectIndexes) {
      const fromIndex = this.findTopLevelFromAfterSelect(queryText, lowerQuery, selectIndex + 'select'.length);
      if (fromIndex < 0) {
        continue;
      }

      const clause = queryText.slice(selectIndex + 'select'.length, fromIndex).trim();
      if (clause) {
        selectClauses.push(clause);
      }
    }

    return selectClauses;
  }

  private findTopLevelKeywordIndexes(queryText: string, lowerQuery: string, keyword: string): number[] {
    const indexes: number[] = [];
    const keywordLength = keyword.length;
    let depth = 0;
    let inSingleQuote = false;
    let inDoubleQuote = false;

    for (let index = 0; index < queryText.length; index += 1) {
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

      if (depth !== 0) {
        continue;
      }

      if (lowerQuery.slice(index, index + keywordLength) !== keyword) {
        continue;
      }

      if (!this.isSqlKeywordBoundary(queryText, index, keywordLength)) {
        continue;
      }

      indexes.push(index);
      index += keywordLength - 1;
    }

    return indexes;
  }

  private findTopLevelFromAfterSelect(queryText: string, lowerQuery: string, startIndex: number): number {
    let depth = 0;
    let inSingleQuote = false;
    let inDoubleQuote = false;

    for (let index = startIndex; index < queryText.length; index += 1) {
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

      if (depth !== 0) {
        continue;
      }

      if (lowerQuery.slice(index, index + 4) === 'from' && this.isSqlKeywordBoundary(queryText, index, 4)) {
        return index;
      }
    }

    return -1;
  }

  private isSqlKeywordBoundary(value: string, startIndex: number, keywordLength: number): boolean {
    const before = value[startIndex - 1] || ' ';
    const after = value[startIndex + keywordLength] || ' ';
    return !/[a-zA-Z0-9_]/.test(before) && !/[a-zA-Z0-9_]/.test(after);
  }

  private extractSelectClauseByFallback(queryText: string): string | null {
    const fallbackMatch = queryText.match(/\bselect\b([\s\S]*?)\bfrom\b/i);
    if (!fallbackMatch?.[1]) {
      return null;
    }

    const clause = fallbackMatch[1].trim();
    return clause || null;
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

  private autoSelectSuggestedCategoriesIfNeeded(): void {
    if (!this.autoActionsEnabled) {
      this.autoCategorySelectionNotice = '';
      return;
    }

    const unselected = this.getUnselectedSuggestedCategories();
    if (!unselected.length) {
      this.autoCategorySelectionNotice = '';
      return;
    }

    const selectedIds = new Set(this.queryForm.categoryIds);
    for (const category of unselected) {
      selectedIds.add(category.id);
    }
    this.queryForm.categoryIds = Array.from(selectedIds);

    const selectedNames = unselected
      .map((category) => category.name || 'Adsiz kategori')
      .join(', ');
    this.autoCategorySelectionNotice = `Otomatik secildi: ${selectedNames}`;
    this.triggerAutoSelectionConfetti();
    this.playAutoSelectionSound();
  }

  private playAutoSelectionSound(): void {
    try {
      this.autoActionAudio.currentTime = 0;
      this.autoActionAudio.volume = 0.5;
      void this.autoActionAudio.play();
    } catch {
      // Audio support is optional; ignore playback errors.
    }
  }

  getConfettiStyle(piece: ConfettiPiece): Record<string, string> {
    return {
      left: `${piece.left}%`,
      animationDelay: `${piece.delayMs}ms`,
      animationDuration: `${piece.durationMs}ms`,
      transform: `rotate(${piece.rotateDeg}deg)`,
      backgroundColor: piece.color,
    };
  }

  private triggerAutoSelectionConfetti(): void {
    const palette = ['#16a34a', '#2563eb', '#f59e0b', '#ec4899', '#14b8a6', '#7c3aed'];
    this.confettiPieces = Array.from({ length: 28 }, (_, index) => ({
      id: Date.now() + index,
      left: Math.round(Math.random() * 100),
      delayMs: Math.round(Math.random() * 220),
      durationMs: 850 + Math.round(Math.random() * 500),
      rotateDeg: Math.round(Math.random() * 360),
      color: palette[index % palette.length],
    }));

    setTimeout(() => {
      this.confettiPieces = [];
    }, 1800);
  }

  private getSuggestedCategoryIds(): string[] {
    const sourceText = `${this.queryForm.queryKey} ${this.queryForm.toolName} ${this.queryForm.queryText}`.trim();
    if (!sourceText) {
      return [];
    }

    return this.categories
      .filter((category) => this.matchesCategory(sourceText, category))
      .map((category) => category.id);
  }

  private applyQuickAddParameterFilter(): void {
    const filter = (this.quickAddParameterFilterText || '').toLocaleLowerCase('tr-TR').trim();
    if (!filter) {
      this.filteredQuickAddParameters = [...this.quickAddParameters];
      return;
    }

    this.filteredQuickAddParameters = this.quickAddParameters.filter((item) =>
      (item.sourceQueryLabel || '').toLocaleLowerCase('tr-TR').includes(filter)
      || (item.parameter.parameterName || '').toLocaleLowerCase('tr-TR').includes(filter)
      || (item.parameter.jsonName || '').toLocaleLowerCase('tr-TR').includes(filter)
      || (item.parameter.description || '').toLocaleLowerCase('tr-TR').includes(filter)
      || (item.parameter.dataType || '').toLocaleLowerCase('tr-TR').includes(filter),
    );
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
