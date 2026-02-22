# 🔥 Guía de Configuración de Firebase

Esta guía te ayudará a configurar Firebase para GestorTasks AI paso a paso.

## 📋 Requisitos Previos

- Una cuenta de Google
- Node.js instalado
- El proyecto clonado localmente

## 🚀 Paso 1: Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en **"Agregar proyecto"** o **"Add project"**
3. Ingresa un nombre para tu proyecto (ej: `gestortasks-ai`)
4. (Opcional) Desactiva Google Analytics si no lo necesitas
5. Haz clic en **"Crear proyecto"**

## 🔐 Paso 2: Configurar Authentication

1. En el menú lateral, ve a **"Authentication"** (Autenticación)
2. Haz clic en **"Get started"** o **"Comenzar"**
3. En la pestaña **"Sign-in method"**:
   - Haz clic en **"Email/Password"**
   - Activa el primer switch (**Email/Password**)
   - Guarda los cambios

## 💾 Paso 3: Configurar Firestore Database

1. En el menú lateral, ve a **"Firestore Database"**
2. Haz clic en **"Create database"** o **"Crear base de datos"**
3. Selecciona **"Start in test mode"** (modo de prueba)
   - Nota: Cambiaremos las reglas después
4. Selecciona una ubicación cercana a tus usuarios (ej: `us-central1`)
5. Haz clic en **"Enable"** o **"Habilitar"**

## 🔒 Paso 4: Configurar Reglas de Seguridad

1. En Firestore Database, ve a la pestaña **"Rules"** (Reglas)
2. Reemplaza el contenido con estas reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Función helper para verificar autenticación
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Función helper para verificar si es el dueño
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Users collection - Los usuarios pueden leer todos los perfiles
    // pero solo pueden modificar el suyo
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && isOwner(userId);
      allow update, delete: if isSignedIn() && isOwner(userId);
    }
    
    // Tasks collection - Todos los usuarios autenticados pueden leer/escribir
    match /tasks/{taskId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn();
    }
    
    // Sprints collection
    match /sprints/{sprintId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isSignedIn();
    }
    
    // Projects collection
    match /projects/{projectId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isSignedIn();
    }
    
    // Personal notes - Solo el dueño puede acceder
    match /personalNotes/{noteId} {
      allow read, write: if isSignedIn() && 
                            request.resource.data.userId == request.auth.uid;
      allow read: if isSignedIn() && 
                     resource.data.userId == request.auth.uid;
    }
  }
}
```

3. Haz clic en **"Publish"** o **"Publicar"**

## 🔑 Paso 5: Obtener Credenciales

1. Ve a **"Project Settings"** (⚙️ icono en el menú lateral)
2. En la sección **"Your apps"**, haz clic en el icono **Web** (`</>`)
3. Registra tu app con un nombre (ej: `GestorTasks Web`)
4. **NO** marques "Firebase Hosting" por ahora
5. Haz clic en **"Register app"**
6. Copia el objeto `firebaseConfig` que aparece

Debería verse así:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxxx"
};
```

## 📝 Paso 6: Configurar Variables de Entorno

1. En la raíz de tu proyecto, crea un archivo `.env`:

```bash
# Copia el archivo de ejemplo
cp .env.example .env
```

2. Edita el archivo `.env` y pega tus credenciales:

```env
# Firebase Configuration
FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
FIREBASE_PROJECT_ID=tu-proyecto
FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxxxxx

# Gemini API Key (opcional)
GEMINI_API_KEY=tu_gemini_api_key_aqui
```

## ✅ Paso 7: Verificar Instalación

1. Ejecuta el proyecto:

```bash
npm run dev
```

2. Abre el navegador en `http://localhost:3000`
3. Intenta registrar un nuevo usuario
4. Verifica en Firebase Console > Authentication que el usuario aparece
5. Verifica en Firestore Database que se creó el documento del usuario

## 🔄 Migración de Datos Existentes

Si ya tenías datos en localStorage:

1. Al iniciar sesión por primera vez, la app detectará los datos locales
2. Te preguntará si deseas migrarlos a Firebase
3. Haz clic en **"Aceptar"** para migrar automáticamente:
   - Tareas
   - Sprints
   - Proyectos
   - Notas personales

## 🐛 Solución de Problemas

### Error: "Firebase: Error (auth/configuration-not-found)"
- Verifica que todas las variables de entorno estén correctamente configuradas
- Asegúrate de que el archivo `.env` esté en la raíz del proyecto
- Reinicia el servidor de desarrollo

### Error: "Missing or insufficient permissions"
- Verifica que las reglas de Firestore estén publicadas correctamente
- Asegúrate de estar autenticado antes de acceder a los datos

### Los datos no se sincronizan
- Abre la consola del navegador (F12) y busca errores
- Verifica tu conexión a internet
- Revisa que Firebase esté correctamente inicializado

## 📚 Recursos Adicionales

- [Documentación de Firebase](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)

## 🎉 ¡Listo!

Tu aplicación ahora está conectada a Firebase y todos los datos se almacenan en la nube de forma segura.