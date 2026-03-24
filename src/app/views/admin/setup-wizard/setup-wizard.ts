import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthStateService } from '@core/services/auth-state.service';

type WizardStep =
  | 'welcome'
  | 'platform-type'
  | 'platform-select'
  | 'platform-details'
  | 'test-order'
  | 'social-media'
  | 'social-connect'
  | 'products-import'
  | 'products-index'
  | 'completed';

interface PlatformOption {
  id: string;
  name: string;
  icon: string;
  color: string;
  gradient: string;
}

interface SocialMediaOption {
  id: string;
  name: string;
  icon: string;
  color: string;
  gradient: string;
  selected: boolean;
}

@Component({
  selector: 'app-setup-wizard-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './setup-wizard.html',
  styleUrl: './setup-wizard.scss',
})
export class SetupWizardPage implements OnInit, OnDestroy {
  currentStep: WizardStep = 'welcome';
  direction: 'forward' | 'backward' = 'forward';
  animating = false;
  userName = '';

  // Step 1 - Welcome
  hasEcommerce: boolean | null = null;

  // Step 2 - Platform type
  platformType: 'website' | 'pazaryeri' | null = null;

  // Step 3 - Platform select
  selectedPlatform: string = '';

  websitePlatforms: PlatformOption[] = [
    { id: 'ticimax', name: 'Ticimax', icon: 'fa-solid fa-globe', color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)' },
    { id: 'shopify', name: 'Shopify', icon: 'fa-brands fa-shopify', color: '#96bf48', gradient: 'linear-gradient(135deg, #96bf48, #5e8e3e)' },
  ];

  pazaryeriPlatforms: PlatformOption[] = [
    { id: 'hepsiburada', name: 'Hepsiburada', icon: 'fa-solid fa-store', color: '#ff6000', gradient: 'linear-gradient(135deg, #ff6000, #ff8533)' },
    { id: 'trendyol', name: 'Trendyol', icon: 'fa-solid fa-bag-shopping', color: '#f27a1a', gradient: 'linear-gradient(135deg, #f27a1a, #ff6000)' },
  ];

  // Step 4 - Platform details
  platformDetails = {
    domainName: '',
    webService: '',
    code: '',
    xmlLink: '',
    apiKey: '',
    apiSecret: '',
    storeUrl: '',
    supplierId: '',
    sellerId: '',
  };

  // Step 5 - Test order
  testOrderStatus: 'idle' | 'loading' | 'success' | 'error' = 'idle';
  testOrderProgress = 0;

  // Step 6 - Social media
  hasSocialMedia: boolean | null = null;
  socialMediaOptions: SocialMediaOption[] = [
    { id: 'facebook', name: 'Facebook', icon: 'fa-brands fa-facebook-f', color: '#1877f2', gradient: 'linear-gradient(135deg, #1877f2, #42a5f5)', selected: false },
    { id: 'instagram', name: 'Instagram', icon: 'fa-brands fa-instagram', color: '#e1306c', gradient: 'linear-gradient(135deg, #833ab4, #e1306c, #f77737)', selected: false },
    { id: 'whatsapp', name: 'WhatsApp', icon: 'fa-brands fa-whatsapp', color: '#25d366', gradient: 'linear-gradient(135deg, #25d366, #128c7e)', selected: false },
  ];

  // Step 7 - Social connect
  socialConnectStatus: 'connecting' | 'done' = 'connecting';
  socialConnectProgress = 0;
  connectedAccounts: string[] = [];
  currentConnecting = '';

  // Step 8 - Products import
  importProgress = 0;
  importStatus: 'idle' | 'importing' | 'done' = 'idle';
  importedCount = 0;
  totalProducts = 247; // Mock

  // Step 9 - Products indexing
  indexProgress = 0;
  indexStatus: 'idle' | 'indexing' | 'done' = 'idle';
  indexedCount = 0;

  // Timers
  private timers: ReturnType<typeof setTimeout>[] = [];
  private intervals: ReturnType<typeof setInterval>[] = [];

