import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';

import { IntegrationsService } from '@/app/core/services/integrations.service';
import { CustomersService } from '@/app/core/services/customers.service';
import { ProductsService } from '@/app/core/services/products.service';
import { OrdersService } from '@/app/core/services/orders.service';
import { OrderStatusesService } from '@/app/core/services/order-statuses.service';
import { PaymentTypesService } from '@/app/core/services/payment-types.service';
import { PaymentStatusesService } from '@/app/core/services/payment-statuses.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { CustomerAddressesService } from '@/app/core/services/customer-addresses.service';
import { CustomerAddress } from '@/app/core/models/customer/customer-address.models';

import { Order, CreateOrderRequest, CreateOrderItemRequest, CreateOrderPaymentRequest, UpdateOrderRequest } from '@/app/core/models/order/order.models';
import { Product } from '@/app/core/models/product/product.models';

interface IntegrationUserSummary {
    id: string;
    integrationId?: string;
    integrationName?: string;
    integrationTypeName?: string;
    integrationDescription?: string;
    userName?: string;
    photoUrl?: string;
    isActive?: boolean;
}

interface CustomerSummary {
    id: string;
    platformName?: string;          // Müşteri adı buradan geliyor
    platformUsername?: string;      // Kullanıcı adı
    platformAccountId?: string;
    status?: number;
    socialMediaAccountId?: string;
    socialMediaAccount?: {
        id: string;
        accountName?: string;
        platform?: string;
    };
    user?: {
        id: string;
        firstName?: string;
        lastName?: string;
        email?: string;
    };
    company?: {
        id: string;
        name?: string;
    };
    // Eski field'lar (backward compatibility)
    fullName?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
    phone?: string;
    phoneNumber?: string;
}

interface CartItem {
    product: Product;
    quantity: number;
    unitPrice: number;
    discountRate: number;
    taxRate: number;
    totalPrice: number;
}

type OrderStep = 'integration' | 'customer' | 'address' | 'products' | 'payment' | 'summary';

@Component({
    selector: 'app-order-create-page',
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './order-create.html',
    styleUrls: ['./order-create.scss'],
    animations: [
        trigger('fadeSlide', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateX(20px)' }),
                animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(-20px)' }))
            ])
        ]),
        trigger('slideUp', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(20px)' }),
                animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
            ])
        ]),
        trigger('cartSlide', [
            transition(':enter', [
                style({ width: 0, opacity: 0, overflow: 'hidden' }),
                animate('250ms ease-out', style({ width: '*', opacity: 1 }))
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ width: 0, opacity: 0 }))
            ])
        ])
    ]
})
export class OrderCreatePage implements OnInit {
    // Adımlar
    steps: { key: OrderStep; label: string; icon: string }[] = [
        { key: 'integration', label: 'Entegrasyon', icon: 'fa-plug' },
        { key: 'customer', label: 'Müşteri', icon: 'fa-user' },
        { key: 'address', label: 'Adres', icon: 'fa-location-dot' },
        { key: 'products', label: 'Ürünler', icon: 'fa-box' },
        { key: 'payment', label: 'Ödeme', icon: 'fa-credit-card' },
        { key: 'summary', label: 'Özet', icon: 'fa-check-circle' }
    ];
    currentStep: OrderStep = 'integration';
    
    // Mode: create veya edit
    isEditMode = false;
    orderId: string | null = null;
    existingOrder: Order | null = null;

    // Step 1: Integration Users
    integrationUsers: IntegrationUserSummary[] = [];
    selectedIntegrationUser: IntegrationUserSummary | null = null;
    integrationSearchText = '';
    loadingIntegrations = false;

    // Step 2: Customers
    customers: CustomerSummary[] = [];
    selectedCustomer: CustomerSummary | null = null;
    customerSearchText = '';
    loadingCustomers = false;
    customerPage = 1;
    customerPageSize = 20;
    customerTotalCount = 0;

    // Step 2.5: Customer Addresses
    customerAddresses: CustomerAddress[] = [];
    selectedAddress: CustomerAddress | null = null;
    loadingAddresses = false;

    // Step 3: Products
    products: Product[] = [];
    productSearchText = '';
    loadingProducts = false;
    productPage = 1;
    productPageSize = 20;
    productTotalCount = 0;
    
