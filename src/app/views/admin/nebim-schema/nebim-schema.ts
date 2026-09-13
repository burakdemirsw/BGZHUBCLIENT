import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthStateService } from '@core/services/auth-state.service';
import { PagedResult } from '@core/models/pagination.model';
import { NebimSchemaService } from '@core/services/nebim-schema.service';
import {
    CreateNebimSchemaCategoryRequest,
    CreateNebimSchemaColumnRequest,
    CreateNebimSchemaObjectRequest,
    NebimSchemaCategoryResponse,
    NebimSchemaColumnResponse,
    NebimSchemaObjectResponse,
    SetNebimSchemaObjectCategoriesRequest,
    UpdateNebimSchemaCategoryRequest,
    UpdateNebimSchemaColumnRequest,
    UpdateNebimSchemaObjectRequest,
} from '@core/models/nebim-schema/nebim-schema.models';

interface NebimSchemaObjectForm {
    domain: string;
    businessName: string;
    description: string;
    priority: number;
    isAllowed: boolean;
}

interface NebimSchemaColumnForm {
    schemaObjectId: string;
    businessName: string;
    description: string;
    isFilterable: boolean;
    isSortable: boolean;
    isGroupable: boolean;
    isMetricSource: boolean;
    isDateField: boolean;
    isAllowed: boolean;
    isCoreColumn: boolean;
    coreOrder: number;
}

interface NebimSchemaCategoryForm {
    name: string;
    description: string;
    keywords: string;
    isActive: boolean;
}

type SortDirection = 'asc' | 'desc';
type StatusFilter = 'all' | 'active' | 'passive';
type AssignmentFilter = 'all' | 'selected' | 'unselected';
type SelectionFilter = 'all' | 'selected' | 'unselected';

@Component({
    selector: 'app-nebim-schema-page',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './nebim-schema.html',
    styleUrls: ['./nebim-schema.scss'],
})
export class NebimSchemaPage implements OnInit {
    activeTab: 'objects' | 'columns' | 'categories' | 'categoryMaps' = 'objects';
    loading = false;
    errorMessage = '';

    objects: NebimSchemaObjectResponse[] = [];
    columns: NebimSchemaColumnResponse[] = [];
    categories: NebimSchemaCategoryResponse[] = [];

    // Required datatable state for objects
    filterText = '';
    filteredItems: NebimSchemaObjectResponse[] = [];
    pagedItems: NebimSchemaObjectResponse[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];
    objectSortKey: keyof NebimSchemaObjectResponse = 'objectName';
    objectSortDirection: SortDirection = 'asc';
    objectStatusFilter: StatusFilter = 'all';
    selectedObjectIds: string[] = [];

    columnFilterText = '';
    filteredColumns: NebimSchemaColumnResponse[] = [];
    pagedColumns: NebimSchemaColumnResponse[] = [];
    columnCurrentPage = 1;
    columnPageSize = 10;
    columnTotalPages = 1;
    columnTotalPagesArray: number[] = [];
    columnSortKey: keyof NebimSchemaColumnResponse = 'columnName';
    columnSortDirection: SortDirection = 'asc';
    columnStatusFilter: StatusFilter = 'all';
    selectedColumnIds: string[] = [];
    selectedColumnObjectId = '';
    selectedColumnObjectName = '';

    categoryFilterText = '';
    filteredCategories: NebimSchemaCategoryResponse[] = [];
    pagedCategories: NebimSchemaCategoryResponse[] = [];
    categoryCurrentPage = 1;
    categoryPageSize = 10;
    categoryTotalPages = 1;
    categoryTotalPagesArray: number[] = [];
    categorySortKey: keyof NebimSchemaCategoryResponse = 'name';
    categorySortDirection: SortDirection = 'asc';
    categoryStatusFilter: StatusFilter = 'all';
    categorySelectionFilter: SelectionFilter = 'all';

    mapFilterText = '';
    filteredMaps: NebimSchemaCategoryResponse[] = [];
    pagedMaps: NebimSchemaCategoryResponse[] = [];
    mapCurrentPage = 1;
    mapPageSize = 10;
    mapTotalPages = 1;
    mapTotalPagesArray: number[] = [];
    mapSortKey: keyof NebimSchemaCategoryResponse = 'name';
    mapSortDirection: SortDirection = 'asc';
    mapAssignmentFilter: AssignmentFilter = 'all';
    mapObjectFilterText = '';
    filteredMapObjects: NebimSchemaObjectResponse[] = [];
    pagedMapObjects: NebimSchemaObjectResponse[] = [];
    mapObjectCurrentPage = 1;
    mapObjectPageSize = 8;
    mapObjectTotalPages = 1;
    mapObjectTotalPagesArray: number[] = [];

    selectedMapObjectIds: string[] = [];
    selectedMapCategoryIds: string[] = [];
    keepSelectedCategoriesOnObjectChange = false;
    matchedFilterText = '';
    matchedObjectFilterText = '';
    activeMatchedCategoryId = '';
    activeMatchedCategoryName = '';
    matchedCategoryObjects: NebimSchemaObjectResponse[] = [];
    selectedMatchedObjectIds: string[] = [];
    matchedCategoryLoading = false;

    showObjectModal = false;
    objectEditMode = false;
    selectedObject: NebimSchemaObjectResponse | null = null;

    showColumnModal = false;
    columnEditMode = false;
    selectedColumn: NebimSchemaColumnResponse | null = null;

    showCategoryModal = false;
    categoryEditMode = false;
    selectedCategory: NebimSchemaCategoryResponse | null = null;

