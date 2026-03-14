import { Component } from '@angular/core';
type EmailTemplate = {
    title: string;
    image: string;
};

@Component({
  selector: 'app-email-templates',
    imports: [
        
    ],
  templateUrl: './email-templates.html',
  styles: ``
})
export class EmailTemplates {
    emailTemplates: EmailTemplate[] = [
        { title: 'Basic Action', image: 'assets/images/emails/confirm.png' },
        { title: 'Activated Account', image: 'assets/images/emails/activated.png' },
        { title: 'Marketing', image: 'assets/images/emails/marketing.png' },
        { title: 'Invoice', image: 'assets/images/emails/invoice.png' },
        { title: 'Reports', image: 'assets/images/emails/reports.png' },
        { title: 'Reset Password', image: 'assets/images/emails/reset-password.png' },
        { title: 'Warning', image: 'assets/images/emails/warning-mail.png' }
    ];
}