    // Ürün Filtreleri
    // API filtreleri
    productFilters = {
        itemCode: '',
        name: '',
        barcode: '',
        brand: '',
        category: ''
    };
    // Tablo içi genel filtre
    productTableFilter = '';

    get filteredProducts(): any[] {
        if (!this.productTableFilter.trim()) {
            return this.products;
        }
        const search = this.productTableFilter.toLowerCase().trim();
        return this.products.filter(p => 
            (p.name?.toLowerCase().includes(search)) ||
            (p.productCode?.toLowerCase().includes(search)) ||
            (p.color?.toLowerCase().includes(search)) ||
            (p.size?.toLowerCase().includes(search)) ||
            (p.barcode?.toLowerCase().includes(search)) ||
            (p.brand?.toLowerCase().includes(search))
        );
    }
    
    // Sepet
    cartItems: CartItem[] = [];
    showCart = true;

    // Step 4: Payment
    orderStatuses: any[] = [];
    paymentTypes: any[] = [];
    paymentStatuses: any[] = [];
    selectedOrderStatusId = '';
    selectedPaymentTypeId = '';
    selectedPaymentStatusId = '';
    paymentAmount = 0;
    paymentNote = '';
    orderDescription = '';

    // Genel
    loading = false;
    companyId = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private integrationsService: IntegrationsService,
        private customersService: CustomersService,
        private productsService: ProductsService,
        private ordersService: OrdersService,
        private orderStatusesService: OrderStatusesService,
        private paymentTypesService: PaymentTypesService,
        private paymentStatusesService: PaymentStatusesService,
        private authStateService: AuthStateService,
        private customerAddressesService: CustomerAddressesService
    ) {}

    ngOnInit(): void {
        // userProfile'dan companyId al
        const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        this.companyId = profile.companyId || '';
        //console.log('CompanyId:', this.companyId);
        
        // Route'dan order id kontrolü
        this.route.params.subscribe(params => {
            if (params['id']) {
                this.orderId = params['id'];
                this.isEditMode = true;
                this.loadExistingOrder();
            } else {
                this.loadIntegrationUsers();
            }
        });

        // Lookup verileri yükle
        this.loadLookupData();
    }

    // ═══════════════════════════════════════════════════════════════
    // LOOKUP VERİLERİ
    // ═══════════════════════════════════════════════════════════════
    async loadLookupData(): Promise<void> {
        try {
            const [statusRes, paymentTypeRes, paymentStatusRes] = await Promise.all([
                this.orderStatusesService.getAll(),
                this.paymentTypesService.getAll(),
                this.paymentStatusesService.getAll()
            ]);
            this.orderStatuses = this.extractArray(statusRes?.data);
            this.paymentTypes = this.extractArray(paymentTypeRes?.data);
            this.paymentStatuses = this.extractArray(paymentStatusRes?.data);

            // Default seçimler
            if (this.orderStatuses.length > 0) {
                this.selectedOrderStatusId = this.orderStatuses[0].id;
            }
            if (this.paymentStatuses.length > 0) {
                this.selectedPaymentStatusId = this.paymentStatuses[0].id;
            }
        } catch (err) {
            console.error('Lookup data load error:', err);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: INTEGRATION USERS
    // ═══════════════════════════════════════════════════════════════
    async loadIntegrationUsers(): Promise<void> {
        if (!this.companyId) {
            console.error('CompanyId boş! userProfile kontrol edin.');
            return;
        }
        this.loadingIntegrations = true;
        try {
            //console.log('Loading integration users for companyId:', this.companyId);
            const response = await this.integrationsService.getIntegrationUsersByCompany(this.companyId);
            //console.log('Integration users response:', response);
            this.integrationUsers = this.extractArray(response?.data);
            //console.log('Extracted integration users:', this.integrationUsers);
        } catch (err) {
            console.error('Integration users load error:', err);
        } finally {
            this.loadingIntegrations = false;
        }
    }

    get filteredIntegrationUsers(): IntegrationUserSummary[] {
        if (!this.integrationSearchText.trim()) return this.integrationUsers;
        const term = this.integrationSearchText.toLowerCase();
        return this.integrationUsers.filter(u => 
            u.userName?.toLowerCase().includes(term) ||
            u.integrationName?.toLowerCase().includes(term) ||
            u.integrationTypeName?.toLowerCase().includes(term) ||
            u.integrationDescription?.toLowerCase().includes(term)
        );
    }

    selectIntegrationUser(user: IntegrationUserSummary): void {
        this.selectedIntegrationUser = user;
        this.goToStep('customer');
        this.loadCustomers();
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: CUSTOMERS
    // ═══════════════════════════════════════════════════════════════
    async loadCustomers(): Promise<void> {
        if (!this.companyId) return;
        this.loadingCustomers = true;
        try {
            const response = await this.customersService.getByCompany(this.companyId, {
                pageNumber: this.customerPage,
                pageSize: this.customerPageSize,
                searchTerm: this.customerSearchText
            });
            const paged = response?.data;
            this.customers = paged?.items ?? [];
            this.customerTotalCount = paged?.totalCount || this.customers.length;
        } catch (err) {
            console.error('Customers load error:', err);
        } finally {
            this.loadingCustomers = false;
        }
    }

    onCustomerSearch(): void {
        this.customerPage = 1;
        this.loadCustomers();
    }

    selectCustomer(customer: CustomerSummary): void {
        this.selectedCustomer = customer;
        this.selectedAddress = null;
        this.goToStep('address');
        this.loadCustomerAddresses();
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 2.5: CUSTOMER ADDRESSES
    // ═══════════════════════════════════════════════════════════════
    async loadCustomerAddresses(): Promise<void> {
        if (!this.selectedCustomer) return;
        this.loadingAddresses = true;
        try {
            const response = await this.customerAddressesService.getByCustomerId(this.selectedCustomer.id);
            this.customerAddresses = this.extractArray(response?.data);
            // Varsayılan adresi otomatik seç
            const defaultAddr = this.customerAddresses.find(a => a.isDefault);
            if (defaultAddr) {
                this.selectedAddress = defaultAddr;
            }
        } catch (err) {
            console.error('Customer addresses load error:', err);
        } finally {
            this.loadingAddresses = false;
        }
    }

    selectAddress(address: CustomerAddress): void {
        this.selectedAddress = address;
    }

    skipAddressSelection(): void {
        this.selectedAddress = null;
        this.goToStep('products');
        this.loadProducts();
    }

    confirmAddressAndContinue(): void {
        this.goToStep('products');
        this.loadProducts();
    }

    getFullAddress(address: CustomerAddress): string {
        const parts: string[] = [];
        if (address.addressLine) parts.push(address.addressLine);
        if (address.districtName) parts.push(address.districtName);
        if (address.cityName) parts.push(address.cityName);
        if (address.countryName) parts.push(address.countryName);
        if (address.postalCode) parts.push(`(${address.postalCode})`);
        return parts.join(', ') || '-';
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: PRODUCTS
    // ═══════════════════════════════════════════════════════════════
    async loadProducts(): Promise<void> {
        if (!this.companyId) return;
        this.loadingProducts = true;
        try {
            const response = await this.productsService.getByCompany(this.companyId, {
                pageNumber: this.productPage,
                pageSize: this.productPageSize,
                searchTerm: this.productSearchText,
                itemCode: this.productFilters.itemCode || undefined,
                barcode: this.productFilters.barcode || undefined,
                name: this.productFilters.name || undefined,
                brand: this.productFilters.brand || undefined,
                category: this.productFilters.category || undefined,
                isActive: true,
                integrationUserId: this.selectedIntegrationUser?.id
            });
            const paged = response?.data;
            this.products = paged?.items ?? [];
            this.productTotalCount = paged?.totalCount || this.products.length;
        } catch (err) {
            console.error('Products load error:', err);
        } finally {
            this.loadingProducts = false;
        }
    }

    onProductSearch(): void {
        this.productPage = 1;
        this.loadProducts();
    }

    onProductFilterChange(): void {
        this.productPage = 1;
        this.loadProducts();
    }

    clearProductFilters(): void {
        this.productFilters = {
            itemCode: '',
            name: '',
            barcode: '',
            brand: '',
            category: ''
        };
        this.productPage = 1;
        this.loadProducts();
    }

    loadMoreProducts(): void {
        if (this.products.length < this.productTotalCount) {
            this.productPage++;
            this.loadProducts();
        }
    }

    addToCart(product: Product): void {
        const existing = this.cartItems.find(ci => ci.product.id === product.id);
        if (existing) {
            existing.quantity++;
            this.updateCartItemTotal(existing);
        } else {
            const item: CartItem = {
                product,
                quantity: 1,
                unitPrice: product.salePrice || product.price || 0,
                discountRate: 0,
                taxRate: 0,
                totalPrice: product.salePrice || product.price || 0
            };
            this.cartItems.push(item);
        }
    }

    updateCartItemTotal(item: CartItem): void {
        const subtotal = item.quantity * item.unitPrice;
        const discount = subtotal * (item.discountRate / 100);
        const afterDiscount = subtotal - discount;
        const tax = afterDiscount * (item.taxRate / 100);
        item.totalPrice = afterDiscount + tax;
    }

    removeFromCart(index: number): void {
        this.cartItems.splice(index, 1);
    }

    updateQuantity(item: CartItem, delta: number): void {
        item.quantity = Math.max(1, item.quantity + delta);
        this.updateCartItemTotal(item);
    }

    get cartTotal(): number {
        return this.cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
    }

    get cartItemCount(): number {
        return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP NAVİGASYON
    // ═══════════════════════════════════════════════════════════════
    goToStep(step: OrderStep): void {
        this.currentStep = step;
    }

    canGoToStep(step: OrderStep): boolean {
        const stepIndex = this.steps.findIndex(s => s.key === step);
        const currentIndex = this.steps.findIndex(s => s.key === this.currentStep);
        
        // Geriye her zaman gidilebilir
        if (stepIndex < currentIndex) return true;
        
        // İleriye gitme kuralları
        switch (step) {
            case 'customer': return !!this.selectedIntegrationUser;
            case 'address': return !!this.selectedIntegrationUser && !!this.selectedCustomer;
            case 'products': return !!this.selectedIntegrationUser && !!this.selectedCustomer;
            case 'payment': return this.cartItems.length > 0;
            case 'summary': return this.cartItems.length > 0 && !!this.selectedOrderStatusId;
            default: return true;
        }
    }

    getStepStatus(step: OrderStep): 'completed' | 'active' | 'pending' {
        const stepIndex = this.steps.findIndex(s => s.key === step);
        const currentIndex = this.steps.findIndex(s => s.key === this.currentStep);
        
        if (stepIndex < currentIndex) return 'completed';
        if (stepIndex === currentIndex) return 'active';
        return 'pending';
    }

    nextStep(): void {
        const currentIndex = this.steps.findIndex(s => s.key === this.currentStep);
        if (currentIndex < this.steps.length - 1) {
            const nextStep = this.steps[currentIndex + 1].key;
            if (this.canGoToStep(nextStep)) {
                this.goToStep(nextStep);
            }
        }
    }

    prevStep(): void {
        const currentIndex = this.steps.findIndex(s => s.key === this.currentStep);
        if (currentIndex > 0) {
            this.goToStep(this.steps[currentIndex - 1].key);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // SİPARİŞ KAYDETME
    // ═══════════════════════════════════════════════════════════════
    async saveOrder(): Promise<void> {
        if (!this.selectedIntegrationUser || !this.selectedCustomer || this.cartItems.length === 0) {
            alert('Lütfen tüm gerekli alanları doldurun.');
            return;
        }

        this.loading = true;
        try {
            const now = new Date();
            const orderDate = now.toISOString().split('T')[0];
            const orderTime = now.toTimeString().split(' ')[0];

            const orderItems: CreateOrderItemRequest[] = this.cartItems.map(item => ({
                productId: item.product.id,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discountRate: item.discountRate,
                taxRate: item.taxRate
            }));

            const request: CreateOrderRequest = {
                integrationUserId: this.selectedIntegrationUser.id,
                companyId: this.companyId,
                userId: this.authStateService.profile?.userId || '',
                customerId: this.selectedCustomer.id,
                orderStatusId: this.selectedOrderStatusId,
                paymentTypeId: this.selectedPaymentTypeId || undefined,
                addressId: this.selectedAddress?.id || undefined,
                orderDate,
                orderTime,
                description: this.orderDescription,
                currencyCode: 'TRY',
                isCreatedByAgent: true,
                items: orderItems
            };

            const orderResponse = await this.ordersService.create(request);
            const createdOrder = orderResponse?.data || orderResponse;
            const newOrderId = createdOrder?.id;

            // Ödeme kaydı oluştur (eğer ödeme tipi ve tutar girilmişse)
            if (newOrderId && this.selectedPaymentTypeId && this.paymentAmount > 0) {
                const paymentRequest: CreateOrderPaymentRequest = {
                    orderId: newOrderId,
                    paymentTypeId: this.selectedPaymentTypeId,
                    paymentStatusId: this.selectedPaymentStatusId,
                    amount: this.paymentAmount,
                    currencyCode: 'TRY',
                    note: this.paymentNote
                };
                await this.ordersService.createPayment(paymentRequest);
            }

            alert('Sipariş başarıyla oluşturuldu!');
            this.router.navigate(['/admin/orders', newOrderId]);
        } catch (err: any) {
            console.error('Order save error:', err);
            const msg = err.error?.message || err.message || 'Sipariş kaydedilemedi';
            alert('Hata: ' + msg);
        } finally {
            this.loading = false;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // MEVCUT SİPARİŞİ YÜKLE (Edit Mode)
    // ═══════════════════════════════════════════════════════════════
    async loadExistingOrder(): Promise<void> {
        if (!this.orderId) return;
        this.loading = true;
        try {
            const response = await this.ordersService.getById(this.orderId);
            this.existingOrder = response?.data ?? null;
            
            if (this.existingOrder) {
                // Mevcut verileri set et
                this.selectedOrderStatusId = this.existingOrder.orderStatus?.id || '';
                this.selectedPaymentTypeId = this.existingOrder.paymentType?.id || '';
                this.orderDescription = this.existingOrder.description || '';

                // Cart'ı doldur (eğer orderItems varsa)
                if (this.existingOrder.orderItems?.length) {
                    this.cartItems = this.existingOrder.orderItems.map(item => ({
                        product: {
                            id: item.productId,
                            name: item.productName || 'Ürün',
                            imageUrl: item.productImageUrl,
                        } as Product,
                        quantity: item.quantity || 1,
                        unitPrice: item.unitPrice || 0,
                        discountRate: item.discountRate || 0,
                        taxRate: item.taxRate || 0,
                        totalPrice: item.totalPrice || 0
                    }));
                }

                // Adımı summary'e getir
                this.currentStep = 'summary';
            }
        } catch (err) {
            console.error('Order load error:', err);
        } finally {
            this.loading = false;
        }
    }

    async updateOrder(): Promise<void> {
        if (!this.orderId || !this.existingOrder) return;
        
        this.loading = true;
        try {
            const request: UpdateOrderRequest = {
                orderStatusId: this.selectedOrderStatusId,
                paymentTypeId: this.selectedPaymentTypeId || undefined,
                addressId: this.existingOrder.address?.id || undefined,
                description: this.orderDescription,
                isCompleted: this.existingOrder.isCompleted || false,
                isCancel: this.existingOrder.isCancel || false
            };
            
            await this.ordersService.update(this.orderId, request);
            alert('Sipariş güncellendi!');
        } catch (err: any) {
            console.error('Order update error:', err);
            alert('Hata: ' + (err.error?.message || 'Güncellenemedi'));
        } finally {
            this.loading = false;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // YARDIMCI
    // ═══════════════════════════════════════════════════════════════
    private extractArray(response: any): any[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
    }

    getPaymentTypeName(id: string): string {
        return this.paymentTypes.find(pt => pt.id === id)?.name || '-';
    }

    getOrderStatusName(id: string): string {
        return this.orderStatuses.find(os => os.id === id)?.name || '-';
    }

    /** Müşteri adını API response yapısına göre döndürür */
    getCustomerName(customer: CustomerSummary): string {
        // API'dan platformName olarak geliyor
        if (customer.platformName) return customer.platformName;
        if (customer.fullName) return customer.fullName;
        if (customer.firstName && customer.lastName) return `${customer.firstName} ${customer.lastName}`;
        if (customer.firstName) return customer.firstName;
        if (customer.name) return customer.name;
        if (customer.user?.firstName) return `${customer.user.firstName} ${customer.user.lastName || ''}`;
        return 'İsimsiz Müşteri';
    }

    /** Müşteri avatar için baş harf döndürür */
    getCustomerInitial(customer: CustomerSummary): string {
        const name = customer.platformName || customer.fullName || customer.firstName || customer.user?.firstName || 'M';
        return name.charAt(0).toUpperCase();
    }
}