  // Steps tracking for progress bar
  readonly allSteps: WizardStep[] = [
    'welcome', 'platform-type', 'platform-select', 'platform-details',
    'test-order', 'social-media', 'social-connect', 'products-import',
    'products-index', 'completed'
  ];

  constructor(
    private authState: AuthStateService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const profile = this.authState.profile;
    if (profile) {
      this.userName = this.capitalize(profile.name);
    }
  }

  ngOnDestroy(): void {
    this.timers.forEach(t => clearTimeout(t));
    this.intervals.forEach(i => clearInterval(i));
  }

  // ─── Navigation ──────────────────────────────
  get currentStepIndex(): number {
    return this.allSteps.indexOf(this.currentStep);
  }

  get progressPercent(): number {
    return Math.round((this.currentStepIndex / (this.allSteps.length - 1)) * 100);
  }

  goToStep(step: WizardStep): void {
    if (this.animating) return;
    const newIndex = this.allSteps.indexOf(step);
    this.direction = newIndex > this.currentStepIndex ? 'forward' : 'backward';
    this.animating = true;
    const t = setTimeout(() => {
      this.currentStep = step;
      const t2 = setTimeout(() => this.animating = false, 50);
      this.timers.push(t2);
    }, 400);
    this.timers.push(t);
  }

  goBack(): void {
    const idx = this.currentStepIndex;
    if (idx <= 0) return;

    // Smart back navigation
    if (this.currentStep === 'social-connect') {
      this.goToStep('social-media');
    } else if (this.currentStep === 'platform-details') {
      this.goToStep('platform-select');
    } else if (this.currentStep === 'platform-select') {
      this.goToStep('platform-type');
    } else {
      this.goToStep(this.allSteps[idx - 1]);
    }
  }

  // ─── Step: Welcome ───────────────────────────
  selectHasEcommerce(value: boolean): void {
    this.hasEcommerce = value;
    if (value) {
      this.goToStep('platform-type');
    }
    // hayır → show message in template, no forward
  }

  // ─── Step: Platform Type ─────────────────────
  selectPlatformType(type: 'website' | 'pazaryeri'): void {
    this.platformType = type;
    this.goToStep('platform-select');
  }

  // ─── Step: Platform Select ───────────────────
  selectPlatform(platform: PlatformOption): void {
    this.selectedPlatform = platform.id;
    this.goToStep('platform-details');
  }

  get currentPlatforms(): PlatformOption[] {
    return this.platformType === 'website' ? this.websitePlatforms : this.pazaryeriPlatforms;
  }

  // ─── Step: Platform Details ──────────────────
  get isTicimax(): boolean { return this.selectedPlatform === 'ticimax'; }
  get isShopify(): boolean { return this.selectedPlatform === 'shopify'; }
  get isHepsiburada(): boolean { return this.selectedPlatform === 'hepsiburada'; }
  get isTrendyol(): boolean { return this.selectedPlatform === 'trendyol'; }

  get platformDetailsFilled(): boolean {
    if (this.isTicimax) {
      return !!(this.platformDetails.domainName && this.platformDetails.webService && this.platformDetails.code);
    }
    if (this.isShopify) {
      return !!(this.platformDetails.apiKey && this.platformDetails.apiSecret && this.platformDetails.storeUrl);
    }
    if (this.isHepsiburada) {
      return !!(this.platformDetails.apiKey && this.platformDetails.apiSecret && this.platformDetails.sellerId);
    }
    if (this.isTrendyol) {
      return !!(this.platformDetails.apiKey && this.platformDetails.apiSecret && this.platformDetails.supplierId);
    }
    return false;
  }

  submitPlatformDetails(): void {
    if (!this.platformDetailsFilled) return;
    this.goToStep('test-order');
  }

  // ─── Step: Test Order ────────────────────────
  startTestOrder(): void {
    this.testOrderStatus = 'loading';
    this.testOrderProgress = 0;

    const interval = setInterval(() => {
      this.testOrderProgress += Math.random() * 15 + 5;
      if (this.testOrderProgress >= 100) {
        this.testOrderProgress = 100;
        clearInterval(interval);
        const t = setTimeout(() => {
          this.testOrderStatus = 'success';
        }, 500);
        this.timers.push(t);
      }
    }, 300);
    this.intervals.push(interval);
  }

