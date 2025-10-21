import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { LoginComponent } from './auth/login/login.component';
import { NgModule } from '@angular/core';

const routes: Routes = [
  { path: 'login', component: LoginComponent },

  {
    path: '',
    component: MainLayoutComponent,  // Layout del dashboard
    canActivate: [AuthGuard],
    children: [
      {
        path: 'usuarios',
        loadChildren: () =>
          import('./users/users.module').then(m => m.UsersModule)
      },
      {
        path: '',
        loadChildren: () =>
          import('../modules/bienvenida/bienvenida.module').then(m => m.BienvenidaModule)
      },
      {
        path: 'clientes',
        loadChildren: () =>
          import('../modules/clientes/clientes.module').then(m => m.ClientesModule)
      },
      {
        path: 'empleados',
        loadChildren: () =>
          import('../modules/empleados/empleados.module').then(m => m.EmpleadosModule)
      },
      {
        path: 'recibos',
        loadChildren: () =>
          import('../modules/recibos/recibos.module').then(m => m.RecibosModule)
      },
      {
        path: 'inventario',
        loadChildren: () =>
          import('../modules/inventario/inventario.module').then(m => m.InventarioModule)
      }
    ]
  },

  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
