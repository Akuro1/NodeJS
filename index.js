const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const natural = require('natural');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcryptjs = require('bcryptjs');
const session = require('express-session');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// Configuración de seguridad y middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Configuración de sesiones
app.use(session({
  secret: 'eclipse-ai-2025-security-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, 
    httpOnly: true, 
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Servir archivos estáticos
app.use(express.static('public'));

// Configuración de MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://akuro5334_db_user:7JqnJQW1abdVisaf@global-database.cb0uvso.mongodb.net/';

// Esquemas de MongoDB
const conversationSchema = new mongoose.Schema({
  conversationId: String,
  userId: String,
  messages: [{
    role: { type: String, enum: ['user', 'ai'] },
    content: String,
    timestamp: { type: Date, default: Date.now },
    metadata: {
      intent: String,
      sentiment: String,
      confidence: Number
    }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const knowledgeSchema = new mongoose.Schema({
  topic: String,
  keywords: [String],
  content: String,
  source: String,
  confidence: Number,
  usage_count: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});

const Conversation = mongoose.model('Conversation', conversationSchema);
const Knowledge = mongoose.model('Knowledge', knowledgeSchema);

// Configuración de almacenamiento para archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads');
    }
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Contraseña de acceso
const ACCESS_PASSWORD = 'eclip2025clo><q__sa1e1';

// Middleware de autenticación
const requireAuth = (req, res, next) => {
  if (req.session.authenticated) {
    next();
  } else {
    res.status(401).json({ error: 'Acceso denegado. Autenticación requerida.' });
  }
};

// Clase Eclipse AI Avanzada
class AdvancedEclipseAI {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    this.tfidf = new natural.TfIdf();
    
    // Base de conocimiento expandida
    this.knowledgeBase = new Map();
    this.contextMemory = new Map();
    
    // Patrones de respuesta más sofisticados
    this.responsePatterns = {
      programming: {
        javascript: {
          patterns: ['javascript', 'js', 'node', 'react', 'vue', 'angular'],
          responses: [
            'JavaScript es un lenguaje versátil. Puedo ayudarte con sintaxis, frameworks como React/Vue, Node.js para backend, debugging, optimización de rendimiento, y mejores prácticas.',
            'En JavaScript, puedo asistirte con ES6+, programación asíncrona, manejo de DOM, APIs, testing, y desarrollo fullstack.',
            'Perfecto, JavaScript es mi especialidad. ¿Necesitas ayuda con frontend, backend, debugging, o alguna biblioteca específica?'
          ]
        },
        python: {
          patterns: ['python', 'py', 'django', 'flask', 'pandas', 'numpy'],
          responses: [
            'Python es excelente para desarrollo web, ciencia de datos, IA y automatización. Puedo ayudarte con Django/Flask, pandas, numpy, machine learning, y scripting.',
            'Con Python podemos trabajar en desarrollo web, análisis de datos, inteligencia artificial, automatización de tareas, y mucho más.',
            'Python es perfecto para muchos proyectos. ¿Estás trabajando en web development, data science, AI, o automatización?'
          ]
        },
        general: [
          'Como asistente de programación, puedo ayudarte con múltiples lenguajes: JavaScript, Python, Java, C++, Go, Rust. También con frameworks, bases de datos, DevOps y arquitectura.',
          'Estoy especializado en desarrollo de software. Puedo asistirte con código, debugging, optimización, arquitectura, patrones de diseño, y mejores prácticas.',
          'Cuéntame más sobre tu proyecto de desarrollo. Puedo ayudarte con planificación, implementación, testing, deployment y mantenimiento.'
        ]
      },
      
      search: {
        responses: [
          'Voy a buscar información actualizada sobre ese tema usando múltiples fuentes confiables.',
          'Déjame consultar mi base de conocimientos y fuentes externas para darte la información más precisa.',
          'Procesando tu consulta y buscando datos relevantes de fuentes verificadas.'
        ]
      },
      
      learning: {
        responses: [
          'Me especializo en enseñar de manera clara y progresiva. Puedo explicar conceptos complejos paso a paso.',
          'Perfecto, puedo crear explicaciones didácticas, ejemplos prácticos y guías de aprendizaje personalizadas.',
          'Voy a preparar una explicación comprensible adaptada a tu nivel de conocimiento.'
        ]
      },
      
      general: {
        responses: [
          'Entiendo tu consulta. Basándome en mi conocimiento y capacidades de análisis, puedo proporcionarte una respuesta detallada.',
          'Esa es una pregunta interesante. Voy a procesar la información y generar una respuesta completa.',
          'Permíteme analizar tu solicitud y crear una respuesta que sea útil y precisa para ti.'
        ]
      }
    };
    
    // Inicializar conocimiento base
    this.initializeKnowledgeBase();
  }

  async initializeKnowledgeBase() {
    try {
      // Cargar conocimiento desde MongoDB si existe
      const knowledge = await Knowledge.find({});
      knowledge.forEach(item => {
        this.knowledgeBase.set(item.topic, {
          content: item.content,
          keywords: item.keywords,
          confidence: item.confidence,
          usage_count: item.usage_count
        });
      });
      
      // Si no hay conocimiento en DB, inicializar con conocimiento básico
      if (knowledge.length === 0) {
        await this.seedKnowledgeBase();
      }
    } catch (error) {
      console.log('Inicializando con conocimiento base local:', error.message);
      this.seedLocalKnowledge();
    }
  }

  async seedKnowledgeBase() {
    const baseKnowledge = [
      {
        topic: 'programacion_web',
        keywords: ['html', 'css', 'javascript', 'web', 'frontend', 'backend'],
        content: 'La programación web involucra tecnologías como HTML para estructura, CSS para estilos, JavaScript para interactividad, y frameworks como React, Vue, Angular para frontend, y Node.js, Python, PHP para backend.',
        confidence: 0.9
      },
      {
        topic: 'inteligencia_artificial',
        keywords: ['ai', 'ia', 'machine learning', 'deep learning', 'neural networks'],
        content: 'La inteligencia artificial incluye machine learning, deep learning, procesamiento de lenguaje natural, visión computacional, y sistemas expertos que pueden aprender y tomar decisiones.',
        confidence: 0.95
      },
      {
        topic: 'bases_datos',
        keywords: ['database', 'sql', 'nosql', 'mongodb', 'mysql', 'postgresql'],
        content: 'Las bases de datos pueden ser relacionales (SQL) como MySQL, PostgreSQL, o NoSQL como MongoDB, Redis. Se usan para almacenar, organizar y recuperar datos eficientemente.',
        confidence: 0.9
      }
    ];

    for (const item of baseKnowledge) {
      const knowledge = new Knowledge(item);
      await knowledge.save();
      this.knowledgeBase.set(item.topic, item);
    }
  }

  seedLocalKnowledge() {
    this.knowledgeBase.set('programming', {
      content: 'Puedo ayudarte con programación en múltiples lenguajes y frameworks.',
      keywords: ['codigo', 'programar', 'desarrollo'],
      confidence: 0.8
    });
  }

  // Análisis de sentimientos mejorado
  analyzeSentiment(text) {
    const positiveWords = [
      'excelente', 'genial', 'perfecto', 'fantástico', 'increíble', 'bueno', 'bien', 
      'feliz', 'contento', 'satisfecho', 'encantado', 'maravilloso', 'estupendo',
      'gracias', 'útil', 'efectivo', 'exitoso', 'positivo', 'optimista'
    ];
    
    const negativeWords = [
      'malo', 'terrible', 'horrible', 'pésimo', 'awful', 'odio', 'molesto', 
      'furioso', 'triste', 'frustrado', 'confundido', 'difícil', 'problema',
      'error', 'fallo', 'roto', 'no funciona', 'imposible', 'complicado'
    ];

    const tokens = this.tokenizer.tokenize(text.toLowerCase());
    let positiveCount = 0;
    let negativeCount = 0;
    let emotionalIntensity = 0;

    tokens.forEach(token => {
      if (positiveWords.some(word => token.includes(word))) {
        positiveCount++;
        emotionalIntensity += 0.1;
      }
      if (negativeWords.some(word => token.includes(word))) {
        negativeCount++;
        emotionalIntensity += 0.1;
      }
    });

    const score = (positiveCount - negativeCount) / Math.max(tokens.length, 1);
    let sentiment = 'neutral';
    
    if (score > 0.05) sentiment = 'positive';
    else if (score < -0.05) sentiment = 'negative';

    return { score, sentiment, intensity: emotionalIntensity };
  }

  // Clasificación de intención avanzada
  classifyIntent(text) {
    const lowerText = text.toLowerCase();
    
    // Patrones más específicos
    if (lowerText.match(/hola|hi|hello|saludos|buenos días|buenas tardes|buenas noches/)) {
      return 'greeting';
    }
    
    if (lowerText.match(/código|programar|desarrollo|javascript|python|html|css|react|node|vue|angular|java|c\+\+|php|ruby|go|rust|programming|coding|software/)) {
      return 'programming';
    }
    
    if (lowerText.match(/buscar|encontrar|información|datos|investigar|consultar|research|search/)) {
      return 'search';
    }
    
    if (lowerText.match(/aprender|estudiar|enseñar|explicar|tutorial|course|lesson|education/)) {
      return 'learning';
    }
    
    if (lowerText.match(/ayuda|help|asistencia|soporte|problema|issue|bug|error/)) {
      return 'help';
    }
    
    if (lowerText.match(/qué puedes hacer|capabilities|funciones|features/)) {
      return 'capabilities';
    }
    
    return 'general';
  }

  // Generación de respuestas inteligente
  async generateIntelligentResponse(text, intent, context = {}) {
    const sentiment = this.analyzeSentiment(text);
    let response = '';
    let confidence = 0.7;

    try {
      switch (intent) {
        case 'programming':
          response = await this.generateProgrammingResponse(text);
          confidence = 0.9;
          break;
          
        case 'search':
          response = await this.generateSearchResponse(text);
          confidence = 0.85;
          break;
          
        case 'learning':
          response = await this.generateLearningResponse(text);
          confidence = 0.88;
          break;
          
        case 'help':
          response = this.generateHelpResponse(text, sentiment);
          confidence = 0.8;
          break;
          
        case 'capabilities':
          response = this.generateCapabilitiesResponse();
          confidence = 0.95;
          break;
          
        case 'greeting':
          response = this.generateGreetingResponse(sentiment);
          confidence = 0.9;
          break;
          
        default:
          response = await this.generateGeneralResponse(text);
          confidence = 0.75;
      }

      // Personalizar respuesta basada en sentimiento
      response = this.personalizeResponse(response, sentiment, context);
      
      return { response, intent, sentiment: sentiment.sentiment, confidence };
      
    } catch (error) {
      console.error('Error generando respuesta:', error);
      return {
        response: 'Entiendo tu consulta y estoy procesando una respuesta. Mientras tanto, ¿podrías proporcionar más detalles específicos?',
        intent,
        sentiment: sentiment.sentiment,
        confidence: 0.6
      };
    }
  }

  async generateProgrammingResponse(text) {
    const lowerText = text.toLowerCase();
    
    // Detectar lenguaje específico
    for (const [lang, data] of Object.entries(this.responsePatterns.programming)) {
      if (lang !== 'general' && data.patterns.some(pattern => lowerText.includes(pattern))) {
        const responses = data.responses;
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }
    
    // Respuesta general de programación
    const generalResponses = this.responsePatterns.programming.general;
    return generalResponses[Math.floor(Math.random() * generalResponses.length)];
  }

  async generateSearchResponse(text) {
    const responses = this.responsePatterns.search.responses;
    return responses[Math.floor(Math.random() * responses.length)];
  }

  async generateLearningResponse(text) {
    const responses = this.responsePatterns.learning.responses;
    return responses[Math.floor(Math.random() * responses.length)];
  }

  generateHelpResponse(text, sentiment) {
    const helpResponses = [
      'Estoy aquí para ayudarte. Puedo asistirte con programación, búsqueda de información, explicaciones detalladas, y resolución de problemas técnicos.',
      'Perfecto, déjame ayudarte. ¿Es un problema técnico específico, necesitas aprender algo nuevo, o buscas información sobre algún tema?',
      'Con gusto te ayudo. Tengo experiencia en desarrollo de software, investigación, explicaciones educativas, y resolución de problemas complejos.'
    ];
    
    let response = helpResponses[Math.floor(Math.random() * helpResponses.length)];
    
    if (sentiment.sentiment === 'negative') {
      response = 'Noto que podrías estar frustrado con algún problema. ' + response + ' Vamos paso a paso para solucionarlo.';
    }
    
    return response;
  }

  generateCapabilitiesResponse() {
    return `Como Eclipse AI, mis principales capacidades incluyen:

🤖 **Inteligencia Artificial**: Procesamiento de lenguaje natural, análisis de sentimientos, clasificación de intenciones

💻 **Programación**: Asistencia con JavaScript, Python, Java, C++, frameworks web, bases de datos, DevOps

🔍 **Búsqueda**: Acceso a información actualizada de internet, investigación de temas específicos

📚 **Educación**: Explicaciones detalladas, tutoriales paso a paso, adaptación al nivel de conocimiento

🛠️ **Resolución de problemas**: Debugging, optimización de código, arquitectura de software

📊 **Análisis**: Análisis de texto, métricas, estadísticas, patrones de datos

¿En qué área específica te gustaría que te ayude?`;
  }

  generateGreetingResponse(sentiment) {
    const greetings = [
      '¡Hola! Soy Eclipse AI, tu asistente inteligente especializado en tecnología y desarrollo.',
      'Saludos! Soy Eclipse AI, estoy aquí para ayudarte con programación, investigación y aprendizaje.',
      '¡Bienvenido! Soy Eclipse AI, listo para asistirte con cualquier desafío técnico o educativo.'
    ];
    
    let response = greetings[Math.floor(Math.random() * greetings.length)];
    
    if (sentiment.sentiment === 'positive') {
      response = '¡Me alegra saludarte! ' + response;
    }
    
    return response;
  }

  async generateGeneralResponse(text) {
    // Buscar en base de conocimiento
    const relevantKnowledge = this.findRelevantKnowledge(text);
    
    if (relevantKnowledge) {
      return `Basándome en mi conocimiento sobre este tema: ${relevantKnowledge.content}. ¿Te gustaría que profundice en algún aspecto específico?`;
    }
    
    const generalResponses = this.responsePatterns.general.responses;
    return generalResponses[Math.floor(Math.random() * generalResponses.length)];
  }

  findRelevantKnowledge(text) {
    const tokens = this.tokenizer.tokenize(text.toLowerCase());
    let bestMatch = null;
    let bestScore = 0;

    for (const [topic, data] of this.knowledgeBase.entries()) {
      let score = 0;
      data.keywords.forEach(keyword => {
        if (tokens.some(token => token.includes(keyword) || keyword.includes(token))) {
          score += data.confidence;
        }
      });
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = data;
      }
    }

    return bestScore > 0.3 ? bestMatch : null;
  }

  personalizeResponse(response, sentiment, context) {
    // Personalizar basado en sentimiento
    if (sentiment.sentiment === 'negative' && sentiment.intensity > 0.2) {
      response = 'Entiendo que esto puede ser frustrante. ' + response + ' Trabajemos juntos para encontrar la mejor solución.';
    } else if (sentiment.sentiment === 'positive' && sentiment.intensity > 0.2) {
      response = '¡Me alegra tu entusiasmo! ' + response;
    }

    // Agregar contexto si está disponible
    if (context.previousIntent && context.previousIntent !== 'greeting') {
      response += '\n\n¿Hay algo más relacionado con este tema en lo que pueda ayudarte?';
    }

    return response;
  }

  // Aprendizaje automático de nuevos conocimientos
  async learnFromInteraction(input, output, feedback) {
    try {
      const tokens = this.tokenizer.tokenize(input.toLowerCase());
      const keywords = tokens.filter(token => token.length > 3);
      
      const knowledge = new Knowledge({
        topic: `learned_${Date.now()}`,
        keywords: keywords.slice(0, 10), // Limitar keywords
        content: `Usuario preguntó: "${input}". Respuesta apropiada: "${output}"`,
        source: 'user_interaction',
        confidence: feedback ? 0.8 : 0.6
      });
      
      await knowledge.save();
      this.knowledgeBase.set(knowledge.topic, {
        content: knowledge.content,
        keywords: knowledge.keywords,
        confidence: knowledge.confidence,
        usage_count: 1
      });
      
    } catch (error) {
      console.log('Error aprendiendo de interacción:', error.message);
    }
  }
}

// Inicializar Eclipse AI
const eclipseAI = new AdvancedEclipseAI();

// Conectar a MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('🗄️  MongoDB conectado exitosamente');
}).catch(err => {
  console.log('⚠️  MongoDB no disponible, usando memoria local:', err.message);
});

// Función de búsqueda web mejorada
async function advancedWebSearch(query, maxResults = 3) {
  const results = [];
  
  try {
    // Wikipedia search
    try {
      const wikiQuery = encodeURIComponent(query.replace(/[^\w\s]/gi, ''));
      const wikiResponse = await axios.get(
        `https://es.wikipedia.org/api/rest_v1/page/summary/${wikiQuery}`,
        { timeout: 5000 }
      );
      
      if (wikiResponse.data && wikiResponse.data.extract) {
        results.push({
          title: wikiResponse.data.title,
          snippet: wikiResponse.data.extract.substring(0, 300) + '...',
          url: wikiResponse.data.content_urls?.desktop?.page || '',
          source: 'Wikipedia',
          confidence: 0.9
        });
      }
    } catch (error) {
      console.log('Wikipedia no disponible:', error.message);
    }

    // Búsqueda en base de conocimiento local
    const localKnowledge = eclipseAI.findRelevantKnowledge(query);
    if (localKnowledge && results.length < maxResults) {
      results.push({
        title: `Conocimiento de Eclipse AI sobre: ${query}`,
        snippet: localKnowledge.content,
        url: '',
        source: 'Eclipse AI Knowledge Base',
        confidence: localKnowledge.confidence
      });
    }

    // Si no hay resultados, generar respuesta inteligente
    if (results.length === 0) {
      const intelligentResponse = await eclipseAI.generateGeneralResponse(query);
      results.push({
        title: `Análisis inteligente sobre: ${query}`,
        snippet: intelligentResponse,
        url: '',
        source: 'Eclipse AI Analysis',
        confidence: 0.75
      });
    }

    return results;
    
  } catch (error) {
    console.error('Error en búsqueda avanzada:', error);
    return [{
      title: 'Análisis disponible',
      snippet: 'Puedo analizar tu consulta basándome en mi conocimiento interno. ¿Te gustaría que profundice en algún aspecto específico?',
      url: '',
      source: 'Eclipse AI'
    }];
  }
}

// RUTAS DE LA API

// Ruta de autenticación
app.post('/api/auth', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (password === ACCESS_PASSWORD) {
      req.session.authenticated = true;
      res.json({ 
        success: true, 
        message: 'Acceso autorizado a Eclipse AI',
        sessionId: req.session.id
      });
    } else {
      res.status(401).json({ 
        success: false, 
        error: 'Contraseña incorrecta' 
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error de autenticación' });
  }
});

// Verificar autenticación
app.get('/api/auth/status', (req, res) => {
  res.json({ authenticated: !!req.session.authenticated });
});

// Cerrar sesión
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true, message: 'Sesión cerrada' });
});

