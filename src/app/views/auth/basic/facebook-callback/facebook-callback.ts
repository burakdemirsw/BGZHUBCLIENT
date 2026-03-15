import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FacebookLoginService } from '@/app/core/services/facebook-login.service';

@Component({
    selector: 'app-facebook-callback',
    imports: [CommonModule, RouterModule],
    templateUrl: './facebook-callback.html',
})
export class FacebookCallbackPage implements OnInit {
    processing = true;
    success = false;
    errorMessage = '';

    constructor(
        private route: ActivatedRoute,
        private facebookLoginService: FacebookLoginService,
    ) {}

    ngOnInit(): void {
        this.handleCallback();
    }

    private async handleCallback(): Promise<void> {
        try {
            const fragment = this.parseFragment(window.location.hash);
            const queryParams = this.route.snapshot.queryParams;

            console.log('=== Facebook/WhatsApp Callback ===');
            console.log('URL:', window.location.href);
            console.log('Fragment params:', fragment);
            console.log('Query params:', queryParams);

            const code = fragment['code'] || queryParams['code'];

            console.log('Parsed code:', code);

            if (!code) {
                this.processing = false;
                this.errorMessage = 'Facebook\'dan code bilgisi alınamadı.';
                console.error('No code found in callback URL');
                return;
            }

            console.log('Sending code to backend...');
            // platform query param ile hangi servise gideceğini belirle
            const platform = queryParams['platform'] || 'facebook';
            let result;
            if (platform === 'whatsapp') {
                result = await this.facebookLoginService.sendWhatsappCode(code);
            } else {
                result = await this.facebookLoginService.sendFacebookCode(code);
            }
            console.log('Backend response:', result);

            this.processing = false;
            this.success = true;

            // Popup olarak açıldıysa parent'a mesaj gönder ve kapat
            if (window.opener) {
                window.opener.postMessage(
                    { type: 'facebook-callback', success: true, code },
                    window.location.origin
                );
                setTimeout(() => window.close(), 2000);
            }
        } catch (error) {
            console.error('Facebook callback error:', error);
            this.processing = false;
            this.errorMessage = 'Facebook bağlantısı sırasında bir hata oluştu.';
        }
    }

    private parseFragment(hash: string): Record<string, string> {
        if (!hash || hash.length < 2) return {};
        const params: Record<string, string> = {};
        const pairs = hash.substring(1).split('&');
        for (const pair of pairs) {
            const [key, value] = pair.split('=');
            if (key) {
                params[decodeURIComponent(key)] = decodeURIComponent(value || '');
            }
        }
        return params;
    }
}
