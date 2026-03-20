import {Component} from '@angular/core';
import {NgIcon} from '@ng-icons/core';

type ServiceType = {
    name: string,
    description: string,
    icon: string
}

@Component({
    selector: 'app-services',
    imports: [NgIcon],
    templateUrl: './services.html',
    styles: ``
})
export class Services {


    services: ServiceType[] = [
        {
            name: "AI Chatbot",
            description: "Akıllı yapay zeka destekli chatbot ile müşterilerinize 7/24 anında yanıt verin. Doğal dil işleme ile insan benzeri konuşma deneyimi sunun.",
            icon: "tablerMessageChatbot",
        },
        {
            name: "Çok Kanallı Mesajlaşma",
            description: "WhatsApp, SMS, e-posta ve web chat kanallarını tek bir panelden yönetin. Tüm müşteri iletişiminizi merkezi bir noktada toplayın.",
            icon: "tablerMessages",
        },
        {
            name: "Otomasyon & İş Akışları",
            description: "Tekrarlayan görevleri otomatikleştirin, akıllı iş akışları oluşturun ve ekibinizin verimliliğini artırın.",
            icon: "tablerSettingsAutomation",
        },
        {
            name: "Gerçek Zamanlı Analitik",
            description: "Mesaj performansını, müşteri memnuniyetini ve ekip verimliliğini gerçek zamanlı panolarla takip edin.",
            icon: "tablerChartBar",
        },
        {
            name: "Ekip İşbirliği",
            description: "Ekip üyeleriniz arasında sorunsuz iş birliği sağlayın. Mesajları atayın, notlar ekleyin ve birlikte çalışın.",
            icon: "tablerUsersGroup",
        },
        {
            name: "Güvenlik & Uyumluluk",
            description: "Uçtan uca şifreleme, KVKK uyumluluğu ve kurumsal düzeyde güvenlik altyapısıyla verilerinizi koruyun.",
            icon: "tablerShieldCheck",
        },
    ];
}
