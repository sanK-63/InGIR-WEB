// ===== ВСЁ В ОДНОМ ФАЙЛЕ =====

// 1. SUPABASE (объявляем только один раз)
let supabaseClient = null;
let isProcessing = false; // Защита от двойного клика

// 2. ИНИЦИАЛИЗАЦИЯ ВСЕГО ПРИ ЗАГРУЗКЕ
document.addEventListener('DOMContentLoaded', function() {
    console.log("✅ Страница загружена");
    
    // Инициализируем Supabase
    initSupabase();
    
    // Инициализируем частицы
    initParticles();
    
    // Настраиваем формы
    setupForms();
});

// 3. SUPABASE ИНИЦИАЛИЗАЦИЯ
function initSupabase() {
    try {
        if (!window.supabase) {
            console.error("❌ Supabase библиотека не загружена");
            return;
        }
        
        const SUPABASE_URL = "https://jacoyuuictmjascjqqpq.supabase.co";
        const SUPABASE_KEY = "sb_publishable_N-2xmPcg8a4NAofPW6dqxA_zfdLSJ9O";
        
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log("✅ Supabase клиент создан");
        
        // Проверяем существующую сессию
        checkExistingSession();
        
    } catch (error) {
        console.error("❌ Ошибка инициализации Supabase:", error);
    }
}

// 4. Проверка существующей сессии
async function checkExistingSession() {
    if (!supabaseClient) return;
    
    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
            console.log("✅ Существующая сессия найдена");
            
            // Загружаем профиль пользователя
            await loadUserProfile(session.user);
            
            // Если мы на странице авторизации, перенаправляем
            const currentPage = window.location.pathname.split('/').pop();
            if (currentPage === 'index-Auth.html') {
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            }
        }
    } catch (error) {
        console.warn("⚠️ Ошибка проверки сессии:", error);
    }
}

// 5. PARTICLES (всё в одном месте)
function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) {
        console.log("⚠️ Canvas не найден, пропускаем частицы");
        return;
    }
    
    const ctx = canvas.getContext('2d');
    let particles = [];
    const mouse = { x: 0, y: 0, radius: 100 };
    
    // Функции для частиц
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        createParticles();
    }
    
    function createParticles() {
        particles = [];
        const particleCount = Math.floor((canvas.width * canvas.height) / 15000);
        
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 0.5,
                speedX: Math.random() * 0.5 - 0.25,
                speedY: Math.random() * 0.5 - 0.25,
                color: getRandomColor(),
                opacity: Math.random() * 0.5 + 0.3,
                connectionDistance: 100
            });
        }
    }
    
    function getRandomColor() {
        const colors = [
            'rgba(0, 212, 255, {opacity})',
            'rgba(157, 78, 221, {opacity})',
            'rgba(255, 46, 142, {opacity})',
            'rgba(0, 255, 157, {opacity})',
            'rgba(255, 204, 0, {opacity})'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    function updateParticles() {
        particles.forEach(particle => {
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            
            if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
            if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
            
            if (mouse.x !== undefined && mouse.y !== undefined) {
                const dx = mouse.x - particle.x;
                const dy = mouse.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < mouse.radius) {
                    const angle = Math.atan2(dy, dx);
                    const force = (mouse.radius - distance) / mouse.radius;
                    particle.x -= Math.cos(angle) * force * 2;
                    particle.y -= Math.sin(angle) * force * 2;
                }
            }
            
            particle.size += Math.sin(Date.now() * 0.001 + particle.x) * 0.05;
            particle.size = Math.max(0.5, Math.min(3, particle.size));
        });
    }
    
    function drawParticles() {
        particles.forEach(particle => {
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            const color = particle.color.replace('{opacity}', particle.opacity);
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
        });
    }
    
    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const p1 = particles[i];
                const p2 = particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < p1.connectionDistance) {
                    const opacity = 1 - (distance / p1.connectionDistance);
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    const color = p1.color.replace('{opacity}', opacity * 0.3);
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }
    
    function animate() {
        requestAnimationFrame(animate);
        ctx.fillStyle = 'rgba(10, 10, 20, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        updateParticles();
        drawParticles();
        drawConnections();
    }
    
    // Слушатели событий
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    
    canvas.addEventListener('mouseleave', () => {
        mouse.x = undefined;
        mouse.y = undefined;
    });
    
    window.addEventListener('resize', resizeCanvas);
    
    // Запуск
    resizeCanvas();
    animate();
    console.log("✅ Частицы инициализированы");
}

