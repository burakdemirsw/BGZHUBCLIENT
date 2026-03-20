import {Component} from '@angular/core';
import {CountUpModule} from 'ngx-countup';

@Component({
    selector: 'app-features',
    imports: [CountUpModule],
    templateUrl: './features.html',
    styles: ``
})
export class Features {
    stats1 = [
        { value: 5, suffix: '+', label: 'Desteklenen kanal' },
        { value: 100, suffix: '%', label: 'Konuşma geçmişi aktarımı' },
        { value: 2, suffix: 'sn', label: 'Ortalama mesaj gecikmesi' }
    ];
    stats2 = [
        { value: 85, suffix: '%', label: 'Otomatik çözüm oranı' },
        { value: 3, suffix: 'x', label: 'Daha kısa yanıt süresi' },
        { value: 40, suffix: '%', label: 'Ekip yükünde azalma' }
    ];
    stats3 = [
        { value: 50, suffix: '+', label: 'Hazır otomasyon şablonu' },
        { value: 24, suffix: '/7', label: 'Kesintisiz çalışma' },
        { value: 10, suffix: 'dk', label: 'Kurulum süresi' }
    ];
}