    objectForm: NebimSchemaObjectForm = this.createEmptyObjectForm();
    columnForm: NebimSchemaColumnForm = this.createEmptyColumnForm();
    categoryForm: NebimSchemaCategoryForm = this.createEmptyCategoryForm();

    constructor(
        private nebimSchemaService: NebimSchemaService,
        private authStateService: AuthStateService,
    ) {}

    ngOnInit(): void {
        void this.loadAll();
    }

    async loadAll(): Promise<void> {
        this.loading = true;
        this.errorMessage = '';
        try {
            await Promise.all([
                this.loadObjects(),
                this.loadColumns(),
                this.loadCategories(),
            ]);
            this.applyMapFilterAndPaging();
        } catch (error) {
            this.errorMessage = this.resolveErrorMessage(error, 'Nebim schema verileri yüklenemedi.');
        } finally {
            this.loading = false;
        }
    }

    async loadObjects(): Promise<void> {
        const response = await this.nebimSchemaService.getObjectsPaged({
            companyId: this.authStateService.profile?.companyId ?? '',
            pageNumber: 1,
            pageSize: 1000,
        });
        const paged = PagedResult.from<NebimSchemaObjectResponse>(response);
        this.objects = paged.items;
        this.applyFilterAndPaging();
        this.applyMapObjectFilterAndPaging();
    }

    async loadColumns(): Promise<void> {
        const response = await this.nebimSchemaService.getColumnsPaged({
            companyId: this.authStateService.profile?.companyId ?? '',
            pageNumber: 1,
            pageSize: 1000,
        });
        const paged = PagedResult.from<NebimSchemaColumnResponse>(response);
        this.columns = paged.items;
        this.applyColumnFilterAndPaging();
    }

    async loadCategories(): Promise<void> {
        const response = await this.nebimSchemaService.getCategories();
        this.categories = this.extractArray<NebimSchemaCategoryResponse>(response?.data);
        this.applyCategoryFilterAndPaging();
        this.applyMapFilterAndPaging();
    }

    onFilterChange(): void {
        this.currentPage = 1;
        this.applyFilterAndPaging();
    }

    onObjectStatusFilterChange(): void {
        this.currentPage = 1;
        this.applyFilterAndPaging();
    }

    setPage(page: number): void {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.applyFilterAndPaging();
    }

    toggleObjectSort(key: keyof NebimSchemaObjectResponse): void {
        if (this.objectSortKey === key) {
            this.objectSortDirection = this.objectSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.objectSortKey = key;
            this.objectSortDirection = 'asc';
        }
        this.applyFilterAndPaging();
    }

    applyFilterAndPaging(): void {
        const q = (this.filterText || '').toLowerCase();
        this.filteredItems = this.objects.filter(item =>
            (item.schemaName || '').toLowerCase().includes(q) ||
            (item.objectName || '').toLowerCase().includes(q) ||
            (item.objectType || '').toLowerCase().includes(q) ||
            (item.domain || '').toLowerCase().includes(q) ||
            (item.businessName || '').toLowerCase().includes(q),
        );
        this.filteredItems = this.filteredItems.filter(item => this.matchesStatus(item.isAllowed, this.objectStatusFilter));
        this.filteredItems = this.sortItems(this.filteredItems, this.objectSortKey, this.objectSortDirection);
        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);