// 6. НАСТРОЙКА ФОРМ
function setupForms() {
    const loginForm = document.getElementById('login-form');
    
    if (loginForm) {
        // Убираем старый обработчик, если есть
        loginForm.removeEventListener('submit', handleLoginSubmit);
        // Добавляем новый
        loginForm.addEventListener('submit', handleLoginSubmit);
        console.log("✅ Форма входа настроена");
    }
    
    // Кнопка показать/скрыть пароль
    document.querySelectorAll('.password-toggle').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
    
    // Переключение между формами
    document.getElementById('login-tab')?.addEventListener('click', function() {
        switchForm('login');
    });
    
    document.getElementById('register-tab')?.addEventListener('click', function() {
        switchForm('register');
    });
    
    document.getElementById('forgot-password')?.addEventListener('click', function(e) {
        e.preventDefault();
        switchForm('reset');
    });
    
    document.querySelector('.back-btn')?.addEventListener('click', function() {
        switchForm('login');
    });
}

// 7. ОБРАБОТЧИК SUBMIT ДЛЯ ФОРМЫ
async function handleLoginSubmit(e) {
    e.preventDefault();
    
    // Защита от двойного клика
    if (isProcessing) {
        console.log("⚠️ Уже обрабатывается, пропускаем");
        return;
    }
    
    isProcessing = true;
    await handleLogin();
    isProcessing = false;
}

// 8. ПЕРЕКЛЮЧЕНИЕ ФОРМ
function switchForm(formType) {
    // Обновляем кнопки
    document.querySelectorAll('.switch-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const forms = document.querySelectorAll('.auth-form');
    forms.forEach(form => form.classList.remove('active'));
    
    const indicator = document.querySelector('.switch-indicator');
    
    if (formType === 'login') {
        document.getElementById('login-tab').classList.add('active');
        document.getElementById('login-form').classList.add('active');
        indicator.style.transform = 'translateX(0)';
        document.querySelector('.form-switcher').style.display = 'flex';
    } else if (formType === 'register') {
        document.getElementById('register-tab').classList.add('active');
        document.getElementById('register-form').classList.add('active');
        indicator.style.transform = 'translateX(100%)';
        document.querySelector('.form-switcher').style.display = 'flex';
    } else if (formType === 'reset') {
        document.getElementById('reset-form').classList.add('active');
        // Скрываем переключатель для формы сброса
        document.querySelector('.form-switcher').style.display = 'none';
    }
}

// 9. ОБРАБОТКА ВХОДА
async function handleLogin() {
    if (!supabaseClient) {
        alert("❌ Supabase не инициализирован. Обновите страницу.");
        return;
    }
    
    const email = document.getElementById('login-email')?.value;
    const password = document.getElementById('login-password')?.value;
    
    if (!email || !password) {
        alert("⚠️ Введите email и пароль");
        return;
    }
    
    const submitBtn = document.querySelector('.login-btn');
    const btnText = submitBtn?.querySelector('.btn-text');
    const loader = submitBtn?.querySelector('.btn-loader');
    
    // Показываем лоадер и блокируем кнопку
    if (submitBtn) {
        submitBtn.disabled = true;
        if (btnText) btnText.style.opacity = '0.5';
        if (loader) loader.style.display = 'inline-block';
    }
    
    try {
        console.log("🔐 Пытаюсь войти...");
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            throw error;
        }
        
        console.log("✅ Вход успешен:", data.user.email);
        
        // Создаем или обновляем профиль пользователя
        const profileResult = await createOrUpdateProfile(data.user);
        
        if (profileResult.success) {
            // Загружаем полный профиль
            await loadUserProfile(data.user);
            
            // Показываем успешное уведомление
            showNotification('Вход выполнен успешно! Перенаправляем...', 'success');
            
            // Перенаправляем на главную через 1 секунду
            setTimeout(() => {
                window.location.href = "index.html";
            }, 1000);
        } else {
            throw new Error(profileResult.error?.message || 'Ошибка создания профиля');
        }
        
    } catch (error) {
        console.error("❌ Ошибка входа:", error);
        showNotification("❌ Ошибка входа: " + error.message, 'error');
    } finally {
        // Восстанавливаем кнопку
        if (submitBtn) {
            submitBtn.disabled = false;
            if (btnText) btnText.style.opacity = '1';
            if (loader) loader.style.display = 'none';
        }
    }
}

