(function() {
    'use strict';

    // ==================== 管理员配置 ====================
    const ADMIN_USERNAME = 'sunomia';
    const ADMIN_PASSWORD = '1209shanyu';

    // ==================== 初始博客数据 ====================
    const defaultBlogs = [
        {
            id: 1,
            title: 'Hello World',
            date: '2026-07-02',
            content: 'Hello World！这是 Omiaちゃん 的第一篇测试博客文章。欢迎来到我的小博客，这里将记录我的编程学习、项目开发以及日常生活的点点滴滴～',
            tags: ['测试', '博客', 'HelloWorld']
        },
        {
            id: 2,
            title: '关于本站',
            date: '2026-07-01',
            content: '本站使用纯原生技术栈构建：HTML + CSS + JavaScript，无需任何框架。托管于 GitHub Pages，支持博客发布/编辑/删除、全文搜索、Markdown 风格写作。后台采用 localStorage 做数据持久化，管理员登录后可管理博客内容。UI 采用毛玻璃拟态风格，搭配随机二次元背景图，JetBrains Mono 字体，打字机标题动画。希望这个小小的博客能记录下我的成长轨迹～',
            tags: ['博客', '技术', 'GitHubPages', '前端']
        },
        {
            id: 3,
            title: '我的编程学习路线',
            date: '2026-06-28',
            content: '作为一名中职生，我的编程学习从 Python 起步，被它简洁的语法所吸引。随后接触了 C++ 的高性能世界，理解了指针和内存管理。最近开始学习 Java，感受面向对象的魅力。前端方面掌握了 HTML/CSS/JS 三件套，能够独立搭建完整的静态站点。未来计划深入学习数据结构和算法，以及 Linux 系统管理。编程之路漫漫，保持热爱，持续进步！',
            tags: ['Python', 'C++', 'Java', '学习', '编程']
        }
    ];

    // ==================== 全局状态 ====================
    let blogs = [];
    let isAdminLoggedIn = false;

    // ==================== DOM 缓存 ====================
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const dom = {
        blogList:       $('#blogList'),
        blogEmpty:      $('#blogEmpty'),
        blogSearch:     $('#blogSearch'),
        adminPanel:     $('#adminPanel'),
        addBlogBtn:     $('#addBlogBtn'),
        hiddenLogin:    $('#hiddenLogin'),
        blogModal:      $('#blogModal'),
        blogModalTitle: $('#blogModalTitle'),
        blogId:         $('#blogId'),
        blogTitle:      $('#blogTitle'),
        blogDate:       $('#blogDate'),
        blogContent:    $('#blogContent'),
        blogTags:       $('#blogTags'),
        charCount:      $('#charCount'),
        loginModal:     $('#loginModal'),
        loginError:     $('#loginError'),
        username:       $('#username'),
        password:       $('#password'),
        bgLayer:        $('#bgLayer'),
        typedText:      $('#typed-text'),
        toastContainer: $('#toastContainer'),
        visitorCount:   $('#visitorCount'),
    };

    // ==================== 访客计数器 ====================
    function updateVisitorCount() {
        const storageKey = 'site_visitor_count';
        const sessionKey = 'site_visit_session';

        // 获取当前总访问量
        let totalVisits = parseInt(localStorage.getItem(storageKey), 10) || 0;

        // 检查是否是新会话（同一浏览器标签页会话内只计一次）
        if (!sessionStorage.getItem(sessionKey)) {
            totalVisits++;
            localStorage.setItem(storageKey, totalVisits.toString());
            sessionStorage.setItem(sessionKey, '1');
        }

        // 渲染到页面
        if (dom.visitorCount) {
            dom.visitorCount.textContent = totalVisits;
        }
    }

    // ==================== 初始化 ====================
    function init() {
        loadBlogs();
        checkLoginStatus();
        renderBlogs();
        updateVisitorCount();
        bindEvents();
    }

    // ==================== 数据存储 ====================
    function loadBlogs() {
        try {
            const stored = localStorage.getItem('blogs');
            blogs = stored ? JSON.parse(stored) : [...defaultBlogs];
            if (!stored) saveBlogs();
        } catch (e) {
            console.warn('本地存储读取失败，使用默认数据');
            blogs = [...defaultBlogs];
        }
    }

    function saveBlogs() {
        try {
            localStorage.setItem('blogs', JSON.stringify(blogs));
        } catch (e) {
            showToast('本地存储已满，请清理旧数据', 'error');
        }
    }

    // ==================== Toast 通知系统 ====================
    function showToast(message, type = 'info') {
        const item = document.createElement('div');
        item.className = `toast-item toast-${type}`;
        item.textContent = message;
        dom.toastContainer.appendChild(item);
        setTimeout(() => {
            item.style.animation = 'toastOut 0.4s ease forwards';
            setTimeout(() => item.remove(), 400);
        }, 3000);
    }

    // ==================== 登录验证 ====================
    function checkLoginStatus() {
        isAdminLoggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';
        updateAdminUI();
    }

    function updateAdminUI() {
        const show = (el, v) => {
            if (el) el.classList.toggle('hidden', !v);
        };
        show(dom.adminPanel,  isAdminLoggedIn);
        show(dom.addBlogBtn,  isAdminLoggedIn);
        show(dom.hiddenLogin, !isAdminLoggedIn);
        renderBlogs();
    }

    window.adminLogin = function() {
        const username = dom.username.value.trim();
        const password = dom.password.value;
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            isAdminLoggedIn = true;
            localStorage.setItem('isAdminLoggedIn', 'true');
            updateAdminUI();
            closeModal('loginModal');
            dom.username.value = '';
            dom.password.value = '';
            dom.loginError.textContent = '';
            showToast('✅ 登录成功，欢迎回来！', 'success');
        } else {
            dom.loginError.textContent = '❌ 管理员账号或密码错误';
            shakeElement(dom.loginModal.querySelector('.modal-content'));
        }
    };

    window.adminLogout = function() {
        isAdminLoggedIn = false;
        localStorage.removeItem('isAdminLoggedIn');
        updateAdminUI();
        showToast('👋 已退出登录', 'info');
    };

    // ==================== 模态框操作 ====================
    window.openModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        // 聚焦第一个输入框
        const firstInput = modal.querySelector('input:not([type="hidden"])');
        if (firstInput) setTimeout(() => firstInput.focus(), 150);
    };

    window.closeModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        // 清除博客表单数据
        if (modalId === 'blogModal') clearBlogForm();
        if (modalId === 'loginModal') dom.loginError.textContent = '';
    };

    function clearBlogForm() {
        dom.blogId.value = '';
        dom.blogTitle.value = '';
        dom.blogDate.value = '';
        dom.blogContent.value = '';
        dom.blogTags.value = '';
        dom.charCount.textContent = '0 / 5000';
        dom.charCount.className = 'char-count';
    }

    // 点击遮罩层关闭模态框
    function handleModalBackdropClick(e) {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    }
    
    const loginModal = document.getElementById('loginModal');
    const blogModal = document.getElementById('blogModal');
    if (loginModal) loginModal.addEventListener('click', handleModalBackdropClick);
    if (blogModal) blogModal.addEventListener('click', handleModalBackdropClick);

    // ESC 键关闭模态框
    window.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (dom.blogModal && !dom.blogModal.classList.contains('hidden')) closeModal('blogModal');
            if (dom.loginModal && !dom.loginModal.classList.contains('hidden')) closeModal('loginModal');
        }
    });

    // ==================== 抖动动画 ====================
    function shakeElement(el) {
        if (!el) return;
        el.style.animation = 'none';
        void el.offsetWidth; // 触发回流
        el.style.animation = 'shake 0.5s ease';
        setTimeout(() => el.style.animation = '', 500);
    }

    // ==================== 博客 CRUD ====================
    function renderBlogs() {
        const searchTerm = dom.blogSearch ? dom.blogSearch.value.trim().toLowerCase() : '';
        let filteredBlogs = blogs;
        if (searchTerm) {
            filteredBlogs = blogs.filter(b =>
                b.title.toLowerCase().includes(searchTerm) ||
                b.content.toLowerCase().includes(searchTerm) ||
                b.tags.some(t => t.toLowerCase().includes(searchTerm))
            );
        }

        dom.blogList.innerHTML = '';
        if (filteredBlogs.length === 0) {
            dom.blogList.style.display = 'none';
            dom.blogEmpty.classList.remove('hidden');
            const p = dom.blogEmpty.querySelector('.empty-subtitle');
            if (p) p.textContent = searchTerm ? '未找到匹配的博客' : '暂无博客文章......';
            return;
        }
        dom.blogList.style.display = '';
        dom.blogEmpty.classList.add('hidden');

        filteredBlogs.forEach(blog => {
            const card = document.createElement('article');
            card.className = 'blog-card';
            card.style.animation = 'fadeInUp 0.5s ease forwards';

            const tagsHtml = blog.tags
                .map(tag => `<span class="blog-tag">${escapeHtml(tag)}</span>`)
                .join('');

            const editButtons = isAdminLoggedIn
                ? `<div class="blog-actions">
                        <button class="edit-btn" onclick="editBlog(${blog.id})">✏️ 编辑</button>
                        <button class="delete-btn" onclick="deleteBlog(${blog.id})">🗑️ 删除</button>
                    </div>`
                : '';

            card.innerHTML = `
                <div class="blog-date">${escapeHtml(blog.date)}</div>
                <h3>${escapeHtml(blog.title)}</h3>
                <p>${escapeHtml(blog.content)}</p>
                <div class="blog-tags-row">${tagsHtml}</div>
                ${editButtons}
            `;
            dom.blogList.appendChild(card);
        });
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    window.openAddBlog = function() {
        dom.blogModalTitle.textContent = '发布新博客';
        dom.blogId.value = '';
        dom.blogTitle.value = '';
        dom.blogDate.value = new Date().toISOString().split('T')[0];
        dom.blogContent.value = '';
        dom.blogTags.value = '';
        dom.charCount.textContent = '0 / 5000';
        dom.charCount.className = 'char-count';
        openModal('blogModal');
    };

    window.editBlog = function(id) {
        const blog = blogs.find(b => b.id === id);
        if (!blog) return;
        dom.blogModalTitle.textContent = '编辑博客';
        dom.blogId.value = blog.id;
        dom.blogTitle.value = blog.title;
        dom.blogDate.value = blog.date;
        dom.blogContent.value = blog.content;
        dom.blogTags.value = blog.tags.join(', ');
        updateCharCount();
        openModal('blogModal');
    };

    window.saveBlog = function() {
        const id      = dom.blogId.value;
        const title   = dom.blogTitle.value.trim();
        const date    = dom.blogDate.value;
        const content = dom.blogContent.value.trim();
        const tags    = dom.blogTags.value.split(/[,，]/).map(t => t.trim()).filter(Boolean);

        if (!title)   { showToast('请填写博客标题', 'error'); dom.blogTitle.focus(); return; }
        if (!date)    { showToast('请选择日期', 'error'); return; }
        if (!content) { showToast('请填写博客内容', 'error'); dom.blogContent.focus(); return; }

        if (id) {
            const index = blogs.findIndex(b => b.id === parseInt(id));
            if (index !== -1) {
                blogs[index] = { ...blogs[index], title, date, content, tags };
                showToast('✅ 博客已更新', 'success');
            }
        } else {
            const newId = blogs.length > 0 ? Math.max(...blogs.map(b => b.id)) + 1 : 1;
            blogs.unshift({ id: newId, title, date, content, tags });
            showToast('✅ 博客发布成功', 'success');
        }

        saveBlogs();
        renderBlogs();
        closeModal('blogModal');
    };

    window.deleteBlog = function(id) {
        if (!confirm('确定要删除这篇博客吗？此操作不可恢复。')) return;
        blogs = blogs.filter(b => b.id !== id);
        saveBlogs();
        renderBlogs();
        showToast('🗑️ 博客已删除', 'info');
    };

    // ==================== 字数统计 ====================
    function updateCharCount() {
        const len = dom.blogContent.value.length;
        const max = 5000;
        dom.charCount.textContent = `${len} / ${max}`;
        dom.charCount.className = 'char-count';
        if (len > max * 0.9) dom.charCount.classList.add('danger');
        else if (len > max * 0.7) dom.charCount.classList.add('warning');
    }

    // ==================== 搜索过滤 ====================
    function onBlogSearch() {
        renderBlogs();
    }

    // ==================== 打字机效果 ====================
    const typewriterText = "Hello My name is Omiaちゃん";
    const typingSpeed  = 150;   // 打字速度 (ms)
    const pauseDelay   = 3000;  // 打完后的停顿 (ms)
    const deleteSpeed  = 80;    // 删除速度 (ms)
    const restartDelay = 1500;  // 删完后重新开始的停顿 (ms)

    let typeIndex    = 0;
    let isDeleting   = false;
    let typeTimer    = null;

    function startTyping() {
        clearTimeout(typeTimer);
        if (!dom.typedText) return;
        
        if (!isDeleting) {
            if (typeIndex < typewriterText.length) {
                dom.typedText.textContent += typewriterText[typeIndex];
                typeIndex++;
                typeTimer = setTimeout(startTyping, typingSpeed);
            } else {
                isDeleting = true;
                typeTimer = setTimeout(startTyping, pauseDelay);
            }
        } else {
            if (typeIndex > 0) {
                dom.typedText.textContent = typewriterText.slice(0, typeIndex - 1);
                typeIndex--;
                typeTimer = setTimeout(startTyping, deleteSpeed);
            } else {
                isDeleting = false;
                typeTimer = setTimeout(startTyping, restartDelay);
            }
        }
    }

    // ==================== 随机背景图片 ====================
    const backgroundImages = [
        'images/columbina-5k-3840x2160-25922.jpg',
        'images/oshi-no-ko-3840x2160-25261.jpg',
        'images/sparxie-honkai-star-3840x2160-26290.jpg',
        'images/zhuang-fangyi-3840x2160-26226.jpg'
    ];

    function setRandomBackground() {
        if (backgroundImages.length === 0 || !dom.bgLayer) return;
        const idx = Math.floor(Math.random() * backgroundImages.length);
        const url = backgroundImages[idx];
        const img = new Image();
        img.onload = function() {
            dom.bgLayer.style.backgroundImage = `url('${url}')`;
            dom.bgLayer.style.opacity = 1;
        };
        img.onerror = function() {
            console.warn('背景图片加载失败:', url);
            // 失败时尝试下一张
            const next = backgroundImages.filter(b => b !== url);
            if (next.length > 0) {
                const fallback = next[Math.floor(Math.random() * next.length)];
                dom.bgLayer.style.backgroundImage = `url('${fallback}')`;
            }
        };
        img.src = url;
    }

    // 预加载所有背景图片
    function preloadBackgrounds() {
        backgroundImages.forEach(url => {
            const img = new Image();
            img.src = url;
        });
    }

    // ==================== 导航切换 ====================
    function bindNavEvents() {
        const navBtns = $$('.nav-btn');
        const sections = $$('.content-section');

        navBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                if (this.classList.contains('disabled')) return;
                navBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const targetId = this.dataset.target;
                
                sections.forEach(s => {
                    s.classList.remove('active');
                    s.style.animation = 'none';
                });
                
                const target = document.getElementById(targetId);
                if (target) {
                    target.classList.add('active');
                    // 触发重绘以重新播放动画
                    void target.offsetWidth;
                    target.style.animation = 'fadeInUp 0.5s ease forwards';
                }
            });
        });
    }

    // ==================== 全局事件绑定 ====================
    function bindEvents() {
        // 退出登录
        if (dom.adminPanel) {
            const logoutBtn = dom.adminPanel.querySelector('#logoutBtn');
            if (logoutBtn) logoutBtn.addEventListener('click', adminLogout);
        }
        // 新增博客
        if (dom.addBlogBtn) dom.addBlogBtn.addEventListener('click', openAddBlog);
        // 博客搜索
        if (dom.blogSearch) dom.blogSearch.addEventListener('input', debounce(onBlogSearch, 300));
        // 字数统计
        if (dom.blogContent) dom.blogContent.addEventListener('input', updateCharCount);
        // 导航
        bindNavEvents();
        // 登录表单回车提交
        if (dom.loginModal) {
            dom.loginModal.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') adminLogin();
            });
        }
        // 博客表单 Ctrl+Enter 提交
        if (dom.blogModal) {
            dom.blogModal.addEventListener('keydown', function(e) {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') saveBlog();
            });
        }
    }

    // ==================== 工具函数 ====================
    function debounce(fn, delay) {
        let timer;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    // ==================== 页面启动 ====================
    window.addEventListener('DOMContentLoaded', function() {
        // 页面加载动画
        document.body.classList.add('loaded');
        
        init();
        startTyping();
        setRandomBackground();
        preloadBackgrounds();
    });

    // ==================== 暴露到全局作用域（兼容 onclick 属性） ====================
    window.editBlog   = window.editBlog;
    window.deleteBlog = window.deleteBlog;
    window.saveBlog   = window.saveBlog;
    window.openAddBlog = window.openAddBlog;
    window.adminLogin  = window.adminLogin;
    window.adminLogout = window.adminLogout;
    window.openModal   = window.openModal;
    window.closeModal  = window.closeModal;
})();
