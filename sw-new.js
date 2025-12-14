/**
 * Service Worker المحسن - Rabhne Games PWA
 * نظام تخزين مؤقت ذكي وإدارة الشبكة
 */

const CACHE_NAME = 'rabhne-games-v2.0.0';
const STATIC_CACHE = 'rabhne-static-v2.0.0';
const DYNAMIC_CACHE = 'rabhne-dynamic-v2.0.0';
const API_CACHE = 'rabhne-api-v2.0.0';

// الملفات الأساسية للتخزين المؤقت
const STATIC_ASSETS = [
    '/',
    '/index-new.html',
    '/css/style-new.css',
    '/config/app-config.js',
    '/core/app-core.js',
    '/core/security/security-manager.js',
    '/core/utils/ui-manager.js',
    '/core/auth/auth-manager.js',
    '/core/api/points-manager.js',
    '/img/favicon.ico',
    '/manifest.json',
    'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js'
];

// الملفات الديناميكية
const DYNAMIC_ASSETS = [
    '/games.html',
    '/dashboard.html',
    '/profile.html',
    '/withdraw.html',
    '/support.html'
];

// نمط URLs للـ API
const API_PATTERNS = [
    /^https:\/\/.*\.googleapis\.com\//,
    /^https:\/\/.*\.firebaseio\.com\//,
    /^https:\/\/.*\.cloudfunctions\.net\//
];

// إعدادات التخزين المؤقت
const CACHE_CONFIG = {
    maxAge: {
        static: 30 * 24 * 60 * 60 * 1000, // 30 يوم
        dynamic: 7 * 24 * 60 * 60 * 1000, // 7 أيام
        api: 5 * 60 * 1000 // 5 دقائق
    },
    maxEntries: {
        dynamic: 50,
        api: 30
    }
};

// تثبيت Service Worker
self.addEventListener('install', event => {
    console.log('🔧 تثبيت Service Worker...');
    
    event.waitUntil(
        Promise.all([
            // تخزين الملفات الأساسية
            caches.open(STATIC_CACHE).then(cache => {
                console.log('📦 تخزين الملفات الأساسية...');
                return cache.addAll(STATIC_ASSETS);
            }),
            
            // تخزين الملفات الديناميكية
            caches.open(DYNAMIC_CACHE).then(cache => {
                console.log('📦 تخزين الملفات الديناميكية...');
                return cache.addAll(DYNAMIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
            })
        ]).then(() => {
            console.log('✅ تم تثبيت Service Worker بنجاح');
            return self.skipWaiting();
        }).catch(error => {
            console.error('❌ خطأ في تثبيت Service Worker:', error);
        })
    );
});

// تفعيل Service Worker
self.addEventListener('activate', event => {
    console.log('🚀 تفعيل Service Worker...');
    
    event.waitUntil(
        Promise.all([
            // تنظيف التخزين المؤقت القديم
            cleanupOldCaches(),
            
            // تحديث العملاء
            self.clients.claim()
        ]).then(() => {
            console.log('✅ تم تفعيل Service Worker بنجاح');
        })
    );
});

// اعتراض طلبات الشبكة
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // تجاهل طلبات معينة
    if (shouldIgnoreRequest(request)) {
        return;
    }
    
    // تحديد استراتيجية التخزين المؤقت
    if (isStaticAsset(request)) {
        event.respondWith(handleStaticAsset(request));
    } else if (isAPIRequest(request)) {
        event.respondWith(handleAPIRequest(request));
    } else if (isDynamicAsset(request)) {
        event.respondWith(handleDynamicAsset(request));
    } else {
        event.respondWith(handleOtherRequest(request));
    }
});

// معالجة الرسائل
self.addEventListener('message', event => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'GET_VERSION':
            event.ports[0].postMessage({ version: CACHE_NAME });
            break;
            
        case 'CLEAR_CACHE':
            clearAllCaches().then(() => {
                event.ports[0].postMessage({ success: true });
            });
            break;
            
        case 'CACHE_URLS':
            cacheUrls(data.urls).then(() => {
                event.ports[0].postMessage({ success: true });
            });
            break;
    }
});