// 10. ЗАГРУЗКА ПРОФИЛЯ ПОЛЬЗОВАТЕЛЯ
async function loadUserProfile(user) {
    try {
        console.log("🔍 Загружаю профиль пользователя:", user.id);
        
        const { data: profile, error } = await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
        
        if (error) {
            // Если профиль не найден, создаем базовый
            console.log("📋 Профиль не найден, создаю базовый...");
            return await createBasicProfile(user);
        }
        
        console.log("✅ Профиль загружен:", profile);
        
        // Подготавливаем данные пользователя для профиля
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
        
        // Сохраняем в UserProfile
        if (window.UserProfile) {
            window.UserProfile.handleUserLogin(userData);
        } else {
            // Альтернативный способ через сообщение
            window.postMessage({
                type: 'USER_LOGIN',
                userData: userData
            }, '*');
            
            // Сохраняем в localStorage как запасной вариант
            try {
                localStorage.setItem('ingirpro_user_session', JSON.stringify({
                    userData: userData,
                    expiresAt: Date.now() + (60 * 60 * 1000), // 1 час
                    createdAt: new Date().toISOString()
                }));
            } catch (e) {
                console.warn("⚠️ Не удалось сохранить в localStorage:", e);
            }
        }
        
        return { success: true, profile: profile };
        
    } catch (err) {
        console.error("❌ Ошибка загрузки профиля:", err);
        return { success: false, error: err };
    }
}