// Ruta principal (solo mostrar si está autenticado)
app.get('/', (req, res) => {
  if (req.session.authenticated) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
  }
});

// Chat con IA avanzada
app.post('/api/chat', requireAuth, async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    const intent = eclipseAI.classifyIntent(message);
    let aiResponse;
    let searchResults = [];

    // Contexto de conversación previa
    const context = { conversationId };

    // Generar respuesta inteligente
    if (intent === 'search' || message.toLowerCase().includes('buscar')) {
      searchResults = await advancedWebSearch(message);
      aiResponse = await eclipseAI.generateIntelligentResponse(
        'búsqueda de información', 
        'search', 
        context
      );
    } else {
      aiResponse = await eclipseAI.generateIntelligentResponse(message, intent, context);
    }

    // Guardar conversación en MongoDB
    const currentConversationId = conversationId || uuidv4();
    
    try {
      let conversation = await Conversation.findOne({ conversationId: currentConversationId });
      
      if (!conversation) {
        conversation = new Conversation({
          conversationId: currentConversationId,
          userId: req.session.id,
          messages: []
        });
      }
      
      // Agregar mensajes
      conversation.messages.push(
        {
          role: 'user',
          content: message,
          metadata: { intent }
        },
        {
          role: 'ai',
          content: aiResponse.response,
          metadata: {
            intent: aiResponse.intent,
            sentiment: aiResponse.sentiment,
            confidence: aiResponse.confidence
          }
        }
      );
      
      conversation.updatedAt = new Date();
      await conversation.save();
    } catch (dbError) {
      console.log('Error guardando en MongoDB:', dbError.message);
    }

    // Aprender de la interacción
    await eclipseAI.learnFromInteraction(message, aiResponse.response, true);

    res.json({
      response: aiResponse.response,
      conversationId: currentConversationId,
      intent: aiResponse.intent,
      searchResults,
      metadata: {
        sentiment: aiResponse.sentiment,
        confidence: aiResponse.confidence,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Error en chat:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      response: 'Disculpa, ocurrió un error procesando tu mensaje. Mi sistema de respaldo está trabajando para resolver esto.'
    });
  }
});

