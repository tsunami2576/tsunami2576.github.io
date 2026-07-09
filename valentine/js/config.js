/**
 * Configuration Management
 * Handles GitHub authentication and app settings
 */
const Config = {
    // Storage keys
    STORAGE_KEY: 'valentine_config',
    
    // Default read-only configuration (for viewing photos)
    DEFAULT_CONFIG: {
        username: 'tsunami2576',
        repo: 'tsunami2576.github.io',
        photoPath: 'valentine/assets/photos',
        token: null // No token for read-only mode
    },
    
    // Configuration state
    config: null,
    
    /**
     * Initialize configuration module
     */
    init() {
        this.loadConfig();
        this.attachEventHandlers();
    },
    
    /**
     * Load configuration from localStorage
     */
    loadConfig() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                this.config = JSON.parse(stored);
                // Decrypt token if needed (Unicode-safe encoding)
                if (this.config.token) {
                    this.config.token = this.base64Decode(this.config.token);
                }
            } else {
                // Use default config if nothing stored
                this.config = { ...this.DEFAULT_CONFIG };
            }
        } catch (error) {
            console.error('Failed to load config:', error);
            // Fallback to default config
            this.config = { ...this.DEFAULT_CONFIG };
        }
    },
    
    /**
     * Save configuration to localStorage
     */
    saveConfig(configData) {
        try {
            // Encode token for storage (Unicode-safe encoding)
            const toStore = {
                ...configData,
                token: this.base64Encode(configData.token)
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(toStore));
            this.config = configData;
            return true;
        } catch (error) {
            console.error('Failed to save config:', error);
            return false;
        }
    },
    
    /**
     * Unicode-safe Base64 encode
     */
    base64Encode(str) {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
            function(match, p1) {
                return String.fromCharCode('0x' + p1);
            }));
    },
    
    /**
     * Unicode-safe Base64 decode
     */
    base64Decode(str) {
        return decodeURIComponent(atob(str).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    },
    
    /**
     * Check if app is configured
     */
    isConfigured() {
        return this.config && 
               this.config.username && 
               this.config.repo;
    },
    
    /**
     * Check if user has upload permission (has token)
     */
    canUpload() {
        return this.config && this.config.token;
    },
    
    /**
     * Get current configuration
     */
    getConfig() {
        return this.config;
    },
    
    /**
     * Show configuration modal
     */
    showConfigModal() {
        const modal = document.getElementById('configModal');
        modal.classList.remove('hidden');
        
        // Pre-fill form if config exists
        if (this.config) {
            document.getElementById('githubUsername').value = this.config.username || '';
            document.getElementById('githubRepo').value = this.config.repo || '';
            document.getElementById('photoPath').value = this.config.photoPath || 'valentine/assets/photos';
            // Don't pre-fill token for security
        }
    },
    
    /**
     * Hide configuration modal
     */
    hideConfigModal() {
        const modal = document.getElementById('configModal');
        modal.classList.add('hidden');
        this.clearStatusMessage();
    },
    
    /**
     * Show status message in modal
     */
    showStatusMessage(message, type = 'info') {
        const statusEl = document.getElementById('configStatus');
        statusEl.textContent = message;
        statusEl.className = 'status-message ' + type;
        statusEl.classList.remove('hidden');
    },
    
    /**
     * Clear status message
     */
    clearStatusMessage() {
        const statusEl = document.getElementById('configStatus');
        statusEl.classList.add('hidden');
    },
    
    /**
     * Attach event handlers
     */
    attachEventHandlers() {
        // Settings button
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showConfigModal();
        });
        
        // Test connection button
        document.getElementById('testConnection').addEventListener('click', () => {
            this.testConnection();
        });
        
        // Save config button
        document.getElementById('saveConfig').addEventListener('click', () => {
            this.handleSaveConfig();
        });
        
        // Close modal on backdrop click
        document.getElementById('configModal').addEventListener('click', (e) => {
            if (e.target.id === 'configModal') {
                this.hideConfigModal();
            }
        });
    },
    
    /**
     * Test GitHub connection
     */
    async testConnection() {
        const username = document.getElementById('githubUsername').value.trim();
        const repo = document.getElementById('githubRepo').value.trim();
        const token = document.getElementById('githubToken').value.trim();
        
        if (!username || !repo || !token) {
            this.showStatusMessage('请填写所有必要字段', 'error');
            return;
        }
        
        this.showStatusMessage('正在测试连接...', 'info');
        
        try {
            // Test API access by fetching repo info
            const response = await fetch(`https://api.github.com/repos/${username}/${repo}`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                this.showStatusMessage('✓ 连接成功！', 'success');
            } else if (response.status === 404) {
                this.showStatusMessage('仓库不存在或无权访问', 'error');
            } else if (response.status === 401) {
                this.showStatusMessage('Token 无效或已过期', 'error');
            } else {
                this.showStatusMessage(`连接失败 (${response.status})`, 'error');
            }
        } catch (error) {
            this.showStatusMessage('网络错误，请检查连接', 'error');
            console.error('Connection test failed:', error);
        }
    },
    
    /**
     * Handle save configuration
     */
    handleSaveConfig() {
        const username = document.getElementById('githubUsername').value.trim();
        const repo = document.getElementById('githubRepo').value.trim();
        const token = document.getElementById('githubToken').value.trim();
        const photoPath = document.getElementById('photoPath').value.trim();
        
        if (!username || !repo || !token) {
            this.showStatusMessage('请填写所有必要字段', 'error');
            return;
        }
        
        const configData = {
            username,
            repo,
            token,
            photoPath: photoPath || 'valentine/assets/photos'
        };
        
        if (this.saveConfig(configData)) {
            this.showStatusMessage('✓ 配置已保存！', 'success');
            
            // Close modal and reload photos after a short delay
            setTimeout(() => {
                this.hideConfigModal();
                if (window.PhotoManager) {
                    PhotoManager.loadPhotos();
                }
            }, 1000);
        } else {
            this.showStatusMessage('保存配置失败', 'error');
        }
    }
};
