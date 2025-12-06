# Política de Privacidad del Bot CPF

**Última actualización:** 1 de diciembre de 2025

## 1. Introducción

Esta Política de Privacidad describe cómo el bot de Discord del Club de Programación FIUNA ("CPF Bot", "nosotros", "nuestro") recopila, usa y protege la información de los usuarios de Discord.

El Club de Programación FIUNA respeta tu privacidad y se compromete a proteger tus datos personales. Esta política explica qué datos recopilamos y cómo los utilizamos.

## 2. Información que Recopilamos

### 2.1 Datos Proporcionados por Discord

Cuando interactuás con CPF Bot, recopilamos automáticamente la siguiente información proporcionada por Discord:

- **ID de Usuario de Discord** (identificador único numérico)
- **Nombre de usuario de Discord**
- **Avatar/foto de perfil** (solo para mostrar en mensajes de bienvenida)
- **ID del Servidor** (guild ID) donde se usa el bot
- **ID de Canales** donde se ejecutan comandos
- **Roles del usuario** (solo para verificar permisos de comandos administrativos)

### 2.2 Datos de Interacción con el Bot

Recopilamos información sobre cómo usás el bot:

- **Comandos ejecutados** (registrados en logs para debugging)
- **Contenido de comandos** (texto de encuestas, código compartido, mensajes de recordatorios)
- **Fecha y hora de interacciones**
- **Errores y excepciones** (para mejorar el bot)

### 2.3 Datos Temporales

Algunos datos se almacenan temporalmente en la memoria del bot:

- **Recordatorios activos:** mensaje, fecha/hora programada, ID de usuario, tipo (personal/global), canal destino, timeout ID (máximo 10 por usuario)
- **Salas de voz temporales:** nombre, descripción, creador, channel ID, timestamp de creación, timestamps de vacío, timeouts de eliminación
- **Encuestas:** pregunta, opciones, creador (persistente en Discord hasta eliminar mensaje)
- **Cooldowns:** timestamp de último uso por comando y usuario (temporal, 3 segundos default)

**Importante:** Estos datos temporales se pierden cuando el bot se reinicia o apaga.

## 3. Cómo Usamos tu Información

### 3.1 Funcionalidad del Bot

Usamos tus datos para:

- **Ejecutar comandos** que solicitás
- **Enviar mensajes de bienvenida** personalizados con tu nombre y avatar
- **Programar recordatorios** y enviártelos en el momento indicado (con fallback a canal si DM falla)
- **Gestionar salas de voz** temporales con auto-eliminación tras 1 minuto vacías
- **Crear encuestas** con 2-4 opciones y atribuirlas a su creador
- **Formatear código** que compartís en 11 lenguajes diferentes
- **Listar emojis** personalizados del servidor con sus IDs
- **Verificar permisos** para comandos administrativos y recordatorios globales
- **Aplicar cooldowns** para prevenir spam (3 segundos entre comandos)

### 3.2 Logging y Debugging

Almacenamos logs del bot que incluyen:

- Comandos ejecutados (para identificar errores)
- IDs de usuario (para debugging)
- Mensajes de error y excepciones
- Información de instancia del servidor (hostname, process ID)

**Estos logs se utilizan exclusivamente para:**
- Diagnosticar y solucionar problemas técnicos
- Mejorar el rendimiento y estabilidad del bot
- Identificar y prevenir abusos

### 3.3 Envío de Notificaciones

Con tu consentimiento implícito al usar ciertos comandos:

- **Recordatorios personales:** enviamos mensajes directos (DM)
- **Recordatorios globales:** mencionamos @everyone en canales (solo admins)
- **Mensajes de bienvenida:** mencionamos al usuario en canales públicos

## 4. Compartir y Divulgar Información

### 4.1 NO Compartimos tus Datos

- **NO vendemos** tu información a terceros
- **NO compartimos** tus datos con empresas externas
- **NO usamos** tus datos para publicidad o marketing
- **NO transferimos** datos fuera del contexto del servidor de Discord

### 4.2 Datos Visibles Públicamente

Algunos datos son visibles para otros miembros del servidor por diseño:

- **Encuestas:** tu nombre aparece como creador
- **Salas de voz:** tu nombre aparece como creador
- **Código compartido:** visible para todos en el canal
- **Mensajes de bienvenida:** tu mención es pública en el canal configurado

### 4.3 Excepciones Legales

Podemos divulgar información si:

- Es requerido por ley o por autoridades competentes
- Es necesario para proteger nuestros derechos legales
- Se detecta uso fraudulento o abuso del bot

## 5. Retención de Datos

### 5.1 Datos Temporales

- **Recordatorios:** se eliminan automáticamente después de ejecutarse, al cancelarlos, o al reiniciar el bot. Límite de 10 recordatorios activos por usuario.
- **Salas de voz:** se eliminan automáticamente cuando quedan vacías por 1 minuto continuo
- **Encuestas:** permanecen en Discord hasta que se elimine el mensaje (no controlado por el bot)
- **Cooldowns:** se limpian automáticamente después del tiempo configurado (3 segundos default)
- **Tracking de canales vacíos:** timestamps y timeouts se limpian al eliminar canales o al reiniciar

### 5.2 Logs del Sistema

- **Logs de comandos:** se retienen por máximo 30 días
- **Logs de errores:** se retienen por máximo 90 días
- **Logs antiguos:** se eliminan automáticamente o se archivan sin datos personales

### 5.3 Base de Datos

**Actualmente NO usamos bases de datos persistentes.** Todos los datos operativos se almacenan en memoria y se pierden al reiniciar el bot.

