# Bot del Discord oficial del Club de Programación FIUNA

<div align="center">

![Discord.js](https://img.shields.io/badge/discord.js-v14-blue)
![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-active-success)

Bot oficial del Club de Programación FIUNA. Sistema modular de Discord con comandos slash, eventos automatizados y arquitectura escalable.

[Reportar Bug](https://github.com/cpfiuna/discord-bot/issues) · [Sugerir Funcionalidad](https://github.com/cpfiuna/discord-bot/issues)

</div>

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Instalación Rápida](#-instalación-rápida)
- [Comandos Disponibles](#-comandos-disponibles)
- [Documentación](#-documentación)
- [Despliegue](#-despliegue)
- [Contribuir](#-contribuir)
- [Tecnologías](#-tecnologías)
- [Licencia](#-licencia)

## ✨ Características

### Core Features
- ⚡ **Comandos Slash**: Sistema completo de slash commands con Discord.js v14
- 🎯 **Sistema de Eventos**: Manejo modular de eventos de Discord
- 📝 **Logging Avanzado**: Sistema de logs con soporte para archivos y canales
- 🔄 **Auto-reload**: Desarrollo con hot-reload usando nodemon
- 🚀 **Deploy Automatizado**: Script para registrar comandos local o globalmente
- ⏰ **Sistema de Recordatorios**: Recordatorios personales y globales con soporte para fechas

### Gestión
- 👋 **Bienvenidas Automáticas**: Mensaje de bienvenida personalizable para nuevos miembros
- 🎙️ **Salas de Voz Temporales**: Creación y gestión automática de canales de voz
- 📊 **Encuestas Interactivas**: Sistema de encuestas con reacciones
- 💻 **Compartir Código**: Formateo automático de código con sintaxis
- 📈 **Monitoreo**: Identificación de instancia y logging de eventos
- ⚙️ **Configurable**: Variables de entorno para personalización completa
- 🛡️ **Manejo de Errores**: Sistema robusto de error handling

### Producción
- ☁️ **Azure Deployment**: Desplegado en Azure VM
- 📈 **PM2 Integration**: Configuración lista para PM2 process manager
- 🔐 **Seguro**: Best practices de seguridad implementadas
- 📊 **Monitoreo**: Sistema de logging y monitoreo activo

## 🚀 Instalación Rápida

### Prerrequisitos

- Node.js 18+ ([Descargar](https://nodejs.org/))
- Git ([Descargar](https://git-scm.com/))
- Cuenta de Discord con permisos de administrador

### Setup Básico

```powershell
# 1. Clonar el repositorio
git clone https://github.com/davidgimenezs/discord-bot.git
cd discord-bot

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
copy .env.example .env
# Editar .env con tus credenciales

# 4. Registrar comandos
npm run deploy

# 5. Iniciar en modo desarrollo
npm run dev
```

### Configuración Mínima (.env)

```env
# Obligatorio
DISCORD_TOKEN=tu_token_aqui
DISCORD_CLIENT_ID=tu_client_id

# Desarrollo (opcional)
DISCORD_GUILD_ID=tu_guild_id_para_dev

# Opcional
LOG_CHANNEL_ID=id_del_canal_de_logs
GREETING_CHANNEL_ID=id_del_canal_de_bienvenidas
BOT_PRESENCE="Usa /help para ver los comandos"
```

## 📝 Comandos Disponibles

### 📚 Información
| Comando | Descripción | Ejemplo |
|---------|-------------|---------|
| `/info` | Información del Club de Programación FIUNA | `/info` |
| `/links` | Enlaces y redes sociales del club | `/links` |
| `/help` | Ayuda detallada sobre comandos | `/help` o `/help comando:encuesta` |

### 💻 Código
| Comando | Descripción | Ejemplo |
|---------|-------------|---------|
| `/code` | Comparte código formateado (límite 4000 caracteres) | `/code lenguaje:Python` |

### 🛠️ Utilidades
| Comando | Descripción | Ejemplo |
|---------|-------------|---------|
| `/encuesta` | Crea encuestas con 2-4 opciones | `/encuesta pregunta:"¿Lenguaje favorito?" opcion1:Python opcion2:JavaScript` |
| `/recordar` | Crea recordatorios personales o globales | `/recordar crear mensaje:"Reunión" minutos:30` |

### 🎙️ Salas de Voz
| Comando | Descripción | Ejemplo |
|---------|-------------|---------|------|
| `/sala crear` | Crea una sala de voz temporal (se elimina tras 1 minuto vacía) | `/sala crear nombre:"Estudio" descripcion:"Python" limite:5` |
| `/sala listar` | Lista todas las salas disponibles | `/sala listar` |
| `/sala unirse` | Información sobre una sala específica | `/sala unirse nombre:"Estudio"` |

### 🔧 Sistema
| Comando | Descripción | Ejemplo |
|---------|-------------|---------|
| `/ping` | Verifica que el bot esté activo | `/ping` |

### 🔒 Comandos Privados (No públicos)
| Comando | Descripción | Permisos |
|---------|-------------|----------|
| `/logtest` | Prueba el sistema de logs | Admin |
| `/testgreeting` | Prueba el mensaje de bienvenida | Admin |
| `/emojis` | Gestión de emojis | Admin |

> **Nota sobre recordatorios globales:** Solo usuarios con rol de Admin, Comision Directiva o Lead pueden crear recordatorios globales usando el parámetro `global:True`.

## 📚 Documentación

La documentación completa está disponible en la carpeta [`discord-bot-docs/`](./discord-bot-docs/):


### Guías Principales

| Guía | Descripción | Para Quién |
|------|-------------|-----------|
| [**Index**](./discord-bot-docs/index.md) | Visión general del proyecto | Todos |
| [**Getting Started**](./discord-bot-docs/getting-started.md) | Configuración paso a paso | Desarrolladores nuevos |
| [**Deployment**](./discord-bot-docs/deployment.md) | Despliegue en producción | DevOps / Admins |
| [**Contributing**](./discord-bot-docs/contributing.md) | Cómo contribuir al proyecto | Contribuidores |

### Quick Links

- 🎯 **Primera vez?** → [Getting Started](./discord-bot-docs/getting-started.md)
- 🚀 **Desplegar bot?** → [Deployment Guide](./discord-bot-docs/deployment.md)
- 💻 **Contribuir?** → [Contributing Guide](./discord-bot-docs/contributing.md)
- 📖 **Visión general?** → [Index](./discord-bot-docs/index.md)

## ☁️ Despliegue en Azure

El bot está configurado para desplegarse en Azure VM con PM2.

### Deployment Rápido

```bash
# Conectar a Azure VM
ssh user@VM_IP

# Navegar al directorio del bot
cd /opt/discord-bot

# Actualizar código
git pull origin main
npm ci --production

# Registrar comandos globalmente
npm run deploy-global

# Reiniciar con PM2
pm2 restart discord-bot
```

### Gestión del Bot

```bash
# Ver estado
pm2 status

# Ver logs
pm2 logs discord-bot

# Reiniciar bot
pm2 restart discord-bot

# Monitoreo en tiempo real
pm2 monit
```

Ver [Deployment Guide](./discord-bot-docs/deployment.md) para instrucciones detalladas de Azure.

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Ya sea código, documentación, reportes de bugs o sugerencias.

### Quick Start para Contribuir

```bash
# 1. Fork y clonar
git clone https://github.com/TU_USUARIO/discord-bot.git

# 2. Crear rama
git checkout -b feature/mi-nuevo-comando

# 3. Hacer cambios y commit
git commit -m "feat: agregar comando de estadísticas"

# 4. Push y crear PR
git push origin feature/mi-nuevo-comando
```

Lee la [Contributing Guide](./discord-bot-docs/contributing.md) completa para más detalles.

## 🛠️ Tecnologías

- **[Node.js](https://nodejs.org/)** v18+ - Runtime de JavaScript
- **[Discord.js](https://discord.js.org/)** v14 - Librería para Discord API
- **[PM2](https://pm2.keymetrics.io/)** - Process manager para producción

## 📜 Scripts Disponibles

```bash
npm run dev          # Iniciar con nodemon (auto-reload)
npm start            # Iniciar en producción
npm run deploy       # Registrar comandos localmente
npm run deploy-global # Registrar comandos globalmente
```

## 📞 Soporte

- 💬 **Discord**: Únete al servidor del Club de Programación FIUNA
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/cpfiuna/discord-bot/issues)
- 💡 **Feature Requests**: [GitHub Issues](https://github.com/cpfiuna/discord-bot/issues)

## 📄 Licencia

MIT License - ver [LICENSE](./LICENSE) para detalles.

---

<div align="center">

Hecho con ❤️ por el Club de Programación FIUNA

</div>

