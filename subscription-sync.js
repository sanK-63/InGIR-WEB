// ===== СИНХРОНИЗАЦИЯ ПОДПИСКИ В РЕАЛЬНОМ ВРЕМЕНИ =====

const SubscriptionSync = {
    supabase: null,
    syncInterval: null,
    lastSyncTime: null,
    
    // Инициализация
    init() {
        console.log("🔄 Инициализирую синхронизацию подписки...");
        
        // Создаем клиент Supabase
        this.supabase = window.supabase.createClient(
            "https://jacoyuuictmjascjqqpq.supabase.co",
            "sb_publishable_N-2xmPcg8a4NAofPW6dqxA_zfdLSJ9O"
        );
        
        // Настраиваем синхронизацию
        this.setupSync();
        
        console.log("✅ Синхронизация подписки готова");
    },
    
    // Настройка синхронизации
    setupSync() {
        // 1. Проверяем подписку при загрузке
        this.checkSubscriptionImmediately();
        
        // 2. Периодическая проверка (каждые 2 минуты)
        this.syncInterval = setInterval(() => {
            this.checkSubscription();
        }, 2 * 60 * 1000);
        
        // 3. Проверка при фокусе вкладки
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkSubscription();
            }
        });
        
        // 4. Проверка при возвращении онлайн
        window.addEventListener('online', () => {
            this.checkSubscription();
        });
    },
    
    // Немедленная проверка подписки
    async checkSubscriptionImmediately() {
        const user = await this.getCurrentUser();
        if (user) {
            await this.updateSubscriptionFromServer(user.id);
        }
    },
    
    // Получение текущего пользователя
    async getCurrentUser() {
        try {
            const { data: { user }, error } = await this.supabase.auth.getUser();
            if (error) throw error;
            return user;
        } catch (error) {
            console.warn("⚠️ Не удалось получить пользователя:", error);
            return null;
        }
    },
    
    // Основная проверка подписки
    async checkSubscription() {
        try {
            const user = await this.getCurrentUser();
            if (!user) return;
            
            console.log("🔍 Проверяю статус подписки...");
            
            const subscription = await this.updateSubscriptionFromServer(user.id);
            
            if (subscription) {
                this.lastSyncTime = new Date();
                console.log("✅ Подписка синхронизирована:", subscription);
            }
            
        } catch (error) {
            console.error("❌ Ошибка синхронизации подписки:", error);
        }
    },
    
    // Запрос обновленных данных с сервера
    async updateSubscriptionFromServer(userId) {
        try {
            console.log("📡 Запрашиваю данные подписки для пользователя:", userId);
            
            const { data: profile, error } = await this.supabase
                .from('profiles')
                .select(`
                    subscription_active,
                    subscription_until,
                    subscription_type,
                    subscription_tier
                `)
                .eq('id', userId)
                .single();
            
            if (error) {
                console.error("❌ Ошибка запроса подписки:", error);
                return null;
            }
            
            console.log("📋 Получены данные подписки:", profile);
            
            // Формируем данные подписки
            const subscriptionData = {
                active: profile.subscription_active || false,
                type: profile.subscription_type || 'Бесплатная',
                tier: profile.subscription_tier || 'free',
                until: profile.subscription_until,
                isExpired: profile.subscription_until ? 
                    new Date(profile.subscription_until) < new Date() : true
            };
            
            // Обновляем локальное состояние
            await this.updateLocalSubscription(userId, subscriptionData);
            
            // Отправляем событие об обновлении
            this.dispatchSubscriptionUpdate(subscriptionData);
            
            return subscriptionData;
            
        } catch (error) {
            console.error("❌ Критическая ошибка обновления подписки:", error);
            return null;
        }
    },
    
    // Обновление локальных данных
    async updateLocalSubscription(userId, subscriptionData) {
        try {
            // 1. Обновляем UserProfile если доступен
            if (window.UserProfile && window.UserProfile.updateUserData) {
                window.UserProfile.updateUserData({
                    subscription: subscriptionData
                });
            }
            
            // 2. Обновляем localStorage
            const sessionKey = 'ingirpro_user_session';
            const session = localStorage.getItem(sessionKey);
            
            if (session) {
                const sessionData = JSON.parse(session);
                sessionData.userData.subscription = subscriptionData;
                localStorage.setItem(sessionKey, JSON.stringify(sessionData));
                console.log("💾 localStorage обновлен");
            }
            
            // 3. Отправляем сообщение другим вкладкам
            window.postMessage({
                type: 'SUBSCRIPTION_UPDATED',
                userId: userId,
                subscription: subscriptionData,
                timestamp: new Date().toISOString()
            }, '*');
            
        } catch (error) {
            console.warn("⚠️ Ошибка обновления локальных данных:", error);
        }
    },
    
    // Отправка события об обновлении
    dispatchSubscriptionUpdate(subscriptionData) {
        const event = new CustomEvent('subscriptionChanged', {
            detail: {
                subscription: subscriptionData,
                timestamp: new Date().toISOString()
            }
        });
        
        window.dispatchEvent(event);
        
        // Также отправляем сообщение для обработки в приложении
        window.postMessage({
            type: 'SUBSCRIPTION_SYNC_UPDATE',
            subscription: subscriptionData
        }, '*');
    },
    
    // Принудительная синхронизация (можно вызвать из консоли)
    forceSync() {
        console.log("🔄 Принудительная синхронизация...");
        this.checkSubscription();
    },
    
    // Ручное обновление подписки (для отладки)
    async manualUpdate() {
        const user = await this.getCurrentUser();
        if (!user) {
            alert('Пользователь не авторизован');
            return;
        }
        
        const subscription = await this.updateSubscriptionFromServer(user.id);
        
        if (subscription) {
            alert(`Подписка обновлена:
Статус: ${subscription.active ? 'Активна' : 'Не активна'}
Тип: ${subscription.type}
Действует до: ${subscription.until || 'Не указано'}`);
        } else {
            alert('Не удалось обновить подписку');
        }
    },
    
    // Отображение статуса синхронизации
    showSyncStatus() {
        const statusDiv = document.createElement('div');
        statusDiv.id = 'sync-status';
        statusDiv.style.cssText = `
            position: fixed;
            bottom: 10px;
            left: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            z-index: 9999;
            display: none;
        `;
        
        document.body.appendChild(statusDiv);
        
        // Показываем статус при синхронизации
        window.addEventListener('subscriptionChanged', (e) => {
            statusDiv.textContent = `Подписка обновлена: ${e.detail.subscription.type}`;
            statusDiv.style.display = 'block';
            statusDiv.style.background = e.detail.subscription.active 
                ? 'rgba(0, 255, 157, 0.8)' 
                : 'rgba(255, 46, 142, 0.8)';
            
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);
        });
    },
    
    // Дебаг-режим (показывает подробные логи)
    debugMode(enable = true) {
        if (enable) {
            console.log("🐛 Режим отладки включен");
            
            // Добавляем кнопку принудительной синхронизации
            if (!document.getElementById('debug-sync-btn')) {
                const btn = document.createElement('button');
                btn.id = 'debug-sync-btn';
                btn.textContent = '🔄 Синхронизировать';
                btn.style.cssText = `
                    position: fixed;
                    bottom: 50px;
                    left: 10px;
                    background: var(--accent-blue);
                    color: white;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    z-index: 9999;
                    font-size: 12px;
                `;
                btn.onclick = () => this.manualUpdate();
                document.body.appendChild(btn);
            }
        }
    }
};

// Автоматическая инициализация
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        SubscriptionSync.init();
        SubscriptionSync.showSyncStatus();
        
        // Включаем дебаг-режим для разработки
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            SubscriptionSync.debugMode(true);
        }
    });
} else {
    SubscriptionSync.init();
    SubscriptionSync.showSyncStatus();
}

// Экспортируем для использования в консоли
window.SubscriptionSync = SubscriptionSync;

// Команды для консоли браузера:
console.log(`
📋 Команды для отладки подписки:

1. SubscriptionSync.forceSync() - принудительная синхронизация
2. SubscriptionSync.manualUpdate() - ручное обновление
3. SubscriptionSync.debugMode(true) - включить режим отладки
4. localStorage.clear() - очистить кэш (осторожно!)
5. JSON.parse(localStorage.getItem('ingirpro_user_session')) - посмотреть текущие данные
`);