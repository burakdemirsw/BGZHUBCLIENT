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
            name: "Akıllı Sohbet Asistanı",
            description: "Müşterilerinizin sorularını anlayan, bağlama uygun yanıtlar üreten ve gerektiğinde canlı temsilciye aktaran yapay zeka asistanı.",
            icon: "tablerMessageChatbot",
        },
        {
            name: "Birleşik Mesaj Kutusu",
            description: "WhatsApp, Instagram DM, web chat ve e-posta — tüm kanallardan gelen mesajlar tek bir gelen kutusunda. Kanal değiştirmeye son.",
            icon: "tablerMessages",
        },
        {
            name: "Akış Tasarımcısı",
            description: "Sürükle-bırak mantığıyla otomatik yanıt akışları oluşturun. Sık sorulan sorular, sipariş takibi ve randevu hatırlatmalarını otomatikleştirin.",
            icon: "tablerSettingsAutomation",
        },
        {
            name: "Canlı Gösterge Paneli",
            description: "Yanıt süreleri, çözüm oranları ve temsilci performansını anlık takip edin. Karar almak için gereken veriye anında ulaşın.",
            icon: "tablerChartBar",
        },
        {
            name: "Takım Çalışma Alanı",
            description: "Mesajları ekip arkadaşlarınıza atayın, dahili notlar ekleyin ve konuşma geçmişini paylaşın. Hiçbir müşteri talebi kaybolmasın.",
            icon: "tablerUsersGroup",
        },
        {
            name: "Veri Koruma",
            description: "Uçtan uca şifreleme, rol bazlı erişim kontrolü ve KVKK uyumlu altyapı. Müşteri verileriniz her zaman güvende.",
            icon: "tablerShieldCheck",
        },
    ];
}
