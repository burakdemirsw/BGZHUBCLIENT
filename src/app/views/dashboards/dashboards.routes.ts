import {Routes} from '@angular/router';
import {Dashboard1} from '@/app/views/dashboards/dashboard-1/dashboard-1';
import {Dashboard2} from '@/app/views/dashboards/dashboard-2/dashboard-2';
import {AuthGuard} from '@/app/core/guards/auth.guard';

export const DASHBOARDS_ROUTES: Routes = [
    {
        path: 'dashboard',
        component: Dashboard1,
        data: {title: "Dashboard"},
        canActivate: [AuthGuard],
    },
    {
        path: 'dashboard2',
        component: Dashboard2,
        data: {title: "Dashboard 2"},
        canActivate: [AuthGuard],
    },
];
