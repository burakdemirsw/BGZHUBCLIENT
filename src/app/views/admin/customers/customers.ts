import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomersService } from '@/app/core/services/customers.service';
import { Customer } from '@/app/core/models/customer/customer.models';

@Component({
  selector: 'app-customers-page',
  imports: [CommonModule],
  templateUrl: './customers.html',
})
export class CustomersPage implements OnInit {
  customers: Customer[] = [];
  loading = false;

  constructor(private customersService: CustomersService) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  async loadCustomers(): Promise<void> {
    this.loading = true;
    try {
      const response = await this.customersService.getAll();
      this.customers = this.normalize(response);
    } catch (error) {
      console.error('Customers load failed:', error);
    } finally {
      this.loading = false;
    }
  }

  private normalize(source: any): Customer[] {
    if (!source) return [];
    if (Array.isArray(source)) return source;
    if (source?.data) return Array.isArray(source.data) ? source.data : [source.data];
    if (source?.items) return Array.isArray(source.items) ? source.items : [source.items];
    if (source?.result) return Array.isArray(source.result) ? source.result : [source.result];
    if (source?.$values) return Array.isArray(source.$values) ? source.$values : [source.$values];
    return [];
  }

  getDisplayName(customer: Customer): string {
    if (customer.fullName) return customer.fullName;
    const combined = `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim();
    if (combined) return combined;
    return customer.displayName ?? customer.customerCode ?? '-';
  }

  getPhone(customer: Customer): string {
    return customer.phoneNumber ?? '-';
  }

  getStatus(customer: Customer): string {
    if (customer.isBlocked !== undefined) {
      return customer.isBlocked ? 'Engelli' : 'Aktif';
    }
    return customer.status ?? '-';
  }
}
