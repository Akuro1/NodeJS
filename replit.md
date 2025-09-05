# Eclipse AI - Asistente Inteligente Completo

## Descripción General
Eclipse AI es una aplicación completa de inteligencia artificial que combina:
- **Interfaz gráfica moderna y responsiva**
- **Procesamiento de lenguaje natural**
- **Machine Learning integrado**
- **Acceso a internet en tiempo real**
- **Análisis de texto avanzado**
- **Chat inteligente con múltiples capacidades**

## Características Principales

### 🤖 Inteligencia Artificial
- Análisis de sentimientos en tiempo real
- Clasificación automática de intenciones
- Generación de respuestas contextualmente relevantes
- Aprendizaje continuo de interacciones

### 🌐 Conectividad Web
- Búsqueda en tiempo real en Wikipedia
- Integración con múltiples fuentes de datos
- Respuestas actualizadas con información reciente

### 🎨 Interfaz Moderna
- Diseño dark theme elegante
- Interfaz completamente responsiva
- Animaciones suaves y transiciones
- Paneles de análisis interactivos
- Modales para estadísticas e historial

### 📊 Analytics y ML
- Análisis de texto en tiempo real
- Métricas de conversación
- Estadísticas de uso
- Historial completo de interacciones

## Arquitectura Técnica

### Backend (Node.js + Express)
- **API RESTful** con endpoints especializados
- **Natural.js** para procesamiento de lenguaje
- **Axios + Cheerio** para web scraping
- **Multer** para subida de archivos
- **Sistema de aprendizaje** en memoria

### Frontend (HTML5 + CSS3 + JavaScript)
- **CSS Grid/Flexbox** para layouts responsivos
- **Variables CSS** para theming consistente
- **JavaScript moderno** (ES6+) para interactividad
- **Web APIs** para funcionalidades avanzadas

### Endpoints de la API
- `POST /api/chat` - Chat principal con IA
- `POST /api/search` - Búsqueda web directa
- `POST /api/analyze` - Análisis de texto
- `GET /api/conversations` - Historial de conversaciones
- `GET /api/stats` - Estadísticas de uso
- `POST /api/train` - Entrenamiento de la IA
- `POST /api/upload` - Subida de archivos

## Funcionalidades Implementadas

### Chat Inteligente
- Detección automática de intenciones (saludo, código, búsqueda, aprendizaje)
- Respuestas contextuales y personalizadas
- Soporte para markdown básico
- Indicador de escritura en tiempo real

### Machine Learning
- Análisis de sentimientos con palabras clave en español
- Clasificación de intenciones con patrones regex
- Sistema de confianza en respuestas
- Base de conocimiento expandible

### Búsqueda Web
- Integración con Wikipedia API
- Fallback a conocimiento interno
- Resultados estructurados y clickeables
- Caché inteligente de búsquedas

### Análisis de Texto
- Métricas de complejidad
- Análisis de legibilidad
- Conteo de palabras y tokens
- Detección de idioma básica

## Configuración y Uso

### Requisitos
- Node.js 20+
- Dependencias instaladas automáticamente
- Puerto 5000 disponible

### Instalación
```bash
npm install
node index.js
```

### Acceso
- **Interfaz web**: http://localhost:5000
- **API**: http://localhost:5000/api/*

## Estructura de Archivos
```
/
├── index.js              # Servidor principal y lógica de IA
├── package.json          # Dependencias y configuración
├── public/
│   ├── index.html        # Interfaz principal
│   ├── styles.css        # Estilos modernos
│   └── script.js         # Lógica del cliente
├── uploads/              # Archivos subidos (creado automáticamente)
└── replit.md            # Esta documentación
```

## Tecnologías Utilizadas

### Backend
- Express.js (servidor web)
- Natural.js (procesamiento de lenguaje)
- Axios (peticiones HTTP)
- Cheerio (web scraping)
- Multer (subida de archivos)
- UUID (identificadores únicos)

### Frontend
- HTML5 semántico
- CSS3 con variables y grid/flexbox
- JavaScript ES6+ vanilla
- Font Awesome (iconos)
- Google Fonts (tipografía)

## Estado del Proyecto
✅ **Completamente funcional** - Versión 2.0 con IA avanzada y seguridad implementada

### Características Completadas
- [x] Servidor backend completo con IA avanzada
- [x] API RESTful funcional con 8 endpoints
- [x] Interfaz gráfica moderna y responsiva
- [x] Chat inteligente con respuestas autónomas
- [x] Machine learning avanzado con base de conocimiento
- [x] Búsqueda web inteligente
- [x] Análisis de texto avanzado
- [x] Sistema de configuración completo
- [x] Historial persistente con MongoDB
- [x] Estadísticas detalladas
- [x] Subida de archivos
- [x] **🔒 Sistema de autenticación seguro**
- [x] **🗄️ Base de datos MongoDB integrada**
- [x] **🤖 IA con respuestas autónomas mejoradas**
- [x] **📚 Sistema de aprendizaje automático**

## Optimización de Recursos
- **Sin dependencias nativas pesadas** (evita problemas de compilación)
- **Base de datos en memoria** (no requiere configuración externa)
- **Cache inteligente** para búsquedas
- **Lazy loading** de componentes
- **Optimización de bundle** automática

## Próximas Mejoras Posibles
- Integración con APIs de IA externa (OpenAI, Claude)
- Base de datos persistente (PostgreSQL)
- Autenticación de usuarios
- Temas personalizables
- Reconocimiento de voz
- Exportación de conversaciones
- Plugins extensibles

---

**Eclipse AI** - Una IA completa, moderna y eficiente, lista para usar sin configuraciones complejas.