  confirmTestOrder(): void {
    this.goToStep('social-media');
  }

  // ─── Step: Social Media ──────────────────────
  toggleSocialMedia(option: SocialMediaOption): void {
    option.selected = !option.selected;
  }

  selectHasSocialMedia(value: boolean): void {
    this.hasSocialMedia = value;
    if (!value) {
      // Skip social connect, go to products
      this.goToStep('products-import');
    }
  }

  get selectedSocialMedia(): SocialMediaOption[] {
    return this.socialMediaOptions.filter(o => o.selected);
  }

  submitSocialMedia(): void {
    if (this.selectedSocialMedia.length === 0) return;
    this.goToStep('social-connect');
    const t = setTimeout(() => this.startSocialConnect(), 800);
    this.timers.push(t);
  }

  // ─── Step: Social Connect ────────────────────
  startSocialConnect(): void {
    this.socialConnectStatus = 'connecting';
    this.socialConnectProgress = 0;
    this.connectedAccounts = [];
    const selected = this.selectedSocialMedia;
    let currentIdx = 0;

    const connectNext = () => {
      if (currentIdx >= selected.length) {
        this.socialConnectStatus = 'done';
        this.socialConnectProgress = 100;
        return;
      }

      this.currentConnecting = selected[currentIdx].name;
      const targetProgress = Math.round(((currentIdx + 1) / selected.length) * 100);

      const interval = setInterval(() => {
        this.socialConnectProgress += 2;
        if (this.socialConnectProgress >= targetProgress) {
          this.socialConnectProgress = targetProgress;
          clearInterval(interval);
          this.connectedAccounts.push(selected[currentIdx].name);
          currentIdx++;
          const t = setTimeout(() => connectNext(), 600);
          this.timers.push(t);
        }
      }, 50);
      this.intervals.push(interval);
    };

    connectNext();
  }

  finishSocialConnect(): void {
    this.goToStep('products-import');
  }

  // ─── Step: Products Import ───────────────────
  startProductImport(): void {
    this.importStatus = 'importing';
    this.importProgress = 0;
    this.importedCount = 0;

    const interval = setInterval(() => {
      this.importProgress += Math.random() * 3 + 1;
      this.importedCount = Math.min(this.totalProducts, Math.round((this.importProgress / 100) * this.totalProducts));

      if (this.importProgress >= 100) {
        this.importProgress = 100;
        this.importedCount = this.totalProducts;
        clearInterval(interval);
        const t = setTimeout(() => {
          this.importStatus = 'done';
        }, 500);
        this.timers.push(t);
      }
    }, 150);
    this.intervals.push(interval);
  }

  finishProductImport(): void {
    this.goToStep('products-index');
  }

  // ─── Step: Products Index ────────────────────
  startProductIndex(): void {
    this.indexStatus = 'indexing';
    this.indexProgress = 0;
    this.indexedCount = 0;

    const interval = setInterval(() => {
      this.indexProgress += Math.random() * 2 + 0.5;
      this.indexedCount = Math.min(this.totalProducts, Math.round((this.indexProgress / 100) * this.totalProducts));

      if (this.indexProgress >= 100) {
        this.indexProgress = 100;
        this.indexedCount = this.totalProducts;
        clearInterval(interval);
        const t = setTimeout(() => {
          this.indexStatus = 'done';
        }, 500);
        this.timers.push(t);
      }
    }, 120);
    this.intervals.push(interval);
  }

  finishProductIndex(): void {
    this.goToStep('completed');
  }

  // ─── Step: Completed ─────────────────────────
  goToDashboard(): void {
    this.router.navigate(['/dashboards']);
  }

  // ─── Helpers ─────────────────────────────────
  private capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  getPlatformName(): string {
    const all = [...this.websitePlatforms, ...this.pazaryeriPlatforms];
    return all.find(p => p.id === this.selectedPlatform)?.name || '';
  }

  getPlatformGradient(): string {
    const all = [...this.websitePlatforms, ...this.pazaryeriPlatforms];
    return all.find(p => p.id === this.selectedPlatform)?.gradient || '';
  }
}
