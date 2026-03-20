import {Component} from '@angular/core';
import {NgIcon} from '@ng-icons/core';
import {RouterLink} from '@angular/router';

type PlanFeature = { text: string; included: boolean; };
type Plan = {
    name: string;
    description: string;
    price: number | null;
    priceLabel?: string;
    period: string;
    highlight: string;
    features: PlanFeature[];
    isPopular?: boolean;
    btnText: string;
    btnLink: string;
};

@Component({
    selector: 'app-pricing-plans',
    imports: [NgIcon, RouterLink],
    templateUrl: './pricing-plans.html',
    styles: ``
})
export class PricingPlans {
    plans: Plan[] = [
        {
            name: "Starter",
            description: "Platforma ilk adım",
            price: 0,
            period: "/ ay",
            highlight: "Ayda 25 sohbete kadar",
            features: [
                { text: "1 Bağlı Kanal", included: true },
                { text: "1 Kullanıcı", included: true },
                { text: "50 Ürüne Kadar", included: true },
                { text: "Tüm Entegrasyonlar", included: true },
                { text: "Ekip İşbirliği", included: false },
            ],
            btnText: "Ücretsiz Başla",
            btnLink: "/auth/sign-up"
        },
        {
            name: "Standard",
            description: "Aktif satış ekipleri için",
            price: 159,
            period: "/ ay",
            highlight: "Ayda 650 sohbete kadar",
            features: [
                { text: "3 Bağlı Kanal", included: true },
                { text: "3 Kullanıcı", included: true },
                { text: "1.000 Ürüne Kadar", included: true },
                { text: "WhatsApp Kampanyaları", included: true },
                { text: "Temel Destek", included: true },
            ],
            isPopular: true,
            btnText: "Paketi Seç",
            btnLink: "/auth/sign-up"
        },
        {
            name: "Pro",
            description: "Çok kanallı operasyonlar için",
            price: 499,
            period: "/ ay",
            highlight: "Ayda 2.500 sohbete kadar",
            features: [
                { text: "10 Bağlı Kanal", included: true },
                { text: "10 Kullanıcı", included: true },
                { text: "Sınırsız Ürün", included: true },
                { text: "Birebir Kullanım Eğitimi", included: true },
                { text: "Özel Müşteri Temsilcisi", included: true },
            ],
            btnText: "Paketi Seç",
            btnLink: "/auth/sign-up"
        },
        {
            name: "Enterprise",
            description: "Özel ihtiyaçlara özel çözüm",
            price: null,
            priceLabel: "Özel Fiyat",
            period: "",
            highlight: "Sınırsız kullanım",
            features: [
                { text: "Kurumsal Güvenlik", included: true },
                { text: "Özel API Entegrasyonları", included: true },
                { text: "Özel SLA", included: true },
                { text: "Tüm Pro Özellikleri", included: true },
                { text: "Dedicated Altyapı", included: true },
            ],
            btnText: "İletişime Geç",
            btnLink: "/auth/sign-up"
        }
    ];
}