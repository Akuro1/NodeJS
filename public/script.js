class EclipseAIClient {
    constructor() {
        this.conversationId = null;
        this.isTyping = false;
        this.settings = this.loadSettings();
        this.messageHistory = [];
        this.apiEndpoint = '/api';
        this.authenticated = false;
        
        this.checkAuthentication().then(() => {
            if (this.authenticated) {
                this.initializeElements();
                this.attachEventListeners();
                this.applySettings();
                this.showWelcomeMessage();
                console.log('🤖 Eclipse AI Client iniciado - Sesión autenticada');
            }
        });
    }

    async checkAuthentication() {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();
            
            if (!data.authenticated) {
                window.location.href = '/';
                return false;
            }
            
            this.authenticated = true;
            return true;
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            window.location.href = '/';
            return false;
        }
    }

    initializeElements() {
        // Chat elements
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.charCount = document.getElementById('charCount');
        
        // Control buttons
        this.statsBtn = document.getElementById('statsBtn');
        this.historyBtn = document.getElementById('historyBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.attachBtn = document.getElementById('attachBtn');
        this.voiceBtn = document.getElementById('voiceBtn');
        this.fileInput = document.getElementById('fileInput');
        
        // Modals
        this.statsModal = document.getElementById('statsModal');
        this.historyModal = document.getElementById('historyModal');
        this.settingsModal = document.getElementById('settingsModal');
        this.analysisPanel = document.getElementById('analysisPanel');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        
        // Settings
        this.themeSelect = document.getElementById('themeSelect');
        this.fontSizeSelect = document.getElementById('fontSizeSelect');
        this.soundsCheckbox = document.getElementById('soundsCheckbox');
        this.animationsCheckbox = document.getElementById('animationsCheckbox');
    }

    attachEventListeners() {
        // Chat functionality
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        this.messageInput.addEventListener('input', () => this.updateCharCount());
        
        // File upload
        this.attachBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Voice functionality (placeholder)
        this.voiceBtn.addEventListener('click', () => this.toggleVoiceInput());
        
        // Control buttons
        this.statsBtn.addEventListener('click', () => this.showStats());
        this.historyBtn.addEventListener('click', () => this.showHistory());
        this.settingsBtn.addEventListener('click', () => this.showSettings());
        this.logoutBtn.addEventListener('click', () => this.handleLogout());
        
        // Modal controls
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = e.target.closest('.modal-close').dataset.modal;
                this.closeModal(modalId);
            });
        });
        
        // Panel controls
        const closePanelBtn = document.getElementById('closePanelBtn');
        if (closePanelBtn) {
            closePanelBtn.addEventListener('click', () => this.closeAnalysisPanel());
        }
        
        // Quick action buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-btn')) {
                const action = e.target.dataset.action;
                if (action) {
                    this.messageInput.value = action;
                    this.sendMessage();
                }
            }
        });
        
        // Modal backdrop clicks
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
        
        // Settings changes
        this.themeSelect.addEventListener('change', () => this.updateSettings());
        this.fontSizeSelect.addEventListener('change', () => this.updateSettings());
        this.soundsCheckbox.addEventListener('change', () => this.updateSettings());
        this.animationsCheckbox.addEventListener('change', () => this.updateSettings());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'k':
                        e.preventDefault();
                        this.messageInput.focus();
                        break;
                    case 's':
                        e.preventDefault();
                        this.showStats();
                        break;
                    case 'h':
                        e.preventDefault();
                        this.showHistory();
                        break;
                }
            }
            if (e.key === 'Escape') {
                this.closeAllModals();
                this.closeAnalysisPanel();
            }
        });
    }

    showWelcomeMessage() {
        // Welcome message is already in HTML, just ensure it's visible
        this.scrollToBottom();
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isTyping) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.updateCharCount();
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Send to API
            const response = await this.callAPI('/chat', {
                message,
                conversationId: this.conversationId
            });
            
            if (response.conversationId) {
                this.conversationId = response.conversationId;
            }
            
            // Hide typing indicator
            this.hideTypingIndicator();
            
            // Add AI response
            this.addMessage(response.response, 'ai', {
                intent: response.intent,
                confidence: response.metadata?.confidence,
                searchResults: response.searchResults
            });
            
            // Store in history
            this.messageHistory.push({
                userMessage: message,
                aiResponse: response.response,
                timestamp: new Date(),
                metadata: response.metadata
            });
            
            // Play notification sound
            this.playNotificationSound();
            
        } catch (error) {
            console.error('Error enviando mensaje:', error);
            this.hideTypingIndicator();
            this.addMessage('Lo siento, ocurrió un error al procesar tu mensaje. Por favor, inténtalo de nuevo.', 'ai', {
                isError: true
            });
        }
    }

    addMessage(content, sender, metadata = {}) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}`;
        
        const avatar = document.createElement('div');
        avatar.className = sender === 'user' ? 'user-avatar' : 'ai-avatar';
        avatar.innerHTML = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.innerHTML = this.formatMessage(content);
        
        // Add metadata
        if (metadata.intent || metadata.confidence) {
            const meta = document.createElement('div');
            meta.className = 'message-meta';
            
            if (metadata.intent) {
                const intentBadge = document.createElement('span');
                intentBadge.className = 'intent-badge';
                intentBadge.textContent = this.translateIntent(metadata.intent);
                meta.appendChild(intentBadge);
            }
            
            if (metadata.confidence) {
                const confidenceBadge = document.createElement('span');
                confidenceBadge.className = 'confidence-badge';
                confidenceBadge.textContent = `${Math.round(metadata.confidence * 100)}% confianza`;
                meta.appendChild(confidenceBadge);
            }
            
            const timestamp = document.createElement('span');
            timestamp.textContent = new Date().toLocaleTimeString();
            meta.appendChild(timestamp);
            
            bubble.appendChild(meta);
        }
        
        // Add search results if available
        if (metadata.searchResults && metadata.searchResults.length > 0) {
            const searchContainer = document.createElement('div');
            searchContainer.className = 'search-results';
            searchContainer.innerHTML = '<h4><i class=\"fas fa-search\"></i> Resultados de búsqueda:</h4>';
            
            metadata.searchResults.forEach(result => {
                const resultElement = document.createElement('div');
                resultElement.className = 'search-result';
                resultElement.innerHTML = `
                    <h4>${result.title}</h4>
                    <p>${result.snippet}</p>
                    <div class=\"source\">Fuente: ${result.source}</div>
                `;
                
                if (result.url) {
                    resultElement.style.cursor = 'pointer';
                    resultElement.addEventListener('click', () => {
                        window.open(result.url, '_blank');
                    });
                }
                
                searchContainer.appendChild(resultElement);
            });
            
            bubble.appendChild(searchContainer);
        }
        
        messageElement.appendChild(avatar);
        messageElement.appendChild(bubble);
        
        // Add to chat
        this.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
        
        // Animate in
        if (this.settings.animations) {
            messageElement.style.opacity = '0';
            messageElement.style.transform = 'translateY(20px)';
            setTimeout(() => {
                messageElement.style.transition = 'all 0.3s ease';
                messageElement.style.opacity = '1';
                messageElement.style.transform = 'translateY(0)';
            }, 50);
        }
    }

    formatMessage(content) {
        // Simple markdown-like formatting
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
        content = content.replace(/`(.*?)`/g, '<code>$1</code>');
        content = content.replace(/\n/g, '<br>');
        
        // Convert URLs to links
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        content = content.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener">$1</a>');
        
        return content;
    }

    translateIntent(intent) {
        const translations = {
            'greeting': 'Saludo',
            'coding': 'Programación',
            'search': 'Búsqueda',
            'learning': 'Aprendizaje',
            'default': 'General'
        };
        return translations[intent] || intent;
    }

    showTypingIndicator() {
        this.isTyping = true;
        this.typingIndicator.style.display = 'flex';
        this.sendBtn.disabled = true;
    }

    hideTypingIndicator() {
        this.isTyping = false;
        this.typingIndicator.style.display = 'none';
        this.sendBtn.disabled = false;
    }

    updateCharCount() {
        const count = this.messageInput.value.length;
        this.charCount.textContent = `${count}/1000`;
        
        if (count > 900) {
            this.charCount.style.color = 'var(--error-color)';
        } else if (count > 700) {
            this.charCount.style.color = 'var(--warning-color)';
        } else {
            this.charCount.style.color = 'var(--text-muted)';
        }
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    async showStats() {
        this.showModal('statsModal');
        const content = document.getElementById('statsContent');
        content.innerHTML = '<div class=\"loading\"><i class=\"fas fa-spinner fa-spin\"></i>Cargando estadísticas...</div>';
        
        try {
            const stats = await this.callAPI('/stats', {}, 'GET');
            
            content.innerHTML = `
                <div class=\"stat-grid\">
                    <div class=\"stat-card\">
                        <span class=\"stat-value\">${stats.totalConversations}</span>
                        <div class=\"stat-label\">Conversaciones</div>
                    </div>
                    <div class=\"stat-card\">
                        <span class=\"stat-value\">${stats.knowledgeBaseSize}</span>
                        <div class=\"stat-label\">Base de Conocimiento</div>
                    </div>
                    <div class=\"stat-card\">
                        <span class=\"stat-value\">${Math.round(stats.averageConfidence * 100)}%</span>
                        <div class=\"stat-label\">Confianza Promedio</div>
                    </div>
                    <div class=\"stat-card\">
                        <span class=\"stat-value\">${Math.round(stats.uptime / 3600)}h</span>
                        <div class=\"stat-label\">Tiempo Activo</div>
                    </div>
                </div>
                <div class=\"analysis-section\">
                    <h4><i class=\"fas fa-chart-pie\"></i> Intenciones Más Comunes</h4>
                    ${Object.entries(stats.topIntents).map(([intent, count]) => `
                        <div class=\"analysis-metric\">
                            <span class=\"metric-label\">${this.translateIntent(intent)}</span>
                            <span class=\"metric-value\">${count}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (error) {
            content.innerHTML = '<div class=\"error\">Error cargando estadísticas</div>';
        }
    }

    async showHistory() {
        this.showModal('historyModal');
        const content = document.getElementById('historyContent');
        content.innerHTML = '<div class=\"loading\"><i class=\"fas fa-spinner fa-spin\"></i>Cargando historial...</div>';
        
        try {
            const history = await this.callAPI('/conversations', {}, 'GET');
            
            if (history.conversations.length === 0) {
                content.innerHTML = '<div class=\"empty-state\">No hay conversaciones en el historial</div>';
                return;
            }
            
            content.innerHTML = history.conversations.map(conv => `
                <div class=\"history-item\">
                    <div class=\"history-user\">${conv.userMessage}</div>
                    <div class=\"history-ai\">${conv.aiResponse}</div>
                    <div class=\"history-meta\">${new Date(conv.timestamp).toLocaleString()}</div>
                </div>
            `).join('');
            
        } catch (error) {
            content.innerHTML = '<div class=\"error\">Error cargando historial</div>';
        }
    }

    showSettings() {
        this.showModal('settingsModal');
        
        // Update settings values
        this.themeSelect.value = this.settings.theme;
        this.fontSizeSelect.value = this.settings.fontSize;
        this.soundsCheckbox.checked = this.settings.sounds;
        this.animationsCheckbox.checked = this.settings.animations;
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            // Focus trap
            const focusableElements = modal.querySelectorAll('button, input, select, textarea');
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    closeAnalysisPanel() {
        this.analysisPanel.classList.remove('active');
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        this.showLoadingOverlay('Subiendo archivo...');
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch(`${this.apiEndpoint}/upload`, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.addMessage(`Archivo "${file.name}" subido exitosamente. Puedes preguntarme sobre su contenido.`, 'ai');
            } else {
                throw new Error(result.error || 'Error subiendo archivo');
            }
            
        } catch (error) {
            console.error('Error subiendo archivo:', error);
            this.addMessage('Error subiendo el archivo. Por favor, inténtalo de nuevo.', 'ai', { isError: true });
        } finally {
            this.hideLoadingOverlay();
            event.target.value = ''; // Clear file input
        }
    }

    toggleVoiceInput() {
        // Placeholder for voice functionality
        this.addMessage('La funcionalidad de voz estará disponible próximamente.', 'ai');
    }

    updateSettings() {
        this.settings = {
            theme: this.themeSelect.value,
            fontSize: this.fontSizeSelect.value,
            sounds: this.soundsCheckbox.checked,
            animations: this.animationsCheckbox.checked
        };
        
        this.saveSettings();
        this.applySettings();
    }

    applySettings() {
        // Apply theme
        document.body.dataset.theme = this.settings.theme;
        
        // Apply font size
        document.body.dataset.fontSize = this.settings.fontSize;
        
        // Apply animations
        if (!this.settings.animations) {
            document.body.classList.add('no-animations');
        } else {
            document.body.classList.remove('no-animations');
        }
    }

    loadSettings() {
        const defaultSettings = {
            theme: 'dark',
            fontSize: 'medium',
            sounds: true,
            animations: true
        };
        
        try {
            const saved = localStorage.getItem('eclipseAI_settings');
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        } catch {
            return defaultSettings;
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('eclipseAI_settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Error guardando configuración:', error);
        }
    }

    playNotificationSound() {
        if (!this.settings.sounds) return;
        
        // Simple notification sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
            console.log('Audio no disponible:', error);
        }
    }

    showLoadingOverlay(message = 'Procesando...') {
        this.loadingOverlay.classList.add('active');
        const messageElement = this.loadingOverlay.querySelector('p');
        if (messageElement) {
            messageElement.textContent = message;
        }
    }

    hideLoadingOverlay() {
        this.loadingOverlay.classList.remove('active');
    }

    async callAPI(endpoint, data = {}, method = 'POST') {
        const url = `${this.apiEndpoint}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        if (method !== 'GET') {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }
        
        return await response.json();
    }

    // Handle logout
    async handleLogout() {
        if (confirm('¿Estás seguro de que deseas cerrar la sesión?')) {
            try {
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.href = '/';
            } catch (error) {
                console.error('Error cerrando sesión:', error);
                // Force redirect even if API call fails
                window.location.href = '/';
            }
        }
    }

    // Utility method to analyze text
    async analyzeText(text) {
        try {
            const analysis = await this.callAPI('/analyze', { text });
            this.showAnalysisPanel(analysis);
        } catch (error) {
            console.error('Error analizando texto:', error);
        }
    }

    showAnalysisPanel(analysis) {
        const content = document.getElementById('analysisContent');
        content.innerHTML = `
            <div class=\"analysis-section\">
                <h4><i class=\"fas fa-heart\"></i> Análisis de Sentimiento</h4>
                <div class=\"analysis-metric\">
                    <span class=\"metric-label\">Sentimiento</span>
                    <span class=\"metric-value\">${analysis.sentiment.sentiment}</span>
                </div>
                <div class=\"analysis-metric\">
                    <span class=\"metric-label\">Puntuación</span>
                    <span class=\"metric-value\">${analysis.sentiment.score.toFixed(2)}</span>
                </div>
            </div>
            <div class=\"analysis-section\">
                <h4><i class=\"fas fa-bullseye\"></i> Clasificación</h4>
                <div class=\"analysis-metric\">
                    <span class=\"metric-label\">Intención</span>
                    <span class=\"metric-value\">${this.translateIntent(analysis.intent)}</span>
                </div>
            </div>
            <div class=\"analysis-section\">
                <h4><i class=\"fas fa-chart-bar\"></i> Métricas</h4>
                <div class=\"analysis-metric\">
                    <span class=\"metric-label\">Palabras</span>
                    <span class=\"metric-value\">${analysis.wordCount}</span>
                </div>
                <div class=\"analysis-metric\">
                    <span class=\"metric-label\">Complejidad</span>
                    <span class=\"metric-value\">${analysis.analysis.complexity}</span>
                </div>
                <div class=\"analysis-metric\">
                    <span class=\"metric-label\">Legibilidad</span>
                    <span class=\"metric-value\">${analysis.analysis.readability}</span>
                </div>
            </div>
        `;
        
        this.analysisPanel.classList.add('active');
    }
}

