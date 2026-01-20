# Guía de Deployment en Railway

## 1. Preparación

### Crear cuenta en Railway

1. Ve a [railway.app](https://railway.app)
2. Regístrate con GitHub (recomendado)
3. Verifica tu email

## 2. Instalación de Railway CLI

```bash
# macOS/Linux
npm install -g @railway/cli

# Verificar instalación
railway --version
```

## 3. Login

```bash
railway login
```

Se abrirá el navegador para autorizar.

## 4. Crear Proyecto

### Opción A: Desde GitHub (Recomendado)

1. Sube tu código a GitHub
2. En Railway Dashboard:
   - Click "New Project"
   - Selecciona "Deploy from GitHub repo"
   - Autoriza Railway en GitHub
   - Selecciona tu repositorio `pwa_esp32`
   - Railway detectará automáticamente Node.js

### Opción B: Desde CLI

```bash
cd server
railway init
railway up
```

## 5. Configurar Variables de Entorno

En el Railway Dashboard:

1. Click en tu proyecto
2. Ve a "Variables"
3. Agrega estas variables:

```env
NODE_ENV=production
JWT_SECRET=genera_un_secret_fuerte_aqui
DEVICE_SECRET=genera_otro_secret_para_esp32
ALLOWED_ORIGINS=https://tu-proyecto.up.railway.app
```

### Generar secrets fuertes:

```bash
# En terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 6. Obtener Dominio Público

Railway asigna un dominio automáticamente, pero puedes personalizarlo:

```bash
# Ver dominio actual
railway domain

# O en Dashboard: Settings → Generate Domain
```

Tu URL será algo como: `https://pwa-esp32-production-xxxx.up.railway.app`

## 7. Verificar Deployment

```bash
# Ver logs en tiempo real
railway logs

# O en Dashboard: Deployments → View Logs
```

## 8. Configurar ESP32

Edita `esp32/src/config.h`:

```cpp
#define WS_HOST "tu-proyecto.up.railway.app"  // SIN https://
#define WS_PORT 443
#define DEVICE_SECRET "mismo-secret-del-servidor"
```

## 9. Probar la Aplicación

1. Abre tu PWA: `https://tu-proyecto.up.railway.app`
2. Login (usuario: demo, password: demo)
3. Conecta tu ESP32
4. Verifica conexión WebSocket

## 10. Auto-Deploy desde GitHub

Railway hace deploy automático cuando pusheas a main:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Railway detectará el cambio y hará deploy automáticamente.

## Comandos Útiles

```bash
# Ver status del proyecto
railway status

# Abrir dashboard en navegador
railway open

# Ver logs
railway logs --tail

# Conectar a shell del container
railway shell

# Eliminar proyecto
railway delete
```

## Troubleshooting

### Build falla

- Verifica que `package.json` tenga `"engines": { "node": ">=18.0.0" }`
- Asegúrate que todas las dependencias estén en `dependencies`, no en `devDependencies`

### WebSocket no conecta

- Verifica que el dominio en `ALLOWED_ORIGINS` sea correcto
- Usa `wss://` (con SSL) en producción
- Revisa logs del servidor

### Servicio se duerme (plan gratuito)

Railway duerme servicios inactivos después de cierto tiempo. Para mantenerlo activo:

- Upgradea a plan de pago ($5/mes)
- O usa un servicio de ping externo (cron-job.org)

## Costos

- **Plan Gratuito**: $5 de crédito/mes
- Suficiente para este proyecto en desarrollo
- Para producción, considera plan de pago

## Seguridad en Producción

1. **HTTPS**: Railway lo provee automáticamente ✅
2. **Secrets**: Usa variables de entorno, nunca hardcodees
3. **Rate Limiting**: Ya implementado en el código
4. **CORS**: Configura `ALLOWED_ORIGINS` correctamente
5. **JWT**: Usa secrets fuertes (32+ caracteres aleatorios)

## Monitoreo

Railway Dashboard muestra:

- CPU usage
- Memory usage
- Network traffic
- Deployment history
- Logs en tiempo real

## Escalado

Si necesitas más recursos:

1. Dashboard → Settings
2. Ajusta CPU/Memory
3. Considera múltiples replicas para alta disponibilidad

## Backup

Railway no hace backup automático. Recomendaciones:

- Usa GitHub como source of truth
- Guarda variables de entorno en un lugar seguro
- Considera una base de datos externa para datos críticos
