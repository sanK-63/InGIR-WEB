// ===== ПРОСТАЯ СИНХРОНИЗАЦИЯ ПРОФИЛЯ =====

const ProfileSync = {
    // Инициализация
    init() {
        console.log("🔄 Инициализирую синхронизацию профиля...");
        
        // Проверяем авторизацию при загрузке
        this.checkAuthStatus();
        
        // Настраиваем слушатели
        this.setupListeners();
        
        console.log("✅ Синхронизация готова");
    },
    
    // Проверка статуса авторизации
    async checkAuthStatus() {
        try {
            // Проверяем localStorage
            const session = localStorage.getItem('ingirpro_user_session');
            if (session) {
                const data = JSON.parse(session);
                
                // Обновляем UserProfile если он есть
                if (window.UserProfile && !window.UserProfile.isUserLoggedIn()) {
                    window.UserProfile.handleUserLogin(data.userData);
                }
            }
        } catch (error) {
            console.warn("⚠️ Ошибка проверки авторизации:", error);
        }
    },
    
    // Настройка слушателей
    setupListeners() {
        // Слушаем сообщения от других скриптов
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'USER_LOGIN') {
                this.handleUserLogin(event.data);
            }
        });
        
        // Слушаем события storage
        window.addEventListener('storage', (event) => {
            if (event.key === 'ingirpro_user_session') {
                this.checkAuthStatus();
            }
        });
    },
    
    // Обработка входа пользователя
    handleUserLogin(data) {
        // Обновляем UserProfile
        if (window.UserProfile) {
            window.UserProfile.handleUserLogin(data.userData);
        }
    }
};

// Автоматическая инициализация
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ProfileSync.init();
    });
} else {
    ProfileSync.init();
}