Si en el futuro implementamos almacenamiento persistente, actualizaremos esta política.

## 6. Seguridad de los Datos

Implementamos medidas de seguridad para proteger tus datos:

- **Acceso restringido:** solo administradores del CPF tienen acceso al servidor del bot
- **Conexiones seguras:** comunicación cifrada con la API de Discord (HTTPS/WSS)
- **Variables de entorno:** tokens y credenciales protegidos en archivos .env (no versionados)
- **Logs protegidos:** acceso limitado solo para debugging autorizado
- **Código abierto:** el código fuente está disponible en GitHub para auditoría
- **Validación de entrada:** todos los comandos validan formato, longitud y permisos
- **Rate limiting:** cooldowns implementados para prevenir spam y abuso
- **Cleanup automático:** recursos (timeouts, maps, listeners) se limpian apropiadamente
- **Verificación de permisos:** operaciones sensibles requieren permisos específicos
- **Manejo de errores:** try-catch comprehensivo con fallbacks seguros

**Sin embargo:**
- No podemos garantizar seguridad absoluta
- Discord tiene acceso a todos los datos según su propia política de privacidad
- Los administradores del servidor de Discord pueden ver mensajes públicos del bot

## 7. Tus Derechos

### 7.1 Acceso y Control

Tenés derecho a:

- **Dejar de usar el bot** en cualquier momento
- **Cancelar recordatorios** activos con `/recordar cancelar id:<ID>` (usa `/recordar listar` para ver IDs)
- **Eliminar salas de voz** que creaste (automáticamente se eliminan tras 1 minuto vacías)
- **Solicitar información** sobre qué datos tenemos de vos
- **Ver código fuente** en GitHub para entender qué hace el bot

### 7.2 Eliminación de Datos

Para solicitar la eliminación de tus datos:

1. Dejá de usar el bot (los datos temporales se eliminarán automáticamente)
2. Contactanos a clubdeprogramacion@ing.una.py para solicitar eliminación de logs

**Nota:** No podemos eliminar mensajes públicos del bot en Discord (como encuestas o bienvenidas), ya que forman parte del historial del servidor. Deberás contactar a los administradores del servidor.

### 7.3 Limitaciones

No podemos proporcionar:

- Datos que ya fueron eliminados automáticamente
- Datos de otros usuarios
- Logs de auditoría detallados sin justificación válida

## 8. Menores de Edad

CPF Bot está destinado a estudiantes universitarios y miembros de la comunidad académica. Discord requiere que los usuarios tengan al menos 13 años. Si sos menor de edad, asegurate de tener permiso de tus padres o tutores para usar Discord y nuestro bot.

## 9. Cookies y Tecnologías de Rastreo

**CPF Bot NO usa cookies, píxeles de rastreo, o tecnologías similares.** Solo interactúa a través de la API oficial de Discord.

## 10. Cambios a esta Política

Nos reservamos el derecho de actualizar esta Política de Privacidad en cualquier momento. Los cambios se publicarán en:

- Este documento en GitHub
- Anuncios en el servidor de Discord del CPF

**Cambios significativos** serán notificados con al menos 7 días de anticipación.

**Última revisión:** 1 de diciembre de 2025

## 11. Cumplimiento Legal

Esta política cumple con:

- **Discord Developer Policy:** https://discord.com/developers/docs/policies-and-agreements/developer-policy
- **Discord Terms of Service:** https://discord.com/terms
- **Ley de Protección de Datos Personales de Paraguay** (Ley N° 6534/2020)

## 12. Servicios de Terceros

### 12.1 Discord

CPF Bot opera en Discord y está sujeto a:

- **Política de Privacidad de Discord:** https://discord.com/privacy
- **Términos de Servicio de Discord:** https://discord.com/terms

Discord recopila sus propios datos según su política. No tenemos control sobre las prácticas de privacidad de Discord.

### 12.2 Hosting

El bot está alojado en:

- **Microsoft Azure** (máquina virtual en la nube)
- Sujeto a la política de privacidad de Microsoft Azure

No almacenamos datos sensibles en el servidor; solo el código del bot y logs temporales.

## 13. Contacto

Si tenés preguntas sobre esta Política de Privacidad o querés ejercer tus derechos:

- **Email:** clubdeprogramacion@ing.una.py
- **Discord:** Servidor oficial del Club de Programación FIUNA
- **GitHub:** https://github.com/cpfiuna
- **Ubicación:** Facultad de Ingeniería - UNA, San Lorenzo, Paraguay

**Tiempo de respuesta:** Intentaremos responder dentro de 7 días hábiles.

---

## Resumen Simplificado (No Legalmente Vinculante)

**¿Qué datos recopilamos?**
- Tu ID de Discord, nombre de usuario, y comandos que ejecutás

**¿Cómo los usamos?**
- Solo para que el bot funcione (bienvenidas, recordatorios, encuestas, etc.)

**¿Los compartimos?**
- No, nunca vendemos ni compartimos tus datos

**¿Cuánto tiempo los guardamos?**
- Datos temporales: hasta que el bot se reinicie
- Logs: máximo 30-90 días

**¿Cómo los protegemos?**
- Acceso restringido, conexiones seguras, código abierto

**¿Tus derechos?**
- Podés dejar de usar el bot cuando quieras y solicitar eliminación de datos

---

**Club de Programación FIUNA**  
Facultad de Ingeniería - Universidad Nacional de Asunción  
San Lorenzo, Paraguay

**Versión:** 1.0  
**Fecha de vigencia:** 1 de diciembre de 2025