// معالجة تحديثات الخلفية
self.addEventListener('backgroundsync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

// معالجة الإشعارات Push
self.addEventListener('push', event => {
    if (event.data) {
        const data = event.data.json();
        event.waitUntil(showNotification(data));
    }
});

// معالجة النقر على الإشعارات
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    event.waitUntil(
        self.clients.openWindow(event.notification.data?.url || '/')
    );
});

// === وظائف مساعدة ===

// تنظيف التخزين المؤقت القديم
async function cleanupOldCaches() {
    const cacheNames = await caches.keys();
    const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];
    
    return Promise.all(
        cacheNames
            .filter(cacheName => !currentCaches.includes(cacheName))
            .map(cacheName => {
                console.log('🗑️ حذف تخزين مؤقت قديم:', cacheName);
                return caches.delete(cacheName);
            })
    );
}

// فحص ما إذا كان يجب تجاهل الطلب
function shouldIgnoreRequest(request) {
    const url = new URL(request.url);
    
    // تجاهل طلبات معينة
    const ignoredPatterns = [
        /\/sockjs-node\//,
        /\/webpack-dev-server\//,
        /chrome-extension:/,
        /moz-extension:/
    ];
    
    return ignoredPatterns.some(pattern => pattern.test(request.url)) ||
           request.method !== 'GET' ||
           url.protocol === 'chrome-extension:' ||
           url.protocol === 'moz-extension:';
}

// فحص ما إذا كان الطلب لملف ثابت
function isStaticAsset(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // ملفات CSS, JS, الصور، الخطوط
    const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf'];
    
    return staticExtensions.some(ext => pathname.endsWith(ext)) ||
           STATIC_ASSETS.some(asset => request.url.includes(asset));
}

// فحص ما إذا كان الطلب لـ API
function isAPIRequest(request) {
    return API_PATTERNS.some(pattern => pattern.test(request.url));
}

// فحص ما إذا كان الطلب لملف ديناميكي
function isDynamicAsset(request) {
    const url = new URL(request.url);
    return url.origin === self.location.origin && 
           (url.pathname.endsWith('.html') || url.pathname === '/');
}

// معالجة الملفات الثابتة - Cache First
async function handleStaticAsset(request) {
    try {
        const cache = await caches.open(STATIC_CACHE);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            // فحص انتهاء الصلاحية
            const dateHeader = cachedResponse.headers.get('date');
            if (dateHeader) {
                const cachedDate = new Date(dateHeader);
                const now = new Date();
                if (now - cachedDate > CACHE_CONFIG.maxAge.static) {
                    // انتهت الصلاحية، جلب نسخة جديدة
                    return fetchAndCache(request, cache);
                }
            }
            
            return cachedResponse;
        }
        
        return fetchAndCache(request, cache);
        
    } catch (error) {
        console.error('خطأ في معالجة الملف الثابت:', error);
        return new Response('خطأ في الشبكة', { status: 503 });
    }
}

