import {Component} from '@angular/core';
import {RouterLink} from '@angular/router';
import {CountUpModule} from 'ngx-countup';

@Component({
    selector: 'app-features',
    imports: [RouterLink, CountUpModule],
    templateUrl: './features.html',
    styles: ``
})
export class Features {
    stats1 = [
        { value: 99.50, suffix: '%', label: 'Müşteri memnuniyeti' },
        { value: 7.4, suffix: 'x', label: 'Yanıt hızı artışı' },
        { value: 1200, suffix: '+', label: 'Saniyede gönderilen mesaj' }
    ];
    stats2 = [
        { value: 99.90, suffix: '%', label: 'Mesaj iletim başarısı' },
        { value: 3.2, suffix: 'x', label: 'Daha hızlı çözüm süresi' },
        { value: 1500, suffix: '+', label: 'Dakikada işlenen talep' }
    ];
    stats3 = [
        { value: 97.50, suffix: '%', label: 'Platform güvenilirliği' },
        { value: 4.2, suffix: 'x', label: 'Daha verimli ekip çalışması' },
        { value: 250000, suffix: '+', label: 'Günlük yönetilen konuşma' }
    ];
}
