import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { Permission, PermissionScope } from '../core/auth/permissions';
import { permissionGuard } from '../core/guards/permission.guard';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'waiter-mesas',
        loadComponent: () =>
          import('../features/waiter/mesas/mesas.page').then((m) => m.MesasPage),
        canActivate: [permissionGuard],
        data: {
          permissions: [{ permission: Permission.TablesRead, scope: PermissionScope.Assigned }],
        },
      },
      {
        path: 'waiter-pedidos',
        loadComponent: () =>
          import('../features/waiter/pedidos/pedidos.page').then((m) => m.PedidosPage),
        canActivate: [permissionGuard],
        data: {
          permissions: [{ permission: Permission.OrdersRead, scope: PermissionScope.Assigned }],
        },
      },
      {
        path: 'waiter-alertas',
        loadComponent: () =>
          import('../features/waiter/alertas/alertas.page').then((m) => m.AlertasPage),
        canActivate: [permissionGuard],
        data: {
          permissions: [{ permission: Permission.NotificationsRead, scope: PermissionScope.Restaurant }],
        },
      },
      {
        path: 'waiter-perfil',
        loadComponent: () =>
          import('../features/waiter/perfil/perfil.page').then((m) => m.PerfilPage),
        canActivate: [permissionGuard],
        data: {
          permissions: [{ permission: Permission.TablesRead, scope: PermissionScope.Assigned }],
        },
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard.page').then((m) => m.DashboardPage),
        canActivate: [permissionGuard],
        data: {
          permissions: [{ permission: Permission.DashboardRead, scope: PermissionScope.Restaurant }],
        },
      },
      {
        path: 'productos',
        loadComponent: () =>
          import('./productos/productos.page').then((m) => m.ProductosPage),
        canActivate: [permissionGuard],
        data: {
          permissions: [{ permission: Permission.MenuManage, scope: PermissionScope.Restaurant }],
        },
      },
      {
        path: 'sesiones',
        loadComponent: () =>
          import('./sesiones/sesiones.page').then((m) => m.SesionesPage),
        canActivate: [permissionGuard],
        data: {
          permissions: [{ permission: Permission.SessionsRead, scope: PermissionScope.Restaurant }],
        },
      },
      {
        path: 'pedidos',
        loadComponent: () =>
          import('./pedidos/pedidos.page').then((m) => m.PedidosPage),
        canActivate: [permissionGuard],
        data: {
          permissions: [{ permission: Permission.DashboardRead, scope: PermissionScope.Restaurant }],
        },
      },
      {
        path: 'mesas',
        loadComponent: () =>
          import('./mesas/mesas.page').then((m) => m.MesasPage),
        canActivate: [permissionGuard],
        data: {
          permissions: [{ permission: Permission.TablesManage, scope: PermissionScope.Restaurant }],
        },
      },
      {
        path: 'qrs',
        loadComponent: () => import('./qrs/qrs.page').then((m) => m.QrsPage),
        canActivate: [permissionGuard],
        data: {
          permissions: [{ permission: Permission.QrsManage, scope: PermissionScope.Restaurant }],
        },
      },
      {
        path: 'meseros',
        loadComponent: () =>
          import('./meseros/meseros.page').then((m) => m.MeserosPage),
        canActivate: [permissionGuard],
        data: {
          permissions: [{ permission: Permission.StaffManage, scope: PermissionScope.Restaurant }],
        },
      },
      {
        path: 'kitchen-orders',
        loadComponent: () =>
          import('../features/kitchen/kitchen-orders.page').then((m) => m.KitchenOrdersPage),
        canActivate: [permissionGuard],
        data: {
          permissions: [
            { permission: Permission.KitchenQueueRead, scope: PermissionScope.Restaurant },
          ],
        },
      },
      {
        path: 'kitchen-notifications',
        loadComponent: () =>
          import('../features/kitchen/kitchen-notifications.page').then(
            (m) => m.KitchenNotificationsPage,
          ),
        canActivate: [permissionGuard],
        data: {
          permissions: [
            { permission: Permission.NotificationsRead, scope: PermissionScope.Restaurant },
          ],
        },
      },
      {
        path: 'kitchen-profile',
        loadComponent: () =>
          import('../features/waiter/perfil/perfil.page').then((m) => m.PerfilPage),
        canActivate: [permissionGuard],
        data: {
          permissions: [{ permission: Permission.ProfileRead, scope: PermissionScope.Restaurant }],
        },
      },
      {
        path: '',
        redirectTo: '/tabs/dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/dashboard',
    pathMatch: 'full',
  },
];