        // Keep only valid selections after data/filter changes.
        const existingIds = new Set(this.objects.map(item => item.id));
        this.selectedObjectIds = this.selectedObjectIds.filter(id => existingIds.has(id));
    }

    isObjectSelected(objectId: string): boolean {
        return this.selectedObjectIds.includes(objectId);
    }

    toggleObjectSelection(objectId: string): void {
        if (this.isObjectSelected(objectId)) {
            this.selectedObjectIds = this.selectedObjectIds.filter(id => id !== objectId);
            return;
        }

        this.selectedObjectIds = [...this.selectedObjectIds, objectId];
    }

    selectAllVisibleObjects(): void {
        const visibleIds = this.pagedItems.map(item => item.id);
        this.selectedObjectIds = Array.from(new Set([...this.selectedObjectIds, ...visibleIds]));
    }

    selectAllFilteredObjects(): void {
        const filteredIds = this.filteredItems.map(item => item.id);
        this.selectedObjectIds = Array.from(new Set([...this.selectedObjectIds, ...filteredIds]));
    }

    clearVisibleObjects(): void {
        const visibleIds = new Set(this.pagedItems.map(item => item.id));
        this.selectedObjectIds = this.selectedObjectIds.filter(id => !visibleIds.has(id));
    }

    clearAllObjectSelections(): void {
        this.selectedObjectIds = [];
    }

    async deleteSelectedObjects(): Promise<void> {
        if (this.selectedObjectIds.length === 0) return;
        const selectedIds = [...this.selectedObjectIds];
        if (!confirm(`${selectedIds.length} adet object kaydini silmek istediginize emin misiniz?`)) return;

        try {
            await Promise.all(selectedIds.map(id => this.nebimSchemaService.deleteObject(id)));
            this.selectedObjectIds = [];
            await this.loadObjects();
        } catch (error) {
            this.errorMessage = this.resolveErrorMessage(error, 'Secili object kayitlari silinemedi.');
        }
    }

    onColumnFilterChange(): void {
        this.columnCurrentPage = 1;
        this.applyColumnFilterAndPaging();
    }

    onColumnStatusFilterChange(): void {
        this.columnCurrentPage = 1;
        this.applyColumnFilterAndPaging();
    }

    setColumnPage(page: number): void {
        if (page < 1 || page > this.columnTotalPages) return;
        this.columnCurrentPage = page;
        this.applyColumnFilterAndPaging();
    }

    toggleColumnSort(key: keyof NebimSchemaColumnResponse): void {
        if (this.columnSortKey === key) {
            this.columnSortDirection = this.columnSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.columnSortKey = key;
            this.columnSortDirection = 'asc';
        }
        this.applyColumnFilterAndPaging();
    }

    applyColumnFilterAndPaging(): void {
        const q = (this.columnFilterText || '').toLowerCase();
        this.filteredColumns = this.columns.filter(item =>
            (item.objectName || '').toLowerCase().includes(q) ||
            (item.columnName || '').toLowerCase().includes(q) ||
            (item.dataType || '').toLowerCase().includes(q) ||
            (item.businessName || '').toLowerCase().includes(q),
        );
        if (this.selectedColumnObjectId) {
            this.filteredColumns = this.filteredColumns.filter(item => item.schemaObjectId === this.selectedColumnObjectId);
        }
        this.filteredColumns = this.filteredColumns.filter(item => this.matchesStatus(item.isAllowed, this.columnStatusFilter));
        this.filteredColumns = this.sortItems(this.filteredColumns, this.columnSortKey, this.columnSortDirection);
        this.columnTotalPages = Math.max(1, Math.ceil(this.filteredColumns.length / this.columnPageSize));
        this.columnTotalPagesArray = Array.from({ length: this.columnTotalPages }, (_, i) => i + 1);
        if (this.columnCurrentPage > this.columnTotalPages) this.columnCurrentPage = this.columnTotalPages;
        const start = (this.columnCurrentPage - 1) * this.columnPageSize;
        this.pagedColumns = this.filteredColumns.slice(start, start + this.columnPageSize);

        // Keep only valid selections after data/filter changes.
        const existingIds = new Set(this.columns.map(item => item.id));
        this.selectedColumnIds = this.selectedColumnIds.filter(id => existingIds.has(id));
    }

    isColumnSelected(columnId: string): boolean {
        return this.selectedColumnIds.includes(columnId);
    }

    toggleColumnSelection(columnId: string): void {
        if (this.isColumnSelected(columnId)) {
            this.selectedColumnIds = this.selectedColumnIds.filter(id => id !== columnId);
            return;
        }

        this.selectedColumnIds = [...this.selectedColumnIds, columnId];
    }

    selectAllVisibleColumns(): void {
        const visibleIds = this.pagedColumns.map(item => item.id);
        this.selectedColumnIds = Array.from(new Set([...this.selectedColumnIds, ...visibleIds]));
    }

    selectAllFilteredColumns(): void {
        const filteredIds = this.filteredColumns.map(item => item.id);
        this.selectedColumnIds = Array.from(new Set([...this.selectedColumnIds, ...filteredIds]));
    }

    clearVisibleColumns(): void {
        const visibleIds = new Set(this.pagedColumns.map(item => item.id));
        this.selectedColumnIds = this.selectedColumnIds.filter(id => !visibleIds.has(id));
    }

    clearAllColumnSelections(): void {
        this.selectedColumnIds = [];
    }

    async deleteSelectedColumns(): Promise<void> {
        if (this.selectedColumnIds.length === 0) return;
        const selectedIds = [...this.selectedColumnIds];
        if (!confirm(`${selectedIds.length} adet column kaydini silmek istediginize emin misiniz?`)) return;

        try {
            await Promise.all(selectedIds.map(id => this.nebimSchemaService.deleteColumn(id)));
            this.selectedColumnIds = [];
            await this.loadColumns();
        } catch (error) {
            this.errorMessage = this.resolveErrorMessage(error, 'Secili column kayitlari silinemedi.');
        }
    }

    openObjectColumns(item: NebimSchemaObjectResponse): void {
        this.activeTab = 'columns';
        this.selectedColumnObjectId = item.id;
        this.selectedColumnObjectName = item.objectName || '-';
        this.columnCurrentPage = 1;
        this.applyColumnFilterAndPaging();
    }

    clearSelectedColumnObject(): void {
        this.selectedColumnObjectId = '';
        this.selectedColumnObjectName = '';
        this.columnCurrentPage = 1;
        this.applyColumnFilterAndPaging();
    }

    onCategoryFilterChange(): void {
        this.categoryCurrentPage = 1;
        this.applyCategoryFilterAndPaging();
    }

    onCategoryStatusFilterChange(): void {
        this.categoryCurrentPage = 1;
        this.applyCategoryFilterAndPaging();
    }

    onCategorySelectionFilterChange(): void {
        this.categoryCurrentPage = 1;
        this.applyCategoryFilterAndPaging();
    }

    setCategoryPage(page: number): void {
        if (page < 1 || page > this.categoryTotalPages) return;
        this.categoryCurrentPage = page;
        this.applyCategoryFilterAndPaging();
    }

    toggleCategorySort(key: keyof NebimSchemaCategoryResponse): void {
        if (this.categorySortKey === key) {
            this.categorySortDirection = this.categorySortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.categorySortKey = key;
            this.categorySortDirection = 'asc';
        }
        this.applyCategoryFilterAndPaging();
    }

    applyCategoryFilterAndPaging(): void {
        const q = (this.categoryFilterText || '').toLowerCase();
        this.filteredCategories = this.categories.filter(item =>
            (item.name || '').toLowerCase().includes(q) ||
            (item.description || '').toLowerCase().includes(q),
        );
        this.filteredCategories = this.filteredCategories.filter(item => this.matchesStatus(item.isActive, this.categoryStatusFilter));
        this.filteredCategories = this.filteredCategories.filter(item => {
            if (this.categorySelectionFilter === 'all') return true;
            if (this.categorySelectionFilter === 'selected') return this.isCategorySelected(item.id);
            return !this.isCategorySelected(item.id);
        });
        this.filteredCategories = this.sortItems(this.filteredCategories, this.categorySortKey, this.categorySortDirection);
        this.categoryTotalPages = Math.max(1, Math.ceil(this.filteredCategories.length / this.categoryPageSize));
        this.categoryTotalPagesArray = Array.from({ length: this.categoryTotalPages }, (_, i) => i + 1);
        if (this.categoryCurrentPage > this.categoryTotalPages) this.categoryCurrentPage = this.categoryTotalPages;
        const start = (this.categoryCurrentPage - 1) * this.categoryPageSize;
        this.pagedCategories = this.filteredCategories.slice(start, start + this.categoryPageSize);
    }

    onMapFilterChange(): void {
        this.mapCurrentPage = 1;
        this.applyMapFilterAndPaging();
    }

    onMapObjectFilterChange(): void {
        this.mapObjectCurrentPage = 1;
        this.applyMapObjectFilterAndPaging();
    }

    onMapAssignmentFilterChange(): void {
        this.mapCurrentPage = 1;
        this.applyMapFilterAndPaging();
    }

    setMapObjectPage(page: number): void {
        if (page < 1 || page > this.mapObjectTotalPages) return;
        this.mapObjectCurrentPage = page;
        this.applyMapObjectFilterAndPaging();
    }

    onMatchedFilterChange(): void {
        this.matchedFilterText = this.matchedFilterText || '';
    }

    onMatchedObjectFilterChange(): void {
        this.matchedObjectFilterText = this.matchedObjectFilterText || '';
    }

    setMapPage(page: number): void {
        if (page < 1 || page > this.mapTotalPages) return;
        this.mapCurrentPage = page;
        this.applyMapFilterAndPaging();
    }

    toggleMapSort(key: keyof NebimSchemaCategoryResponse): void {
        if (this.mapSortKey === key) {
            this.mapSortDirection = this.mapSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.mapSortKey = key;
            this.mapSortDirection = 'asc';
        }
        this.applyMapFilterAndPaging();
    }

    applyMapFilterAndPaging(): void {
        const q = (this.mapFilterText || '').toLowerCase();
        this.filteredMaps = this.categories.filter(item =>
            (item.name || '').toLowerCase().includes(q) ||
            (item.description || '').toLowerCase().includes(q) ||
            (item.keywords || '').toLowerCase().includes(q),
        );
        this.filteredMaps = this.filteredMaps.filter(item => {
            if (this.mapAssignmentFilter === 'all') return true;
            if (this.mapAssignmentFilter === 'selected') return this.isCategorySelected(item.id);
            return !this.isCategorySelected(item.id);
        });
        this.filteredMaps = this.sortItems(this.filteredMaps, this.mapSortKey, this.mapSortDirection);
        this.mapTotalPages = Math.max(1, Math.ceil(this.filteredMaps.length / this.mapPageSize));
        this.mapTotalPagesArray = Array.from({ length: this.mapTotalPages }, (_, i) => i + 1);
        if (this.mapCurrentPage > this.mapTotalPages) this.mapCurrentPage = this.mapTotalPages;
        const start = (this.mapCurrentPage - 1) * this.mapPageSize;
        this.pagedMaps = this.filteredMaps.slice(start, start + this.mapPageSize);
    }

    applyMapObjectFilterAndPaging(): void {
        const q = (this.mapObjectFilterText || '').toLowerCase();
        this.filteredMapObjects = this.objects.filter(item =>
            (item.schemaName || '').toLowerCase().includes(q) ||
            (item.objectName || '').toLowerCase().includes(q) ||
            (item.objectType || '').toLowerCase().includes(q) ||
            (item.domain || '').toLowerCase().includes(q),
        );
        this.filteredMapObjects = this.sortItems(this.filteredMapObjects, 'objectName', 'asc');
        this.mapObjectTotalPages = Math.max(1, Math.ceil(this.filteredMapObjects.length / this.mapObjectPageSize));
        this.mapObjectTotalPagesArray = Array.from({ length: this.mapObjectTotalPages }, (_, i) => i + 1);
        if (this.mapObjectCurrentPage > this.mapObjectTotalPages) this.mapObjectCurrentPage = this.mapObjectTotalPages;
        const start = (this.mapObjectCurrentPage - 1) * this.mapObjectPageSize;
        this.pagedMapObjects = this.filteredMapObjects.slice(start, start + this.mapObjectPageSize);
    }

    async onMapObjectChange(): Promise<void> {
        if (this.selectedMapObjectIds.length === 0) {
            if (!this.keepSelectedCategoriesOnObjectChange) {
                this.selectedMapCategoryIds = [];
            }
            this.clearMatchedCategoryObjects();
            this.applyCategoryFilterAndPaging();
            this.applyMapFilterAndPaging();
            return;
        }

        try {
            const responses = await Promise.all(
                this.selectedMapObjectIds.map(id => this.nebimSchemaService.getObjectCategories(id)),
            );

            const loadedIds = responses
                .flatMap(response => this.extractArray<NebimSchemaCategoryResponse>(response?.data))
                .map(item => item.id);

            this.selectedMapCategoryIds = this.keepSelectedCategoriesOnObjectChange
                ? Array.from(new Set([...this.selectedMapCategoryIds, ...loadedIds]))
                : Array.from(new Set(loadedIds));

            if (this.activeMatchedCategoryId) {
                await this.loadMatchedCategoryObjects(this.activeMatchedCategoryId);
            }

            this.applyCategoryFilterAndPaging();
            this.applyMapFilterAndPaging();
        } catch (error) {
            this.errorMessage = this.resolveErrorMessage(error, 'Object category eşleşmeleri yüklenemedi.');
        }
    }

    isMapObjectSelected(schemaObjectId: string): boolean {
        return this.selectedMapObjectIds.includes(schemaObjectId);
    }

    async toggleMapObjectSelection(schemaObjectId: string): Promise<void> {
        if (this.isMapObjectSelected(schemaObjectId)) {
            this.selectedMapObjectIds = this.selectedMapObjectIds.filter(id => id !== schemaObjectId);
        } else {
            this.selectedMapObjectIds = [...this.selectedMapObjectIds, schemaObjectId];
        }
        await this.onMapObjectChange();
    }

    async selectAllVisibleMapObjects(): Promise<void> {
        const visibleIds = this.pagedMapObjects.map(item => item.id);
        this.selectedMapObjectIds = Array.from(new Set([...this.selectedMapObjectIds, ...visibleIds]));
        await this.onMapObjectChange();
    }

    async clearVisibleMapObjects(): Promise<void> {
        const visibleIds = new Set(this.pagedMapObjects.map(item => item.id));
        this.selectedMapObjectIds = this.selectedMapObjectIds.filter(id => !visibleIds.has(id));
        await this.onMapObjectChange();
    }

    async clearAllMapObjects(): Promise<void> {
        this.selectedMapObjectIds = [];
        await this.onMapObjectChange();
    }

    isCategorySelected(categoryId: string): boolean {
        return this.selectedMapCategoryIds.includes(categoryId);
    }

    toggleCategorySelection(categoryId: string): void {
        if (this.isCategorySelected(categoryId)) {
            this.selectedMapCategoryIds = this.selectedMapCategoryIds.filter(id => id !== categoryId);
            this.applyCategoryFilterAndPaging();
            this.applyMapFilterAndPaging();
            return;
        }

        this.selectedMapCategoryIds = [...this.selectedMapCategoryIds, categoryId];
        this.applyCategoryFilterAndPaging();
        this.applyMapFilterAndPaging();
    }

    selectAllVisibleCategoriesFromCategoryTable(): void {
        const visibleIds = this.pagedCategories.map(item => item.id);
        this.selectedMapCategoryIds = Array.from(new Set([...this.selectedMapCategoryIds, ...visibleIds]));
        this.applyCategoryFilterAndPaging();
        this.applyMapFilterAndPaging();
    }

    clearVisibleCategoriesFromCategoryTable(): void {
        const visibleIds = new Set(this.pagedCategories.map(item => item.id));
        this.selectedMapCategoryIds = this.selectedMapCategoryIds.filter(id => !visibleIds.has(id));
        this.applyCategoryFilterAndPaging();
        this.applyMapFilterAndPaging();
    }

    goToObjectCategoryMapping(): void {
        this.activeTab = 'categoryMaps';
        this.mapCurrentPage = 1;
        this.applyMapFilterAndPaging();
    }

    selectAllVisibleCategories(): void {
        const visibleIds = this.pagedMaps.map(item => item.id);
        this.selectedMapCategoryIds = Array.from(new Set([...this.selectedMapCategoryIds, ...visibleIds]));
        this.applyMapFilterAndPaging();
    }

    clearVisibleCategories(): void {
        const visibleIds = new Set(this.pagedMaps.map(item => item.id));
        this.selectedMapCategoryIds = this.selectedMapCategoryIds.filter(id => !visibleIds.has(id));
        this.applyMapFilterAndPaging();
    }

    clearAllCategorySelections(): void {
        this.selectedMapCategoryIds = [];
        this.applyMapFilterAndPaging();
    }

    async removeMatchedCategory(categoryId: string): Promise<void> {
        if (this.selectedMapObjectIds.length === 0) {
            this.errorMessage = 'Silme icin once en az bir object seciniz.';
            return;
        }

        try {
            await Promise.all(
                this.selectedMapObjectIds.map(async objectId => {
                    const response = await this.nebimSchemaService.getObjectCategories(objectId);
                    const existing = this.extractArray<NebimSchemaCategoryResponse>(response?.data).map(item => item.id);
                    const request: SetNebimSchemaObjectCategoriesRequest = {
                        categoryIds: existing.filter(id => id !== categoryId),
                    };
                    await this.nebimSchemaService.setObjectCategories(objectId, request);
                }),
            );

            this.selectedMapCategoryIds = this.selectedMapCategoryIds.filter(id => id !== categoryId);
            if (this.activeMatchedCategoryId === categoryId) {
                this.clearMatchedCategoryObjects();
            }

            await this.onMapObjectChange();
        } catch (error) {
            this.errorMessage = this.resolveErrorMessage(error, 'Eslestirilmis category silinemedi.');
        }
    }

    async removeMatchedObjectFromActiveCategory(schemaObjectId: string): Promise<void> {
        if (!this.activeMatchedCategoryId) return;

        try {
            const response = await this.nebimSchemaService.getObjectCategories(schemaObjectId);
            const existing = this.extractArray<NebimSchemaCategoryResponse>(response?.data).map(item => item.id);
            const request: SetNebimSchemaObjectCategoriesRequest = {
                categoryIds: existing.filter(id => id !== this.activeMatchedCategoryId),
            };

            await this.nebimSchemaService.setObjectCategories(schemaObjectId, request);

            this.selectedMapCategoryIds = this.selectedMapCategoryIds.filter(id => id !== this.activeMatchedCategoryId);
            this.selectedMatchedObjectIds = this.selectedMatchedObjectIds.filter(id => id !== schemaObjectId);
            await this.onMapObjectChange();
            await this.loadMatchedCategoryObjects(this.activeMatchedCategoryId);
        } catch (error) {
            this.errorMessage = this.resolveErrorMessage(error, 'Object eslesmesi silinemedi.');
        }
    }

    isMatchedObjectSelected(schemaObjectId: string): boolean {
        return this.selectedMatchedObjectIds.includes(schemaObjectId);
    }

    toggleMatchedObjectSelection(schemaObjectId: string): void {
        if (this.isMatchedObjectSelected(schemaObjectId)) {
            this.selectedMatchedObjectIds = this.selectedMatchedObjectIds.filter(id => id !== schemaObjectId);
            return;
        }

        this.selectedMatchedObjectIds = [...this.selectedMatchedObjectIds, schemaObjectId];
    }

    selectAllVisibleMatchedObjects(): void {
        const visibleIds = this.getMatchedCategoryObjects().map(item => item.id);
        this.selectedMatchedObjectIds = Array.from(new Set([...this.selectedMatchedObjectIds, ...visibleIds]));
    }

    clearVisibleMatchedObjects(): void {
        const visibleIds = new Set(this.getMatchedCategoryObjects().map(item => item.id));
        this.selectedMatchedObjectIds = this.selectedMatchedObjectIds.filter(id => !visibleIds.has(id));
    }

    clearAllMatchedObjectSelections(): void {
        this.selectedMatchedObjectIds = [];
    }

    async removeSelectedMatchedObjectsFromActiveCategory(): Promise<void> {
        if (!this.activeMatchedCategoryId || this.selectedMatchedObjectIds.length === 0) return;

        const selectedObjectIds = [...this.selectedMatchedObjectIds];

        try {
            await Promise.all(
                selectedObjectIds.map(async objectId => {
                    const response = await this.nebimSchemaService.getObjectCategories(objectId);
                    const existing = this.extractArray<NebimSchemaCategoryResponse>(response?.data).map(item => item.id);
                    const request: SetNebimSchemaObjectCategoriesRequest = {
                        categoryIds: existing.filter(id => id !== this.activeMatchedCategoryId),
                    };
                    await this.nebimSchemaService.setObjectCategories(objectId, request);
                }),
            );

            this.selectedMatchedObjectIds = [];
            this.selectedMapCategoryIds = this.selectedMapCategoryIds.filter(id => id !== this.activeMatchedCategoryId);
            await this.onMapObjectChange();
            await this.loadMatchedCategoryObjects(this.activeMatchedCategoryId);
        } catch (error) {
            this.errorMessage = this.resolveErrorMessage(error, 'Secili object eslesmeleri silinemedi.');
        }
    }

    getSelectedObjectName(): string {
        if (this.selectedMapObjectIds.length === 0) return '-';
        const names = this.objects
            .filter(item => this.selectedMapObjectIds.includes(item.id))
            .map(item => item.objectName || '-')
            .slice(0, 3);

        if (this.selectedMapObjectIds.length <= 3) {
            return names.join(', ');
        }

        return `${names.join(', ')} +${this.selectedMapObjectIds.length - 3}`;
    }

    getMatchedCategories(): NebimSchemaCategoryResponse[] {
        const selected = new Set(this.selectedMapCategoryIds);
        const query = (this.matchedFilterText || '').toLowerCase();

        return this.categories
            .filter(item => selected.has(item.id))
            .filter(item =>
                (item.name || '').toLowerCase().includes(query) ||
                (item.description || '').toLowerCase().includes(query) ||
                (item.keywords || '').toLowerCase().includes(query),
            )
            .sort((a, b) => this.compareValues(a.name, b.name));
    }

    getMatchedCategoryObjects(): NebimSchemaObjectResponse[] {
        const query = (this.matchedObjectFilterText || '').toLowerCase();
        return this.matchedCategoryObjects
            .filter(item =>
                (item.schemaName || '').toLowerCase().includes(query) ||
                (item.objectName || '').toLowerCase().includes(query) ||
                (item.objectType || '').toLowerCase().includes(query) ||
                (item.domain || '').toLowerCase().includes(query),
            )
            .sort((a, b) => this.compareValues(a.objectName, b.objectName));
    }

    async viewCategoryMatches(categoryId: string): Promise<void> {
        await this.loadMatchedCategoryObjects(categoryId);
    }

    private clearMatchedCategoryObjects(): void {
        this.activeMatchedCategoryId = '';
        this.activeMatchedCategoryName = '';
        this.matchedCategoryObjects = [];
        this.selectedMatchedObjectIds = [];
        this.matchedObjectFilterText = '';
    }

    private async loadMatchedCategoryObjects(categoryId: string): Promise<void> {
        if (!categoryId) {
            this.clearMatchedCategoryObjects();
            return;
        }

        this.matchedCategoryLoading = true;
        this.errorMessage = '';
        this.activeMatchedCategoryId = categoryId;

        const category = this.categories.find(item => item.id === categoryId);
        this.activeMatchedCategoryName = category?.name || '-';

        try {
            const targetObjects = this.selectedMapObjectIds.length > 0
                ? this.objects.filter(item => this.selectedMapObjectIds.includes(item.id))
                : this.objects;

            const responses = await Promise.all(
                targetObjects.map(async obj => {
                    const response = await this.nebimSchemaService.getObjectCategories(obj.id);
                    return { obj, categories: this.extractArray<NebimSchemaCategoryResponse>(response?.data) };
                }),
            );

            this.matchedCategoryObjects = responses
                .filter(result => result.categories.some(item => item.id === categoryId))
                .map(result => result.obj);

            const currentIds = new Set(this.matchedCategoryObjects.map(item => item.id));
            this.selectedMatchedObjectIds = this.selectedMatchedObjectIds.filter(id => currentIds.has(id));
        } catch (error) {
            this.errorMessage = this.resolveErrorMessage(error, 'Kategori eslesmeleri yuklenemedi.');
            this.matchedCategoryObjects = [];
            this.selectedMatchedObjectIds = [];
        } finally {
            this.matchedCategoryLoading = false;
        }
    }

    async saveObjectCategories(): Promise<void> {
        if (this.selectedMapObjectIds.length === 0) {
            this.errorMessage = 'Lutfen category atamak icin once en az bir object seciniz.';
            return;
        }

        try {
            const request: SetNebimSchemaObjectCategoriesRequest = {
                categoryIds: this.selectedMapCategoryIds,
            };
            await Promise.all(
                this.selectedMapObjectIds.map(id => this.nebimSchemaService.setObjectCategories(id, request)),
            );
        } catch (error) {
            this.errorMessage = this.resolveErrorMessage(error, 'Object category eşleşmeleri kaydedilemedi.');
        }
    }

    openCreateObject(): void {
        this.objectEditMode = false;
        this.selectedObject = null;
        this.objectForm = this.createEmptyObjectForm();
        this.showObjectModal = true;
    }

    openEditObject(item: NebimSchemaObjectResponse): void {
        this.objectEditMode = true;
        this.selectedObject = item;
        this.objectForm = {
            domain: item.domain || '',
            businessName: item.businessName || '',
            description: item.description || '',
            priority: this.toNumber(item.priority),
            isAllowed: item.isAllowed,
        };
        this.showObjectModal = true;
    }

    async saveObject(): Promise<void> {
        try {
            if (this.objectEditMode && this.selectedObject) {
                const request: UpdateNebimSchemaObjectRequest = {
                    domain: this.objectForm.domain || null,
                    businessName: this.objectForm.businessName || null,
                    description: this.objectForm.description || null,
                    priority: this.objectForm.priority,
                    isAllowed: this.objectForm.isAllowed,
                };
                await this.nebimSchemaService.updateObject(this.selectedObject.id, request);
            } else {
                const request: CreateNebimSchemaObjectRequest = {
                    domain: this.objectForm.domain || null,
                    businessName: this.objectForm.businessName || null,
                    description: this.objectForm.description || null,
                    priority: this.objectForm.priority,
                    isAllowed: this.objectForm.isAllowed,
                };
                await this.nebimSchemaService.createObject(request);
            }
            this.showObjectModal = false;
            await this.loadObjects();
        } catch (error) {
            this.errorMessage = this.resolveErrorMessage(error, 'Nebim schema object kaydı kaydedilemedi.');
        }
    }

    async deleteObject(item: NebimSchemaObjectResponse): Promise<void> {
        if (!confirm('Seçili object kaydını silmek istediğinize emin misiniz?')) return;
        try {
            await this.nebimSchemaService.deleteObject(item.id);
            this.selectedObjectIds = this.selectedObjectIds.filter(id => id !== item.id);
            await this.loadObjects();
        } catch (error) {
            this.errorMessage = this.resolveErrorMessage(error, 'Nebim schema object kaydı silinemedi.');
        }
    }

    openCreateColumn(): void {
        this.columnEditMode = false;
        this.selectedColumn = null;
        this.columnForm = this.createEmptyColumnForm();
        if (this.selectedColumnObjectId) {
            this.columnForm.schemaObjectId = this.selectedColumnObjectId;
        }
        this.showColumnModal = true;
    }

    openEditColumn(item: NebimSchemaColumnResponse): void {
        this.columnEditMode = true;
        this.selectedColumn = item;
        this.columnForm = {
            schemaObjectId: item.schemaObjectId,
            businessName: item.businessName || '',
            description: item.description || '',
            isFilterable: item.isFilterable,
            isSortable: item.isSortable,
            isGroupable: item.isGroupable,
            isMetricSource: item.isMetricSource,
            isDateField: item.isDateField,
            isAllowed: item.isAllowed,
            isCoreColumn: item.isCoreColumn,
            coreOrder: this.toNumber(item.coreOrder),
        };
        this.showColumnModal = true;
    }

    async saveColumn(): Promise<void> {
        try {
            if (this.columnEditMode && this.selectedColumn) {
                const request: UpdateNebimSchemaColumnRequest = {
                    businessName: this.columnForm.businessName || null,
                    description: this.columnForm.description || null,
                    isFilterable: this.columnForm.isFilterable,
                    isSortable: this.columnForm.isSortable,
                    isGroupable: this.columnForm.isGroupable,
                    isMetricSource: this.columnForm.isMetricSource,
                    isDateField: this.columnForm.isDateField,
                    isAllowed: this.columnForm.isAllowed,
                    isCoreColumn: this.columnForm.isCoreColumn,
                    coreOrder: this.columnForm.coreOrder,
                };
                await this.nebimSchemaService.updateColumn(this.selectedColumn.id, request);
            } else {
                const request: CreateNebimSchemaColumnRequest = {
                    schemaObjectId: this.columnForm.schemaObjectId,
                    businessName: this.columnForm.businessName || null,
                    description: this.columnForm.description || null,
                    isFilterable: this.columnForm.isFilterable,
                    isSortable: this.columnForm.isSortable,
                    isGroupable: this.columnForm.isGroupable,
                    isMetricSource: this.columnForm.isMetricSource,
                    isDateField: this.columnForm.isDateField,
                    isAllowed: this.columnForm.isAllowed,
                    isCoreColumn: this.columnForm.isCoreColumn,
                    coreOrder: this.columnForm.coreOrder,
                };
                await this.nebimSchemaService.createColumn(request);
            }
            this.showColumnModal = false;
            await this.loadColumns();
        } catch (error) {
            this.errorMessage = this.resolveErrorMessage(error, 'Nebim schema column kaydı kaydedilemedi.');
        }
    }

    async deleteColumn(item: NebimSchemaColumnResponse): Promise<void> {
        if (!confirm('Seçili column kaydını silmek istediğinize emin misiniz?')) return;
        try {
            await this.nebimSchemaService.deleteColumn(item.id);
            this.selectedColumnIds = this.selectedColumnIds.filter(id => id !== item.id);
            await this.loadColumns();
        } catch (error) {
            this.errorMessage = this.resolveErrorMessage(error, 'Nebim schema column kaydı silinemedi.');
        }
    }

    openCreateCategory(): void {
        this.categoryEditMode = false;
        this.selectedCategory = null;
        this.categoryForm = this.createEmptyCategoryForm();
        this.showCategoryModal = true;
    }

    openEditCategory(item: NebimSchemaCategoryResponse): void {
        this.categoryEditMode = true;
        this.selectedCategory = item;
        this.categoryForm = {
            name: item.name || '',
            description: item.description || '',
            keywords: item.keywords || '',
            isActive: item.isActive,
        };
        this.showCategoryModal = true;
    }

    async saveCategory(): Promise<void> {
        try {
            if (this.categoryEditMode && this.selectedCategory) {
                const request: UpdateNebimSchemaCategoryRequest = {
                    name: this.categoryForm.name || null,
                    description: this.categoryForm.description || null,
                    keywords: this.categoryForm.keywords || null,
                    isActive: this.categoryForm.isActive,
                };
                await this.nebimSchemaService.updateCategory(this.selectedCategory.id, request);
            } else {
                const request: CreateNebimSchemaCategoryRequest = {
                    name: this.categoryForm.name || null,
                    description: this.categoryForm.description || null,
                    keywords: this.categoryForm.keywords || null,
                    isActive: this.categoryForm.isActive,
                };
                await this.nebimSchemaService.createCategory(request);
            }
            this.showCategoryModal = false;
            await this.loadCategories();
        } catch (error) {
            this.errorMessage = this.resolveErrorMessage(error, 'Nebim schema category kaydı kaydedilemedi.');
        }
    }

    async deleteCategory(item: NebimSchemaCategoryResponse): Promise<void> {
        if (!confirm('Seçili category kaydını silmek istediğinize emin misiniz?')) return;
        try {
            await this.nebimSchemaService.deleteCategory(item.id);
            await this.loadCategories();
        } catch (error) {
            this.errorMessage = this.resolveErrorMessage(error, 'Nebim schema category kaydı silinemedi.');
        }
    }

    closeAllModals(): void {
        this.showObjectModal = false;
        this.showColumnModal = false;
        this.showCategoryModal = false;
    }

    private createEmptyObjectForm(): NebimSchemaObjectForm {
        return {
            domain: '',
            businessName: '',
            description: '',
            priority: 0,
            isAllowed: true,
        };
    }

    private createEmptyColumnForm(): NebimSchemaColumnForm {
        return {
            schemaObjectId: '',
            businessName: '',
            description: '',
            isFilterable: false,
            isSortable: false,
            isGroupable: false,
            isMetricSource: false,
            isDateField: false,
            isAllowed: true,
            isCoreColumn: false,
            coreOrder: 0,
        };
    }

    private createEmptyCategoryForm(): NebimSchemaCategoryForm {
        return {
            name: '',
            description: '',
            keywords: '',
            isActive: true,
        };
    }

    private toNumber(value: number | string): number {
        return typeof value === 'string' ? Number(value) : value;
    }

    getSortIndicator(
        activeKey: string,
        currentKey: string,
        direction: SortDirection,
    ): string {
        if (activeKey !== currentKey) return '';
        return direction === 'asc' ? '↑' : '↓';
    }

    private sortItems<T, K extends keyof T>(
        items: T[],
        key: K,
        direction: SortDirection,
    ): T[] {
        const sorted = [...items].sort((a, b) => this.compareValues(a[key], b[key]));
        return direction === 'asc' ? sorted : sorted.reverse();
    }

    private compareValues(left: unknown, right: unknown): number {
        if (left === right) return 0;
        if (left == null) return -1;
        if (right == null) return 1;

        const leftNum = this.parseNumber(left);
        const rightNum = this.parseNumber(right);
        if (leftNum !== null && rightNum !== null) return leftNum - rightNum;

        const leftText = String(left).toLowerCase();
        const rightText = String(right).toLowerCase();
        return leftText.localeCompare(rightText, 'tr');
    }

    private parseNumber(value: unknown): number | null {
        if (typeof value === 'number') return value;
        if (typeof value !== 'string') return null;
        const converted = Number(value);
        return Number.isNaN(converted) ? null : converted;
    }

    private matchesStatus(isActive: boolean, filter: StatusFilter): boolean {
        if (filter === 'all') return true;
        return filter === 'active' ? isActive : !isActive;
    }

    private extractArray<T>(data: T[] | T | { $values?: T[] } | null | undefined): T[] {
        if (Array.isArray(data)) return data;
        if (data && typeof data === 'object' && '$values' in data && Array.isArray(data.$values)) {
            return data.$values;
        }
        if (data && typeof data === 'object') return [data as T];
        return [];
    }

    private resolveErrorMessage(error: unknown, fallback: string): string {
        const maybeError = error as { error?: { innerError?: string }; message?: string } | null;
        const backendMessage = maybeError?.error?.innerError;
        const genericMessage = maybeError?.message;
        return backendMessage || genericMessage || fallback;
    }

    getObjectColumnCount(schemaObjectId: string): number {
        return this.columns.filter(item => item.schemaObjectId === schemaObjectId).length;
    }
}