// Búsqueda directa
app.post('/api/search', requireAuth, async (req, res) => {
  try {
    const { query, maxResults = 5 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Consulta requerida' });
    }

    const results = await advancedWebSearch(query, maxResults);
    
    res.json({
      query,
      results,
      timestamp: new Date(),
      totalResults: results.length
    });

  } catch (error) {
    console.error('Error en búsqueda:', error);
    res.status(500).json({ error: 'Error en la búsqueda' });
  }
});

// Análisis de texto avanzado
app.post('/api/analyze', requireAuth, (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Texto requerido' });
    }

    const sentiment = eclipseAI.analyzeSentiment(text);
    const intent = eclipseAI.classifyIntent(text);
    const tokens = eclipseAI.tokenizer.tokenize(text);
    const relevantKnowledge = eclipseAI.findRelevantKnowledge(text);
    
    res.json({
      originalText: text,
      sentiment: {
        ...sentiment,
        description: sentiment.sentiment === 'positive' ? 'Positivo' : 
                    sentiment.sentiment === 'negative' ? 'Negativo' : 'Neutral'
      },
      intent: {
        detected: intent,
        description: eclipseAI.responsePatterns[intent] ? 
          `Intención clasificada como: ${intent}` : 
          'Intención general detectada'
      },
      tokens,
      wordCount: tokens.length,
      analysis: {
        complexity: tokens.length > 50 ? 'alta' : tokens.length > 20 ? 'media' : 'baja',
        language: 'español',
        readability: tokens.length < 30 ? 'fácil' : tokens.length < 60 ? 'moderada' : 'compleja',
        relevantKnowledge: relevantKnowledge ? 'Encontrado conocimiento relevante' : 'Sin conocimiento específico'
      },
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error en análisis:', error);
    res.status(500).json({ error: 'Error en el análisis' });
  }
});

