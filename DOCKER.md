# WayrApp Mobile Docker Setup

Esta guía te ayudará a usar Docker para el desarrollo móvil de WayrApp, especialmente útil para resolver problemas de tests y configuración de React Native.

## 🎯 Problemas que Docker resuelve

- **Versiones de Node inconsistentes**: Garantiza Node 20 en todos los entornos
- **Configuración compleja de React Native**: Entorno preconfigurado con todas las dependencias
- **Tests móviles que fallan**: Configuración de Jest que funciona out-of-the-box
- **Dependencias nativas**: Todas las librerías necesarias preinstaladas

## 🚀 Setup inicial

### Prerrequisitos
- Docker Desktop instalado y corriendo

### Configuración

```powershell
# Setup inicial (una sola vez)
npm run docker:setup
```

## 📱 Comandos disponibles

### Ejecutar tests móviles (tu problema principal)
```bash
npm run docker:test
```

### Desarrollo móvil
```bash
npm run docker:dev
```

### Acceder al contenedor
```bash
npm run docker:shell
```

### Reconstruir imagen
```bash
npm run docker:build
```

## 🔧 Configuración

El contenedor móvil se conecta a tu API existente:
- **API local**: `http://host.docker.internal:3000`
- **API desplegada**: Puedes cambiar la URL en `docker-compose.yml`

## 🎯 Flujo de trabajo recomendado

1. **Backend**: Sigue corriendo nativo (local o Vercel)
2. **CMS**: Sigue corriendo nativo
3. **Móvil**: Usa Docker solo para tests y desarrollo cuando tengas problemas

## 📁 Archivos Docker

```
wayrapp/
├── Dockerfile                  # Imagen móvil con Node 20 y React Native
├── docker-compose.yml          # Configuración del contenedor móvil
└── scripts/docker-setup.ps1    # Script de configuración inicial
```

¡Con esta configuración deberías poder ejecutar tests móviles sin problemas!