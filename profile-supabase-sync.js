// ===== СИНХРОНИЗАЦИЯ ПРОФИЛЯ С SUPABASE =====

const ProfileSupabaseSync = {
    supabase: null,
    
    init() {
        // Проверяем, инициализирован ли Supabase
        if (window.supabase && window.UserProfile) {
            this.supabase = window.supabase.createClient(
                "https://jacoyuuictmjascjqqpq.supabase.co",
                "sb_publishable_N-2xmPcg8a4NAofPW6dqxA_zfdLSJ9O"
            );
            
            this.setupAuthListener();
            this.syncUserData();
        }
    },
    
    // Слушатель изменения состояния аутентификации
    setupAuthListener() {
        if (!this.supabase) return;
        
        this.supabase.auth.onAuthStateChange((event, session) => {
            console.log("🔐 Состояние аутентификации изменилось:", event);
            
            if (event === 'SIGNED_IN' && session?.user) {
                this.loadUserProfile(session.user);
            } else if (event === 'SIGNED_OUT') {
                UserProfile.logout();
            }
        });
    },
    
    // Загрузка профиля пользователя
    async loadUserProfile(user) {
        try {
            const { data: profile, error } = await this.supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();
            
            if (error) throw error;
            
            const userData = {
                id: user.id,
                email: user.email,
                name: profile.username || user.email.split('@')[0],
                subscription: {
                    active: profile.subscription_active || false,
                    type: profile.subscription_type || 'Бесплатная',
                    until: profile.subscription_until,
                    isExpired: profile.subscription_until ? 
                        new Date(profile.subscription_until) < new Date() : true
                }
            };
            
            // Обновляем профиль
            UserProfile.handleUserLogin(userData);
            
        } catch (error) {
            console.error("❌ Ошибка загрузки профиля:", error);
        }
    },
    
    // Синхронизация данных пользователя
    async syncUserData() {
        // Если пользователь уже авторизован в UserProfile, но нет в Supabase
        if (UserProfile.isUserLoggedIn() && !this.supabase.auth.getUser()) {
            const userData = UserProfile.getUserData();
            
            // Проверяем подписку
            if (userData.subscription) {
                this.checkSubscriptionStatus(userData);
            }
        }
        
        // Если пользователь авторизован в Supabase, обновляем UserProfile
        const { data: { user } } = await this.supabase.auth.getUser();
        if (user && !UserProfile.isUserLoggedIn()) {
            this.loadUserProfile(user);
        }
    },
    
    // Проверка статуса подписки
    async checkSubscriptionStatus(userData) {
        try {
            const { data: profile, error } = await this.supabase
                .from("profiles")
                .select("subscription_active, subscription_until")
                .eq("id", userData.id)
                .single();
            
            if (!error && profile) {
                const isActive = profile.subscription_active;
                const until = profile.subscription_until;
                const isExpired = until ? new Date(until) < new Date() : true;
                
                // Обновляем данные подписки в профиле
                UserProfile.updateUserData({
                    subscription: {
                        ...userData.subscription,
                        active: isActive && !isExpired,
                        until: until,
                        isExpired: isExpired
                    }
                });
                
                // Если подписка неактивна, показываем уведомление
                if (!isActive || isExpired) {
                    this.showSubscriptionWarning();
                }
            }
        } catch (error) {
            console.error("❌ Ошибка проверки подписки:", error);
        }
    },
    
    // Показ предупреждения о подписке
    showSubscriptionWarning() {
        if (document.querySelector('.subscription-warning')) return;
        
        const warning = document.createElement('div');
        warning.className = 'subscription-warning';
        warning.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(45deg, var(--accent-pink), var(--accent-purple));
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(255, 46, 142, 0.3);
            z-index: 1000;
            animation: slideInRight 0.5s ease-out;
            max-width: 300px;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        
        warning.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="font-size: 20px;"></i>
            <div>
                <strong>Подписка неактивна</strong>
                <p style="margin-top: 5px; font-size: 12px;">Для полного доступа требуется активировать подписку</p>
            </div>
            <button onclick="window.location.href='pay.html'" 
                    style="margin-left: auto; background: white; color: var(--accent-pink); 
                           border: none; border-radius: 5px; padding: 5px 10px; 
                           font-size: 12px; font-weight: bold; cursor: pointer;">
                Активировать
            </button>
        `;
        
        document.body.appendChild(warning);
        
        // Автоматическое скрытие через 10 секунд
        setTimeout(() => {
            warning.style.animation = 'slideOutRight 0.5s ease-out forwards';
            setTimeout(() => warning.remove(), 500);
        }, 10000);
        
        // Добавляем стили для анимации
        if (!document.querySelector('#subscription-warning-styles')) {
            const style = document.createElement('style');
            style.id = 'subscription-warning-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
};

// Автоматическая инициализация
document.addEventListener('DOMContentLoaded', () => {
    ProfileSupabaseSync.init();
});