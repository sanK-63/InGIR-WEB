// ===== МОДУЛЬ ПРОФИЛЯ ПОЛЬЗОВАТЕЛЯ (с кнопкой выхода) =====

// Конфигурация
const PROFILE_CONFIG = {
    localStorageKey: 'ingirpro_user_session',
    defaultAvatar: '<i class="fas fa-user"></i>',
    sessionTimeout: 60 * 60 * 1000, // 1 час
};

// Состояние приложения
const UserProfile = {
    isLoggedIn: false,
    userData: null,
    currentPage: window.location.pathname.split('/').pop(),
    logoutInProgress: false,
    
    // Инициализация
    init() {
        console.log("🔧 Инициализирую модуль профиля...");
        this.createProfileStyles();
        this.updateNavigation();
        this.setupEventListeners();
        
        // Асинхронно загружаем сессию
        this.loadSession().then(() => {
            console.log("✅ Модуль профиля готов");
        });
    },
    
    // Загрузка сессии из localStorage (асинхронная)
    async loadSession() {
        try {
            const savedSession = localStorage.getItem(PROFILE_CONFIG.localStorageKey);
            if (savedSession) {
                const session = JSON.parse(savedSession);
                
                // Проверяем, не истекла ли сессия
                if (session.expiresAt && Date.now() < session.expiresAt) {
                    this.isLoggedIn = true;
                    this.userData = session.userData;
                    console.log("✅ Сессия восстановлена:", this.userData.email);
                    
                    // Обновляем навигацию после загрузки
                    this.updateNavigation();
                } else {
                    // Сессия истекла
                    this.clearStorage();
                    console.log("⚠️ Сессия истекла");
                }
            }
        } catch (error) {
            console.warn("⚠️ Ошибка доступа к хранилищу:", error);
        }
    },
    
    // Сохранение сессии
    saveSession(userData) {
        try {
            const session = {
                userData: userData,
                expiresAt: Date.now() + PROFILE_CONFIG.sessionTimeout,
                createdAt: new Date().toISOString()
            };
            
            localStorage.setItem(PROFILE_CONFIG.localStorageKey, JSON.stringify(session));
            this.isLoggedIn = true;
            this.userData = userData;
            console.log("✅ Сессия сохранена");
            return true;
        } catch (error) {
            console.warn("⚠️ Не удалось сохранить сессию:", error);
            this.isLoggedIn = true;
            this.userData = userData;
            return false;
        }
    },
    
    // Очистка хранилища
    clearStorage() {
        try {
            localStorage.removeItem(PROFILE_CONFIG.localStorageKey);
            localStorage.removeItem('sb-jacoyuuictmjascjqqpq-auth-token');
        } catch (error) {
            console.warn("⚠️ Не удалось очистить хранилище:", error);
        }
    },
    
    // Выход из системы
    async logout() {
        if (this.logoutInProgress) return;
        
        this.logoutInProgress = true;
        console.log("🚪 Выход из системы...");
        
        try {
            // 1. Выход из Supabase если доступен
            if (window.supabase) {
                try {
                    const supabase = window.supabase.createClient(
                        "https://jacoyuuictmjascjqqpq.supabase.co",
                        "sb_publishable_N-2xmPcg8a4NAofPW6dqxA_zfdLSJ9O"
                    );
                    await supabase.auth.signOut();
                    console.log("✅ Выход из Supabase выполнен");
                } catch (supabaseError) {
                    console.warn("⚠️ Не удалось выйти из Supabase:", supabaseError);
                }
            }
            
            // 2. Очищаем локальное состояние
            this.isLoggedIn = false;
            this.userData = null;
            this.clearStorage();
            
            // 3. Уведомление
            this.showNotification('Вы успешно вышли из системы', 'success');
            
            // 4. Обновляем навигацию
            this.updateNavigation();
            
            // 5. Перенаправление (если нужно)
            this.redirectAfterLogout();
            
        } catch (error) {
            console.error("❌ Ошибка при выходе:", error);
            this.showNotification('Ошибка при выходе из системы', 'error');
        } finally {
            this.logoutInProgress = false;
        }
    },
    
    // Перенаправление после выхода
    redirectAfterLogout() {
        // Не перенаправляем на странице авторизации
        if (this.currentPage === 'index-Auth.html') {
            return;
        }
        
        // Перенаправляем на главную с задержкой
        setTimeout(() => {
            if (this.currentPage !== 'index.html' && this.currentPage !== '') {
                window.location.href = 'index.html';
            }
        }, 1500);
    },
    
    // Получение инициалов из имени
    getInitials(name) {
        if (!name) return '<i class="fas fa-user"></i>';
        
        const initials = name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
            
        return initials || '<i class="fas fa-user"></i>';
    },
    
    // Создание стилей для профиля
    createProfileStyles() {
        if (document.getElementById('profile-styles')) return;
        
        const styles = `
            /* Стили для мини-профиля */
            .nav-auth-container {
                position: relative;
                margin-left: auto;
            }
            
            .login-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 20px;
                background: linear-gradient(45deg, var(--accent-blue), var(--accent-purple));
                border-radius: 8px;
                color: white;
                text-decoration: none;
                font-weight: 600;
                transition: all 0.3s ease;
                border: none;
                cursor: pointer;
                font-family: 'Inter', sans-serif;
                font-size: 14px;
            }
            
            .login-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0, 212, 255, 0.3);
            }
            
            .mini-profile {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px 12px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                border: 1px solid rgba(0, 212, 255, 0.2);
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                min-width: 180px;
                animation: profileAppear 0.5s ease-out;
            }
            
            @keyframes profileAppear {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .mini-profile:hover {
                background: rgba(255, 255, 255, 0.08);
                border-color: var(--accent-blue);
                transform: translateY(-2px);
            }
            
            .user-avatar {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: linear-gradient(45deg, var(--accent-blue), var(--accent-purple));
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                color: white;
                flex-shrink: 0;
                font-weight: 600;
            }
            
            .user-info {
                display: flex;
                flex-direction: column;
                gap: 2px;
                flex-grow: 1;
                min-width: 0;
                overflow: hidden;
            }
            
            .user-name {
                font-size: 14px;
                font-weight: 600;
                color: var(--text-primary);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .user-subscription {
                font-size: 12px;
                color: var(--text-secondary);
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            .status-dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                display: inline-block;
                flex-shrink: 0;
            }
            
            .status-active {
                background-color: var(--accent-green);
                box-shadow: 0 0 6px var(--accent-green);
            }
            
            .status-inactive {
                background-color: var(--accent-pink);
                box-shadow: 0 0 6px var(--accent-pink);
            }
            
            .status-warning {
                background-color: var(--warning-color, #ffcc00);
                box-shadow: 0 0 6px var(--warning-color, #ffcc00);
            }
            
            /* Подсказка при наведении */
            .profile-tooltip {
                position: absolute;
                top: 100%;
                right: 0;
                margin-top: 10px;
                background: var(--card-bg);
                border: 1px solid var(--card-border);
                border-radius: 8px;
                padding: 12px;
                font-size: 12px;
                color: var(--text-secondary);
                width: 200px;
                z-index: 100;
                display: none;
                backdrop-filter: blur(10px);
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                pointer-events: none;
            }
            
            .mini-profile:hover .profile-tooltip {
                display: block;
                animation: tooltipFade 0.2s ease-out;
            }
            
            @keyframes tooltipFade {
                from {
                    opacity: 0;
                    transform: translateY(-5px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            /* Выпадающее меню профиля */
            .profile-dropdown {
                position: absolute;
                top: 100%;
                right: 0;
                margin-top: 10px;
                background: var(--card-bg);
                border: 1px solid var(--card-border);
                border-radius: 8px;
                min-width: 200px;
                z-index: 1000;
                backdrop-filter: blur(10px);
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                display: none;
                animation: dropdownFade 0.2s ease-out;
                overflow: hidden;
            }
            
            @keyframes dropdownFade {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .profile-dropdown.show {
                display: block;
            }
            
            .dropdown-header {
                padding: 15px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .dropdown-header .user-avatar {
                width: 40px;
                height: 40px;
                font-size: 18px;
            }
            
            .dropdown-header-info {
                flex-grow: 1;
                min-width: 0;
            }
            
            .dropdown-header-name {
                font-weight: 600;
                font-size: 14px;
                color: var(--text-primary);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .dropdown-header-email {
                font-size: 12px;
                color: var(--text-secondary);
                margin-top: 2px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .dropdown-menu {
                list-style: none;
                padding: 5px 0;
            }
            
            .dropdown-item {
                padding: 10px 15px;
                display: flex;
                align-items: center;
                gap: 10px;
                color: var(--text-secondary);
                cursor: pointer;
                transition: all 0.2s ease;
                text-decoration: none;
                border: none;
                background: none;
                width: 100%;
                text-align: left;
                font-family: 'Inter', sans-serif;
                font-size: 14px;
            }
            
            .dropdown-item:hover {
                background: rgba(255, 255, 255, 0.05);
                color: var(--text-primary);
            }
            
            .dropdown-item.logout {
                color: var(--accent-pink);
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                margin-top: 5px;
            }
            
            .dropdown-item.logout:hover {
                background: rgba(255, 46, 142, 0.1);
            }
            
            /* Кнопка выхода в приложении */
            .logout-btn-profile {
                width: 100%;
                padding: 12px;
                background: rgba(255, 46, 142, 0.1);
                border: 1px solid var(--accent-pink);
                border-radius: 8px;
                color: var(--accent-pink);
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                margin-top: 20px;
                font-family: 'Inter', sans-serif;
            }
            
            .logout-btn-profile:hover {
                background: rgba(255, 46, 142, 0.2);
                transform: translateY(-2px);
            }
            
            /* Уведомления */
            .profile-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                font-size: 14px;
                z-index: 10000;
                animation: notificationSlide 0.3s ease-out;
                display: flex;
                align-items: center;
                gap: 10px;
                max-width: 300px;
            }
            
            @keyframes notificationSlide {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            .notification-success {
                background: rgba(0, 255, 157, 0.1);
                border: 1px solid var(--accent-green);
                color: var(--accent-green);
            }
            
            .notification-error {
                background: rgba(255, 46, 142, 0.1);
                border: 1px solid var(--accent-pink);
                color: var(--accent-pink);
            }
            
            .notification-info {
                background: rgba(0, 212, 255, 0.1);
                border: 1px solid var(--accent-blue);
                color: var(--accent-blue);
            }
            
            /* Адаптивность */
            @media (max-width: 768px) {
                .mini-profile {
                    min-width: auto;
                    padding: 8px;
                }
                
                .user-info {
                    display: none;
                }
                
                .profile-dropdown {
                    min-width: 180px;
                    right: -20px;
                }
            }
        `;
        
        const styleElement = document.createElement('style');
        styleElement.id = 'profile-styles';
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    },
    
    // Обновление навигации
    updateNavigation() {
        // Даем время DOM обновиться
        setTimeout(() => {
            // Находим контейнер для авторизации в навигации
            let authContainer = document.querySelector('.nav-auth-container');
            
            // Если контейнера нет, создаем его
            if (!authContainer) {
                const nav = document.querySelector('.nav-container') || 
                           document.querySelector('.nav') ||
                           document.querySelector('.app-header') ||
                           document.querySelector('nav');
                
                if (!nav) {
                    console.warn("⚠️ Навигация не найдена");
                    return;
                }
                
                // Ищем существующую кнопку входа
                let existingLoginBtn = nav.querySelector('.login-btn') || 
                                       nav.querySelector('a[href*="Auth"]') ||
                                       nav.querySelector('a[href*="login"]') ||
                                       nav.querySelector('.btn[href*="Auth"]') ||
                                       nav.querySelector('.btn-secondary');
                
                // Если это ссылка, а не кнопка
                if (!existingLoginBtn) {
                    // Ищем по тексту
                    const allLinks = nav.querySelectorAll('a, button');
                    existingLoginBtn = Array.from(allLinks).find(el => 
                        el.textContent.includes('Войти') || 
                        el.textContent.includes('Вход') ||
                        (el.href && el.href.includes('Auth'))
                    );
                }
                
                authContainer = document.createElement('div');
                authContainer.className = 'nav-auth-container';
                
                if (existingLoginBtn && existingLoginBtn.parentElement) {
                    existingLoginBtn.parentElement.replaceChild(authContainer, existingLoginBtn);
                } else {
                    // Добавляем в конец навигации
                    nav.appendChild(authContainer);
                }
            }
            
            // Очищаем контейнер
            authContainer.innerHTML = '';
            
            if (this.isLoggedIn && this.userData) {
                // Создаем мини-профиль с выпадающим меню
                this.createMiniProfileWithDropdown(authContainer);
            } else {
                // Создаем кнопку входа
                this.createLoginButton(authContainer);
            }
            
            // Также обновляем кнопку выхода в приложении если есть
            this.updateAppLogoutButton();
            
        }, 100);
    },
    
    // Создание кнопки входа
    createLoginButton(container) {
        const loginBtn = document.createElement('a');
        loginBtn.href = 'index-Auth.html';
        loginBtn.className = 'login-btn';
        loginBtn.innerHTML = `
            <i class="fas fa-sign-in-alt"></i>
            <span>Войти</span>
        `;
        
        container.appendChild(loginBtn);
    },
    
    // Создание мини-профиля с выпадающим меню
    createMiniProfileWithDropdown(container) {
        const profileWrapper = document.createElement('div');
        profileWrapper.className = 'profile-wrapper';
        profileWrapper.style.position = 'relative';
        
        // Создаем сам мини-профиль
        const profile = this.createMiniProfileElement();
        profileWrapper.appendChild(profile);
        
        // Создаем выпадающее меню
        const dropdown = this.createDropdownMenu();
        profileWrapper.appendChild(dropdown);
        
        // Показываем/скрываем меню при клике
        profile.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });
        
        // Закрываем меню при клике вне его
        document.addEventListener('click', (e) => {
            if (!profileWrapper.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
        
        container.appendChild(profileWrapper);
    },
    
    // Создание элемента мини-профиля
    createMiniProfileElement() {
        const profile = document.createElement('div');
        profile.className = 'mini-profile';
        if (this.userData.id) {
            profile.setAttribute('data-user-id', this.userData.id);
        }
        
        // Аватар с инициалами
        const initials = this.getInitials(this.userData.name);
        const avatar = document.createElement('div');
        avatar.className = 'user-avatar';
        avatar.innerHTML = initials;
        
        // Информация о пользователе
        const userInfo = document.createElement('div');
        userInfo.className = 'user-info';
        
        const userName = document.createElement('div');
        userName.className = 'user-name';
        userName.textContent = this.userData.name || this.userData.email || 'Пользователь';
        
        const subscriptionInfo = document.createElement('div');
        subscriptionInfo.className = 'user-subscription';
        
        const statusDot = document.createElement('span');
        statusDot.className = 'status-dot';
        
        const statusText = document.createElement('span');
        
        // Определяем статус подписки
        if (this.userData.subscription) {
            if (this.userData.subscription.active && !this.userData.subscription.isExpired) {
                statusDot.classList.add('status-active');
                statusText.textContent = this.userData.subscription.type || 'Pro';
            } else if (this.userData.subscription.isExpired && this.userData.subscription.until) {
                statusDot.classList.add('status-warning');
                statusText.textContent = 'Истекла';
            } else {
                statusDot.classList.add('status-inactive');
                statusText.textContent = 'Не активна';
            }
        } else {
            statusDot.classList.add('status-inactive');
            statusText.textContent = 'Не активна';
        }
        
        subscriptionInfo.appendChild(statusDot);
        subscriptionInfo.appendChild(statusText);
        
        userInfo.appendChild(userName);
        userInfo.appendChild(subscriptionInfo);
        
        // Иконка стрелочки
        const arrowIcon = document.createElement('i');
        arrowIcon.className = 'fas fa-chevron-down';
        arrowIcon.style.fontSize = '12px';
        arrowIcon.style.color = 'var(--text-secondary)';
        
        // Собираем профиль
        profile.appendChild(avatar);
        profile.appendChild(userInfo);
        profile.appendChild(arrowIcon);
        
        return profile;
    },
    
    // Создание выпадающего меню
    createDropdownMenu() {
        const dropdown = document.createElement('div');
        dropdown.className = 'profile-dropdown';
        
        // Заголовок меню
        const header = document.createElement('div');
        header.className = 'dropdown-header';
        
        const avatar = document.createElement('div');
        avatar.className = 'user-avatar';
        avatar.innerHTML = this.getInitials(this.userData.name);
        
        const headerInfo = document.createElement('div');
        headerInfo.className = 'dropdown-header-info';
        
        const headerName = document.createElement('div');
        headerName.className = 'dropdown-header-name';
        headerName.textContent = this.userData.name || this.userData.email || 'Пользователь';
        
        const headerEmail = document.createElement('div');
        headerEmail.className = 'dropdown-header-email';
        headerEmail.textContent = this.userData.email || '';
        
        headerInfo.appendChild(headerName);
        headerInfo.appendChild(headerEmail);
        header.appendChild(avatar);
        header.appendChild(headerInfo);
        
        // Меню
        const menu = document.createElement('ul');
        menu.className = 'dropdown-menu';
        
        // Пункты меню
        const menuItems = [
            {
                icon: 'fas fa-user-cog',
                text: 'Настройки профиля',
                action: () => this.openProfilePage()
            },
            {
                icon: 'fas fa-crown',
                text: 'Моя подписка',
                action: () => this.openSubscriptionPage()
            },
            {
                icon: 'fas fa-question-circle',
                text: 'Помощь',
                action: () => this.openHelpPage()
            },
            {
                icon: 'fas fa-sign-out-alt',
                text: 'Выйти',
                action: () => this.logout(),
                className: 'logout'
            }
        ];
        
        menuItems.forEach(item => {
            const li = document.createElement('li');
            const button = document.createElement('button');
            button.className = `dropdown-item ${item.className || ''}`;
            button.innerHTML = `
                <i class="${item.icon}"></i>
                <span>${item.text}</span>
            `;
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.remove('show');
                if (item.action) item.action();
            });
            li.appendChild(button);
            menu.appendChild(li);
        });
        
        dropdown.appendChild(header);
        dropdown.appendChild(menu);
        
        return dropdown;
    },
    
    // Обновление кнопки выхода в приложении
    updateAppLogoutButton() {
        // Находим кнопку выхода в app.html
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
        
        // Также обновляем кнопку в dashboard.html если есть
        const dashboardLogoutBtn = document.querySelector('.logout-btn');
        if (dashboardLogoutBtn && dashboardLogoutBtn.id !== 'logout-btn') {
            dashboardLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    },
    
    // Открытие страницы профиля
    openProfilePage() {
        // Определяем, куда перенаправлять
        if (this.currentPage === 'app.html') {
            // В приложении открываем панель настроек
            const settingsBtn = document.querySelector('[data-panel="settings"]');
            if (settingsBtn) {
                settingsBtn.click();
                setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 300);
            }
        } else if (this.currentPage === 'dashboard.html') {
            // На дашборде остаемся там же
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            // На других страницах переходим в приложение
            window.location.href = 'app.html';
        }
    },
    
    // Открытие страницы подписки
    openSubscriptionPage() {
        if (this.currentPage === 'app.html') {
            // В приложении показываем информацию о подписке
            const subscriptionCard = document.querySelector('.status-card');
            if (subscriptionCard) {
                subscriptionCard.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            window.location.href = 'app.html';
        }
    },
    
    // Открытие страницы помощи
    openHelpPage() {
        if (window.openSupport) {
            window.openSupport();
        } else {
            window.open('mailto:support@ingirpro.com', '_blank');
        }
    },
    
    // Настройка обработчиков событий
    setupEventListeners() {
        // Обработка сообщений от других скриптов
        window.addEventListener('message', (event) => {
            try {
                if (event.data.type === 'USER_LOGIN') {
                    this.handleUserLogin(event.data.userData);
                } else if (event.data.type === 'USER_LOGOUT') {
                    this.logout();
                } else if (event.data.type === 'UPDATE_SUBSCRIPTION') {
                    this.updateUserData({ subscription: event.data.subscription });
                }
            } catch (error) {
                console.warn("⚠️ Ошибка обработки сообщения:", error);
            }
        });
        
        // Также слушаем события storage для синхронизации между вкладками
        window.addEventListener('storage', (event) => {
            if (event.key === PROFILE_CONFIG.localStorageKey) {
                this.loadSession();
            }
        });
    },
    
    // Обработка входа пользователя
    handleUserLogin(userData) {
        console.log("👤 Пользователь вошел:", userData);
        this.saveSession(userData);
        this.updateNavigation();
        this.showNotification('Добро пожаловать!', 'success');
    },
    
    // Показ уведомления
    showNotification(message, type = 'info') {
        // Удаляем предыдущее уведомление
        const existingNotification = document.querySelector('.profile-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `profile-notification notification-${type}`;
        
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        
        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Автоматическое скрытие
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },
    
    // API для других скриптов
    getUserData() {
        return this.userData;
    },
    
    isUserLoggedIn() {
        return this.isLoggedIn;
    },
    
    updateUserData(newData) {
        if (this.userData) {
            this.userData = { ...this.userData, ...newData };
            this.saveSession(this.userData);
            this.updateNavigation();
            return true;
        }
        return false;
    }
};

// Экспортируем для использования в других файлах
window.UserProfile = UserProfile;

// Автоматическая инициализация при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        UserProfile.init();
    });
} else {
    UserProfile.init();
}