// معالجة طلبات API - Network First مع Stale While Revalidate
async function handleAPIRequest(request) {
    try {
        const cache = await caches.open(API_CACHE);
        
        // محاولة جلب من الشبكة أولاً
        try {
            const networkResponse = await fetch(request.clone());
            
            if (networkResponse.ok) {
                // تخزين الاستجابة الجديدة
                cache.put(request, networkResponse.clone());
                return networkResponse;
            }
        } catch (networkError) {
            console.warn('فشل طلب الشبكة، البحث في التخزين المؤقت:', networkError);
        }
        
        // البحث في التخزين المؤقت كبديل
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // إرجاع استجابة خطأ إذا لم يتم العثور على شيء
        return new Response(JSON.stringify({ 
            error: 'لا يوجد اتصال بالإنترنت', 
            offline: true 
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('خطأ في معالجة طلب API:', error);
        return new Response(JSON.stringify({ error: 'خطأ في الخادم' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// معالجة الملفات الديناميكية - Stale While Revalidate
async function handleDynamicAsset(request) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const cachedResponse = await cache.match(request);
        
        // إرجاع النسخة المخزنة فوراً إن وجدت
        const responsePromise = cachedResponse || fetch(request);
        
        // تحديث التخزين المؤقت في الخلفية
        const networkUpdate = fetch(request).then(response => {
            if (response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        }).catch(() => cachedResponse);
        
        return cachedResponse || networkUpdate;
        
    } catch (error) {
        console.error('خطأ في معالجة الملف الديناميكي:', error);
        
        // إرجاع صفحة offline إذا لم يتم العثور على شيء
        return caches.match('/offline.html') || 
               new Response('غير متصل', { status: 503 });
    }
}

// معالجة الطلبات الأخرى
async function handleOtherRequest(request) {
    try {
        return await fetch(request);
    } catch (error) {
        console.error('خطأ في معالجة الطلب:', error);
        return new Response('خطأ في الشبكة', { status: 503 });
    }
}

// جلب وتخزين
async function fetchAndCache(request, cache) {
    try {
        const response = await fetch(request);
        
        if (response.ok) {
            // إضافة تاريخ التخزين
            const responseWithDate = new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: {
                    ...response.headers,
                    'date': new Date().toISOString()
                }
            });
            
            cache.put(request, responseWithDate.clone());
            return responseWithDate;
        }
        
        return response;
        
    } catch (error) {
        console.error('خطأ في جلب الملف:', error);
        throw error;
    }
}

// مزامنة الخلفية
async function doBackgroundSync() {
    try {
        // مزامنة البيانات المعلقة
        const pendingData = await getStoredData('pending-sync');
        
        if (pendingData && pendingData.length > 0) {
            for (const item of pendingData) {
                try {
                    await syncDataItem(item);
                } catch (error) {
                    console.error('خطأ في مزامنة البيانات:', error);
                }
            }
            
            // مسح البيانات المعلقة بعد المزامنة
            await clearStoredData('pending-sync');
        }
        
    } catch (error) {
        console.error('خطأ في مزامنة الخلفية:', error);
    }
}

// مزامنة عنصر بيانات
async function syncDataItem(item) {
    const response = await fetch(item.url, {
        method: item.method || 'POST',
        headers: item.headers || { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.data)
    });
    
    if (!response.ok) {
        throw new Error(`فشل في مزامنة البيانات: ${response.status}`);
    }
    
    return response;
}

// عرض إشعار
async function showNotification(data) {
    const options = {
        body: data.body || 'لديك إشعار جديد',
        icon: '/img/icon-192x192.png',
        badge: '/img/badge-72x72.png',
        tag: data.tag || 'default',
        data: data.data || {},
        actions: data.actions || [],
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false
    };
    
    return self.registration.showNotification(data.title || 'Rabhne Games', options);
}

// تخزين البيانات محلياً
async function storeData(key, data) {
    try {
        const cache = await caches.open('rabhne-data');
        const response = new Response(JSON.stringify(data));
        await cache.put(key, response);
    } catch (error) {
        console.error('خطأ في تخزين البيانات:', error);
    }
}

// جلب البيانات المخزنة
async function getStoredData(key) {
    try {
        const cache = await caches.open('rabhne-data');
        const response = await cache.match(key);
        
        if (response) {
            return await response.json();
        }
        
        return null;
    } catch (error) {
        console.error('خطأ في جلب البيانات المخزنة:', error);
        return null;
    }
}

// مسح البيانات المخزنة
async function clearStoredData(key) {
    try {
        const cache = await caches.open('rabhne-data');
        await cache.delete(key);
    } catch (error) {
        console.error('خطأ في مسح البيانات:', error);
    }
}

// مسح جميع التخزين المؤقت
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    return Promise.all(cacheNames.map(name => caches.delete(name)));
}

// تخزين URLs محددة
async function cacheUrls(urls) {
    const cache = await caches.open(DYNAMIC_CACHE);
    return cache.addAll(urls);
}

// تنظيف التخزين المؤقت بناءً على الحد الأقصى
async function cleanupCache(cacheName, maxEntries) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length > maxEntries) {
        const keysToDelete = keys.slice(0, keys.length - maxEntries);
        await Promise.all(keysToDelete.map(key => cache.delete(key)));
    }
}

// تنظيف دوري للتخزين المؤقت
setInterval(() => {
    cleanupCache(DYNAMIC_CACHE, CACHE_CONFIG.maxEntries.dynamic);
    cleanupCache(API_CACHE, CACHE_CONFIG.maxEntries.api);
}, 60 * 60 * 1000); // كل ساعة

console.log('🎮 Rabhne Games Service Worker جاهز!');