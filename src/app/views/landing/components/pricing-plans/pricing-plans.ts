import {Component} from '@angular/core';
import {PricingPlanCard} from "../pricing-plan-card/pricing-plan-card";

@Component({
    selector: 'app-pricing-plans',
    imports: [PricingPlanCard],
    templateUrl: './pricing-plans.html',
    styles: ``
})
export class PricingPlans {
    plans = [
        {
            name: "Başlangıç",
            description: "Küçük işletmeler ve bireysel kullanım",
            price: 299,
            highlight: "Aylık 1.000 mesaj",
            features: [
                { text: "1 kanal (Web Chat)", included: true },
                { text: "AI Chatbot (temel)", included: true },
                { text: "E-posta destek", included: true },
                { text: "Ekip işbirliği", included: false },
                { text: "Özel entegrasyonlar", included: false }
            ],
            btnClass: "btn-outline-primary"
        },
        {
            name: "Profesyonel",
            description: "Büyüyen ekipler ve KOBİ'ler için",
            price: 799,
            highlight: "Aylık 10.000 mesaj",
            features: [
                { text: "3 kanal (Web, WhatsApp, SMS)", included: true },
                { text: "AI Chatbot (gelişmiş)", included: true },
                { text: "Ekip işbirliği (5 kullanıcı)", included: true },
                { text: "Öncelikli destek", included: true },
                { text: "Özel entegrasyonlar", included: false }
            ],
            btnClass: "btn-light",
            isPopular: true
        },
        {
            name: "Kurumsal",
            description: "Büyük ölçekli işletmeler için",
            price: 1999,
            highlight: "Sınırsız mesaj",
            features: [
                { text: "Tüm kanallar (sınırsız)", included: true },
                { text: "AI Chatbot (özel eğitimli)", included: true },
                { text: "Sınırsız ekip üyesi", included: true },
                { text: "7/24 öncelikli destek", included: true },
                { text: "Özel API & entegrasyonlar", included: true }
            ],
            btnClass: "btn-dark"
        }
    ];
}
