import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UsersService } from '@core/services/users.service';
import { AuthStateService } from '@core/services/auth-state.service';

@Component({
    selector: 'app-confirm-mail',
    imports: [RouterLink],
    templateUrl: './confirm-mail.html',
    styleUrl: './confirm-mail.scss'
})
export class ConfirmMailPage implements OnInit {
    status: 'loading' | 'success' | 'error' = 'loading';
    errorMessage = 'E-posta onaylama bağlantısı geçersiz veya süresi dolmuş. Lütfen tekrar deneyin.';
    currentYear = new Date().getFullYear();

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private usersService: UsersService,
        private authStateService: AuthStateService
    ) {}

    ngOnInit(): void {
        const userId = this.route.snapshot.queryParamMap.get('userId');
        const token = this.route.snapshot.queryParamMap.get('token');

        if (!userId || !token) {
            this.status = 'error';
            this.errorMessage = 'Geçersiz bağlantı. userId ve token parametreleri gereklidir.';
            return;
        }

        const currentUserId = this.authStateService.profile?.userId;
        if (currentUserId && currentUserId !== userId) {
            this.status = 'error';
            this.errorMessage = 'Bu onay bağlantısı sizin hesabınıza ait değil. Lütfen doğru hesapla giriş yapın.';
            return;
        }

        this.confirmEmail(userId, token);
    }

    private async confirmEmail(userId: string, token: string): Promise<void> {
        try {
            await this.usersService.confirmMail(userId, token);
            this.status = 'success';

            // 3 saniye sonra profile yönlendir
            setTimeout(() => {
                this.router.navigate(['/users/profile']);
            }, 3000);
        } catch (error: unknown) {
            this.status = 'error';
            if (error instanceof Error) {
                this.errorMessage = error.message || this.errorMessage;
            }
        }
    }
}