// 11. СОЗДАНИЕ БАЗОВОГО ПРОФИЛЯ
async function createBasicProfile(user) {
    try {
        const { data: newProfile, error } = await supabaseClient
            .from("profiles")
            .insert([
                {
                    id: user.id,
                    email: user.email,
                    username: user.email.split('@')[0],
                    subscription_active: false,
                    subscription_until: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ])
            .select()
            .single();
        
        if (error) throw error;
        
        console.log("✅ Базовый профиль создан:", newProfile);
        
        // Создаем данные для профиля
        const userData = {
            id: user.id,
            email: user.email,
            name: user.email.split('@')[0],
            subscription: {
                active: false,
                type: 'Бесплатная',
                until: null,
                isExpired: true
            }
        };
        
        // Сохраняем в UserProfile
        if (window.UserProfile) {
            window.UserProfile.handleUserLogin(userData);
        }
        
        return { success: true, profile: newProfile };
        
    } catch (error) {
        console.error("❌ Ошибка создания базового профиля:", error);
        return { success: false, error: error };
    }
}

// 12. СОЗДАНИЕ ИЛИ ОБНОВЛЕНИЕ ПРОФИЛЯ
async function createOrUpdateProfile(user) {
    try {
        console.log("🔍 Проверяю/создаю профиль для:", user.id);
        
        // Пытаемся получить существующий профиль
        const { data: existingProfile, error: fetchError } = await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
        
        // Если профиль не найден
        if (fetchError && fetchError.code === 'PGRST116') {
            console.log("📋 Профиль не найден, создаю новый...");
            return await createBasicProfile(user);
        }
        
        // Если другая ошибка
        if (fetchError) {
            console.error("❌ Ошибка получения профиля:", fetchError);
            return { success: false, error: fetchError };
        }
        
        // Профиль найден, обновляем email если нужно
        console.log("✅ Профиль найден:", existingProfile);
        
        if (existingProfile.email !== user.email) {
            const { data: updatedProfile, error: updateError } = await supabaseClient
                .from("profiles")
                .update({ 
                    email: user.email,
                    updated_at: new Date().toISOString()
                })
                .eq("id", user.id)
                .select()
                .single();
            
            if (updateError) {
                console.error("❌ Ошибка обновления профиля:", updateError);
                return { success: false, error: updateError };
            }
            
            console.log("✅ Профиль обновлен:", updatedProfile);
            return { success: true, profile: updatedProfile };
        }
        
        return { success: true, profile: existingProfile };
        
    } catch (err) {
        console.error("❌ Ошибка при работе с профилем:", err);
        return { success: false, error: err };
    }
}

// 13. ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ СТАТУСА ПОДПИСКИ
async function getSubscriptionStatus() {
    try {
        if (!supabaseClient) {
            return { active: false, error: "Supabase не инициализирован" };
        }
        
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        if (!user) {
            return { active: false, error: "Пользователь не авторизован" };
        }
        
        const { data: profile, error } = await supabaseClient
            .from("profiles")
            .select("subscription_active, subscription_until")
            .eq("id", user.id)
            .single();
        
        if (error) {
            return { active: false, error: error.message };
        }
        
        return {
            active: profile.subscription_active,
            until: profile.subscription_until,
            isExpired: profile.subscription_until ? new Date(profile.subscription_until) < new Date() : true
        };
        
    } catch (err) {
        console.error("❌ Ошибка получения статуса подписки:", err);
        return { active: false, error: err.message };
    }
}

// 14. ИНДИКАТОР СИСТЕМЫ
function updateSystemStatus() {
    const statusText = document.querySelector('.status-text');
    if (statusText && supabaseClient) {
        statusText.textContent = "Supabase: Онлайн";
    }
}

// 15. ФУНКЦИЯ ДЛЯ РЕГИСТРАЦИИ
async function handleRegister() {
    console.log("Регистрация пока не реализована");
    showNotification("Функция регистрации в разработке", "warning");
}

// 16. ФУНКЦИЯ ПОКАЗА УВЕДОМЛЕНИЙ
function showNotification(message, type = 'info') {
    const container = document.querySelector('.notifications-container');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    notification.innerHTML = `
        <div class="notification-header">
            <div class="notification-title">
                <i class="fas fa-${icon}"></i>
                <span>${type === 'success' ? 'Успешно' : type === 'error' ? 'Ошибка' : 'Информация'}</span>
            </div>
            <button class="notification-close">&times;</button>
        </div>
        <div class="notification-message">
            ${message}
        </div>
    `;
    
    container.appendChild(notification);
    
    // Автоматическое удаление уведомления через 5 секунд
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s ease-out forwards';
        setTimeout(() => notification.remove(), 500);
    }, 5000);
    
    // Закрытие по клику
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.5s ease-out forwards';
        setTimeout(() => notification.remove(), 500);
    });
}
// Добавить в конец script.js перед последней строкой

// 17. ФУНКЦИЯ ДЛЯ ВЫХОДА
async function handleLogout() {
    try {
        console.log("🚪 Выход из системы...");
        
        // Показываем уведомление
        showNotification('Выход из системы...', 'info');
        
        // Выход из Supabase
        const { error } = await supabaseClient.auth.signOut();
        
        if (error) {
            throw error;
        }
        
        console.log("✅ Выход из Supabase выполнен");
        
        // Очищаем localStorage
        localStorage.removeItem('ingirpro_user_session');
        localStorage.removeItem('sb-jacoyuuictmjascjqqpq-auth-token');
        
        // Отправляем сообщение о выходе
        window.postMessage({
            type: 'USER_LOGOUT'
        }, '*');
        
        // Обновляем UserProfile если доступен
        if (window.UserProfile) {
            window.UserProfile.logout();
        } else {
            // Перенаправляем на главную
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
        
    } catch (error) {
        console.error("❌ Ошибка выхода:", error);
        showNotification('Ошибка при выходе из системы', 'error');
    }
}

// 18. НАСТРОЙКА КНОПКИ ВЫХОДА В ПРИЛОЖЕНИИ
function setupLogoutButtons() {
    // Находим все кнопки выхода
    const logoutButtons = document.querySelectorAll('#logout-btn, .logout-btn-profile, .logout-btn');
    
    logoutButtons.forEach(btn => {
        // Убираем старые обработчики
        btn.removeEventListener('click', handleLogout);
        // Добавляем новый
        btn.addEventListener('click', handleLogout);
    });
}

// Вызываем настройку кнопок после загрузки
setTimeout(setupLogoutButtons, 1000);
// Запускаем обновление статуса
setTimeout(updateSystemStatus, 1000);