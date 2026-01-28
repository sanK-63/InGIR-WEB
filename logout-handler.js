// ===== ОБРАБОТЧИК ВЫХОДА ИЗ СИСТЕМЫ =====

const LogoutHandler = {
    // Инициализация
    init() {
        console.log("🔧 Инициализирую обработчик выхода...");
        this.setupLogoutButtons();
        this.setupEventListeners();
    },
    
    // Настройка кнопок выхода
    setupLogoutButtons() {
        // Обработка всех кнопок выхода на странице
        document.addEventListener('click', (e) => {
            const logoutBtn = e.target.closest('#logout-btn, .logout-btn, .logout-btn-profile, .dropdown-item.logout');
            
            if (logoutBtn) {
                e.preventDefault();
                e.stopPropagation();
                this.performLogout();
            }
        });
        
        // Также ищем кнопки при загрузке
        setTimeout(() => {
            const logoutButtons = document.querySelectorAll('#logout-btn, .logout-btn, .logout-btn-profile, [data-action="logout"]');
            
            logoutButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.performLogout();
                });
            });
        }, 1000);
    },
    
    // Выполнение выхода
    async performLogout() {
        // Показываем подтверждение
        if (!confirm('Вы уверены, что хотите выйти из системы?')) {
            return;
        }
        
        // Показываем индикатор загрузки
        this.showLoading('Выход из системы...');
        
        try {
            // 1. Пытаемся выйти из Supabase
            await this.signOutFromSupabase();
            
            // 2. Очищаем локальное хранилище
            this.clearLocalStorage();
            
            // 3. Уведомляем UserProfile
            this.notifyUserProfile();
            
            // 4. Показываем успешное сообщение
            this.showSuccessMessage();
            
            // 5. Перенаправляем на главную
            setTimeout(() => {
                this.redirectToHome();
            }, 1500);
            
        } catch (error) {
            console.error("❌ Ошибка выхода:", error);
            this.showErrorMessage();
        } finally {
            this.hideLoading();
        }
    },
    
    // Выход из Supabase
    async signOutFromSupabase() {
        if (window.supabase) {
            try {
                const supabase = window.supabase.createClient(
                    "https://jacoyuuictmjascjqqpq.supabase.co",
                    "sb_publishable_N-2xmPcg8a4NAofPW6dqxA_zfdLSJ9O"
                );
                
                const { error } = await supabase.auth.signOut();
                
                if (error) {
                    console.warn("⚠️ Ошибка выхода из Supabase:", error);
                    // Продолжаем даже при ошибке
                } else {
                    console.log("✅ Успешный выход из Supabase");
                }
            } catch (supabaseError) {
                console.warn("⚠️ Не удалось подключиться к Supabase:", supabaseError);
            }
        }
    },
    
    // Очистка localStorage
    clearLocalStorage() {
        try {
            const keys = [
                'ingirpro_user_session',
                'sb-jacoyuuictmjascjqqpq-auth-token',
                'sb-jacoyuuictmjascjqqpq-auth-token-expires-at'
            ];
            
            keys.forEach(key => {
                localStorage.removeItem(key);
            });
            
            console.log("✅ localStorage очищен");
        } catch (error) {
            console.warn("⚠️ Не удалось очистить localStorage:", error);
        }
    },
    
    // Уведомление UserProfile
    notifyUserProfile() {
        // Отправляем сообщение
        window.postMessage({
            type: 'USER_LOGOUT'
        }, '*');
        
        // Вызываем метод UserProfile если доступен
        if (window.UserProfile && window.UserProfile.logout) {
            window.UserProfile.logout();
        }
    },
    
    // Показ сообщения об успехе
    showSuccessMessage() {
        const notification = document.createElement('div');
        notification.className = 'logout-success-message';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 255, 157, 0.1);
            border: 1px solid var(--accent-green);
            color: var(--accent-green);
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>Вы успешно вышли из системы</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },
    
    // Показ сообщения об ошибке
    showErrorMessage() {
        alert('Произошла ошибка при выходе из системы. Попробуйте обновить страницу и попробовать снова.');
    },
    
    // Показ индикатора загрузки
    showLoading(message) {
        // Создаем оверлей
        const overlay = document.createElement('div');
        overlay.id = 'logout-loading-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            backdrop-filter: blur(5px);
        `;
        
        // Создаем спиннер
        const spinner = document.createElement('div');
        spinner.style.cssText = `
            text-align: center;
            color: white;
        `;
        
        spinner.innerHTML = `
            <div style="width: 50px; height: 50px; border: 3px solid rgba(255,255,255,0.3); 
                        border-top-color: var(--accent-blue); border-radius: 50%; 
                        animation: spin 1s linear infinite; margin: 0 auto 15px;"></div>
            <p>${message || 'Обработка...'}</p>
        `;
        
        overlay.appendChild(spinner);
        document.body.appendChild(overlay);
        
        // Добавляем стили для анимации если их нет
        if (!document.querySelector('#logout-spinner-styles')) {
            const style = document.createElement('style');
            style.id = 'logout-spinner-styles';
            style.textContent = `
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
    },
    
    // Скрытие индикатора загрузки
    hideLoading() {
        const overlay = document.getElementById('logout-loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    },
    
    // Перенаправление на главную
    redirectToHome() {
        const currentPage = window.location.pathname.split('/').pop();
        
        // Не перенаправляем если уже на главной или странице авторизации
        if (currentPage === 'index.html' || currentPage === '' || currentPage === 'index-Auth.html') {
            return;
        }
        
        window.location.href = 'index.html';
    },
    
    // Настройка слушателей событий
    setupEventListeners() {
        // Слушаем сообщения о необходимости выхода
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'USER_LOGOUT') {
                this.performLogout();
            }
        });
    }
};

// Автоматическая инициализация
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        LogoutHandler.init();
    });
} else {
    LogoutHandler.init();
}