// Obtener historial de conversaciones
app.get('/api/conversations', requireAuth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    let conversations = [];
    
    try {
      conversations = await Conversation
        .find({ userId: req.session.id })
        .sort({ updatedAt: -1 })
        .limit(parseInt(limit))
        .lean();
    } catch (dbError) {
      console.log('MongoDB no disponible para historial:', dbError.message);
    }
    
    res.json({
      conversations,
      total: conversations.length,
      source: conversations.length > 0 ? 'database' : 'memory'
    });

  } catch (error) {
    console.error('Error obteniendo conversaciones:', error);
    res.status(500).json({ error: 'Error obteniendo conversaciones' });
  }
});

// Estadísticas avanzadas
app.get('/api/stats', requireAuth, async (req, res) => {
  try {
    let stats = {
      totalConversations: 0,
      knowledgeBaseSize: eclipseAI.knowledgeBase.size,
      topIntents: {},
      averageConfidence: 0.8,
      uptime: process.uptime(),
      version: '2.0.0',
      memoryUsage: process.memoryUsage(),
      timestamp: new Date()
    };

    try {
      const conversations = await Conversation.find({});
      stats.totalConversations = conversations.length;
      
      // Calcular intenciones más comunes
      const intentCounts = {};
      conversations.forEach(conv => {
        conv.messages.forEach(msg => {
          if (msg.metadata && msg.metadata.intent) {
            intentCounts[msg.metadata.intent] = (intentCounts[msg.metadata.intent] || 0) + 1;
          }
        });
      });
      
      stats.topIntents = intentCounts;
      
      // Calcular confianza promedio
      let totalConfidence = 0;
      let confidenceCount = 0;
      conversations.forEach(conv => {
        conv.messages.forEach(msg => {
          if (msg.metadata && msg.metadata.confidence) {
            totalConfidence += msg.metadata.confidence;
            confidenceCount++;
          }
        });
      });
      
      if (confidenceCount > 0) {
        stats.averageConfidence = totalConfidence / confidenceCount;
      }
      
    } catch (dbError) {
      console.log('Estadísticas desde memoria:', dbError.message);
    }

    res.json(stats);
    
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
});

// Entrenar la IA
app.post('/api/train', requireAuth, async (req, res) => {
  try {
    const { input, expectedOutput, feedback } = req.body;
    
    if (!input || !expectedOutput) {
      return res.status(400).json({ error: 'Input y expectedOutput requeridos' });
    }

    await eclipseAI.learnFromInteraction(input, expectedOutput, feedback);
    
    res.json({
      message: 'Entrenamiento completado exitosamente',
      knowledgeBaseSize: eclipseAI.knowledgeBase.size,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error en entrenamiento:', error);
    res.status(500).json({ error: 'Error en entrenamiento' });
  }
});

// Subir archivos
app.post('/api/upload', requireAuth, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    const fileInfo = {
      id: uuidv4(),
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      uploadDate: new Date(),
      path: req.file.path,
      type: req.file.mimetype
    };

    res.json({
      message: 'Archivo subido exitosamente',
      file: fileInfo
    });

  } catch (error) {
    console.error('Error subiendo archivo:', error);
    res.status(500).json({ error: 'Error subiendo archivo' });
  }
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Manejo de errores globales
app.use((error, req, res, next) => {
  console.error('Error global:', error);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🤖 Eclipse AI Avanzado ejecutándose en puerto ${PORT}`);
  console.log(`🌐 Interfaz disponible en: http://localhost:${PORT}`);
  console.log(`🔒 Sistema de autenticación activado`);
  console.log(`🗄️  Base de datos: MongoDB integrado`);
  console.log(`🧠 IA mejorada con respuestas autónomas`);
  console.log(`📊 API endpoints disponibles:`);
  console.log(`   POST /api/auth - Autenticación`);
  console.log(`   POST /api/chat - Chat con IA avanzada`);
  console.log(`   POST /api/search - Búsqueda web inteligente`);
  console.log(`   POST /api/analyze - Análisis de texto avanzado`);
  console.log(`   GET  /api/conversations - Historial persistente`);
  console.log(`   GET  /api/stats - Estadísticas detalladas`);
  console.log(`   POST /api/train - Entrenamiento de IA`);
  console.log(`   POST /api/upload - Subida de archivos`);
});