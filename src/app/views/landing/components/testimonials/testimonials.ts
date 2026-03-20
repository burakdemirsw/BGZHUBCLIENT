import {Component} from '@angular/core';
import {TestimonialCard} from "../testimonial-card/testimonial-card";

@Component({
    selector: 'app-testimonials',
    imports: [ TestimonialCard],
    templateUrl: './testimonials.html',
    styles: ``
})
export class Testimonials {
    testimonials = [
        {
            avatar: 'assets/images/users/user-1.jpg',
            name: 'Ahmet Yılmaz',
            title: 'Müşteri iletişimimiz tamamen değişti!',
            description: 'SellenticAI sayesinde müşteri yanıt süremiz %80 düştü. AI chatbot gerçekten insan gibi konuşuyor!',
            rating: 5
        },
        {
            avatar: 'assets/images/users/user-2.jpg',
            name: 'Elif Kara',
            title: 'Harika otomasyon araçları',
            description: 'Tüm kanalları tek panelden yönetmek inanılmaz kolaylık sağlıyor. Ekibimizin verimliliği 3 katına çıktı.',
            rating: 4.5
        },
        {
            avatar: 'assets/images/users/user-3.jpg',
            name: 'Mehmet Demir',
            title: 'Kurumsal düzeyde güvenlik',
            description: 'KVKK uyumluluğu ve uçtan uca şifreleme ile verilerimiz güvende. Teknik destek ekibi çok hızlı yanıt veriyor.',
            rating: 4
        },
    ];

    clients = [

        'assets/images/clients/01.svg',
        'assets/images/clients/02.svg',
        'assets/images/clients/03.svg',
        'assets/images/clients/04.svg',
        'assets/images/clients/05.svg',
        'assets/images/clients/06.svg',
        'assets/images/clients/07.svg'
    ];
}
