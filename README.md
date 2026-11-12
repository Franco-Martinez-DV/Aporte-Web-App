# APORTE - Plataforma de Crowdfunding para el Deporte Amateur (Web + API)

**APORTE** es una plataforma web de financiación diseñada para conectar a deportistas amateurs, clubes de barrio y ligas regionales con donantes individuales y patrocinadores comerciales

El sistema permite gestionar campañas de recaudación, comercializar espacios publicitarios, declarar ingresos obtenidos por fuera de la plataforma y generar material de difusión con códigos QR dinámicos

---

## Arquitectura Técnica Resumida

El proyecto implementa una **arquitectura cliente-servidor desacoplada en 3 capas**, comunicada mediante una API RESTful en formato JSON:

1. **Capa de Presentación (Frontend - SPA):** Desarrollada en **Vue 3** (Composition API) y estilizada con **Tailwind CSS**, organizada de forma modular separando vistas, componentes reutilizables, helpers de formateo y servicios de consumo HTTP
2. **Capa de Lógica de Negocio (Backend - API REST):** Servidor construido con **Node.js** y **Express**, estructurado bajo el patrón *Routes -> Controllers -> Services* con validación de entradas y actualización atómica de saldos
3. **Capa de Persistencia (Base de Datos NoSQL):** Almacenamiento en tiempo real en **Cloud Firestore** (Firebase), administrado desde el servidor mediante **Firebase Admin SDK**

---

## Librerías Principales Utilizadas

### Backend (`backend/package.json`)
* **Express:** Framework web para la construcción de rutas y endpoints REST
* **Firebase Admin SDK (`firebase-admin`):** Conexión segura y operaciones CRUD contra Cloud Firestore
* **CORS (`cors`):** Habilitación de peticiones cruzadas entre el cliente web y la API
* **Dotenv (`dotenv`):** Carga de variables de entorno desde archivos `.env`

### Frontend (`frontend/package.json`)
* **Vue 3 (`vue`):** Framework progresivo para interfaces reactivas mediante `<script setup>`
* **Vite (`vite`):** Empaquetador y servidor de desarrollo rápido
* **Tailwind CSS (`tailwindcss`):** Framework de utilidades CSS para diseño responsivo e identidad visual
* **Axios (`axios`):** Cliente HTTP basado en promesas para consumir la API REST

---

## Variables de Entorno y Credenciales Necesarias

Por motivos de seguridad, las credenciales y archivos de entorno locales están excluidos del control de versiones mediante `.gitignore`

1. En la carpeta `backend/`, creá un archivo `.env` tomando como referencia `backend/.env.example`:
   ```env
   PORT=5000
   ```
2. 2. Descargá el archivo `serviceAccountKey.json` adjunto en el espacio de entrega del campus virtual (por seguridad no se incluye en el repositorio) y ubicalo en:
   ```text
   backend/config/serviceAccountKey.json
   ```

---

## Cómo Instalar Dependencias

Asegurarse de tener instalado **Node.js (v18 o superior)** y **npm**. Cloná el repositorio e instalá las dependencias de ambos módulos por separado:

```bash
# 1. Clonar el repositorio
git clone https://github.com/Franco-Martinez-DV/Aporte-Web-App.git
cd Aporte-Web-Backend

# 2. Instalar dependencias del Backend
cd backend
npm install

# 3. Instalar dependencias del Frontend
cd ../frontend
npm install
```

---

## Cómo Correr el Proyecto en Local

Se requieren dos terminales abiertas simultáneamente (una para la API y otra para la aplicación web):

### Terminal 1: Iniciar el Servidor Backend
```bash
cd backend
npm run dev
```
> El servidor quedará escuchando en `http://localhost:5000` (Endpoints base: `http://localhost:5000/api/v1/campanas`)

### Terminal 2: Iniciar el Cliente Web Frontend
```bash
cd frontend
npm run dev
```
> La aplicación web estará disponible en `http://localhost:5173`