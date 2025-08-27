# sitio-spa
## Instrucciones para esta versión
Se construye con Angular y Node.js

Versiones:
Angular 16
Node 18

## Pasos
1. Crear el proyecto base
bash
npm install -g @angular/cli
ng new user-app --routing --style=scss
cd user-app
ng add @angular/material

2. Crear el sistema de login
📁 Estructura
plaintext
src/app/auth/
├── login/              # Componente de login
├── auth.service.ts     # Servicio de autenticación
├── auth.guard.ts       # Guard para proteger rutas

Comandos
bash
ng generate module auth
ng generate component auth/login
ng generate service auth/auth
ng generate guard auth/auth

3. Crear la estructura visual (layout)
📁 Estructura
plaintext
src/app/layout/
├── header/
├── sidebar/
├── footer/
├── main-layout/        # Contenedor principal

Comandos
bash
ng generate component layout/header
ng generate component layout/sidebar
ng generate component layout/footer
ng generate component layout/main-layout

4. Crear el CRUD de usuarios
📁 Estructura
plaintext
src/app/users/
├── user-list/          # Lista de usuarios
├── user-form/          # Formulario de usuario
├── user.service.ts     # Servicio de datos
├── users.module.ts     # Módulo de usuarios

Comandos
bash
ng generate module users
ng generate component users/user-list
ng generate component users/user-form
ng generate service users/user

5. Configurar rutas

6. Módulo principal (app.module.ts)
   