// Initialize Eclipse AI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.eclipseAI = new EclipseAIClient();
});

// Add some CSS for dynamic classes
const additionalCSS = `
.no-animations * {
    animation: none !important;
    transition: none !important;
}

[data-font-size="small"] {
    font-size: 14px;
}

[data-font-size="large"] {
    font-size: 18px;
}

.history-item {
    padding: 1rem;
    margin-bottom: 1rem;
    background: var(--card-color);
    border-radius: var(--border-radius);
    border: 1px solid var(--border-color);
}

.history-user {
    font-weight: 600;
    color: var(--primary-color);
    margin-bottom: 0.5rem;
}

.history-ai {
    color: var(--text-primary);
    margin-bottom: 0.5rem;
}

.history-meta {
    font-size: 0.8rem;
    color: var(--text-muted);
}

.empty-state {
    text-align: center;
    color: var(--text-secondary);
    padding: 2rem;
    font-style: italic;
}

.error {
    color: var(--error-color);
    text-align: center;
    padding: 1rem;
}

.intent-badge {
    background: var(--primary-color);
    color: white;
    padding: 0.2rem 0.5rem;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 500;
    margin-right: 0.5rem;
}

code {
    background: var(--card-color);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
}

.user-avatar {
    width: 40px;
    height: 40px;
    background: var(--gradient-primary);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    color: white;
    flex-shrink: 0;
    box-shadow: var(--shadow-md);
}
`;

// Inject additional CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalCSS;
document.head.appendChild(styleSheet);