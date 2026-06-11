const state = {
    currentUser: null,
    users: [],
    allMeetings: [],
    currentPage: 'users'
};

const API_BASE = (window.location.origin.startsWith('file://') || !window.location.origin.includes('8080')) 
    ? 'http://localhost:8080/api' 
    : '/api';

// Toast
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <div class="toast-message">${message}</div>
    `;
    
    container.appendChild(toast);
    void toast.offsetWidth;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Fetch
async function apiFetch(endpoint, options = {}) {
    if (options.body && typeof options.body === 'object') {
        options.body = JSON.stringify(options.body);
        options.headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
    }
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Terjadi kesalahan');
        return data;
    } catch (err) {
        console.error(`API Error on ${endpoint}:`, err);
        throw err;
    }
}

// Init
async function initAdmin() {
    const savedUser = localStorage.getItem('rapatin_user');
    if (savedUser) {
        state.currentUser = JSON.parse(savedUser);
        if (state.currentUser.role !== 'admin') {
            window.location.href = 'index.html'; // Bukan admin, kembalikan ke beranda
            return;
        }
        
        document.getElementById('admin-avatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(state.currentUser.name)}&background=800000&color=fff`;
        document.getElementById('admin-username').textContent = state.currentUser.name;
        
        setupNav();
        await loadData();
    } else {
        window.location.href = 'index.html';
    }
}

function setupNav() {
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            state.currentPage = item.getAttribute('data-page');
            renderAdminPage();
        });
    });
}

async function loadData() {
    try {
        const [usersRes, meetingsRes] = await Promise.all([
            apiFetch(`/admin/users?admin_id=${state.currentUser.id}`),
            apiFetch('/meetings')
        ]);
        state.users = usersRes.data || [];
        state.allMeetings = meetingsRes.data || [];
        renderAdminPage();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function renderAdminPage() {
    const container = document.getElementById('admin-container');
    container.innerHTML = '';
    
    if (state.currentPage === 'users') {
        container.innerHTML = `
            <div class="section-header">
                <h2>Manajemen User</h2>
            </div>
            <div style="background: white; border-radius: var(--radius-lg); padding: 1.5rem; overflow-x: auto; box-shadow: var(--shadow-sm);">
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--border-color); color: var(--text-muted);">
                            <th style="padding: 1rem;">ID</th>
                            <th style="padding: 1rem;">Nama</th>
                            <th style="padding: 1rem;">Email</th>
                            <th style="padding: 1rem;">Role</th>
                            <th style="padding: 1rem;">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.users.map(u => `
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: 1rem; font-family: monospace; font-size: 0.85rem;">${u.id}</td>
                                <td style="padding: 1rem;">${u.name}</td>
                                <td style="padding: 1rem;">${u.email}</td>
                                <td style="padding: 1rem;">
                                    <span style="background: ${u.role === 'admin' ? 'var(--primary-light)' : '#f1f5f9'}; color: ${u.role === 'admin' ? 'var(--primary)' : '#475569'}; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.85rem; font-weight: 600;">
                                        ${u.role}
                                    </span>
                                </td>
                                <td style="padding: 1rem; display: flex; gap: 0.5rem;">
                                    <button class="btn btn-primary" style="padding: 0.4rem 0.8rem; border: none; cursor: pointer;" onclick="openEditUser('${u.id}')">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; background: #fee2e2; color: #ef4444; border: none; cursor: pointer;" onclick="deleteUser('${u.id}')">
                                        <i class="fas fa-trash-alt"></i> Hapus
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ${state.users.length === 0 ? '<div class="empty-state">Belum ada user</div>' : ''}
            </div>
        `;
    } else if (state.currentPage === 'meetings') {
        container.innerHTML = `
            <div class="section-header">
                <h2>Semua Rapat (${state.allMeetings.length})</h2>
            </div>
            <div style="background: white; border-radius: var(--radius-lg); padding: 1.5rem; overflow-x: auto; box-shadow: var(--shadow-sm);">
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--border-color); color: var(--text-muted);">
                            <th style="padding: 1rem;">Judul</th>
                            <th style="padding: 1rem;">Tanggal & Waktu</th>
                            <th style="padding: 1rem;">Lokasi</th>
                            <th style="padding: 1rem;">Pembuat (User ID)</th>
                            <th style="padding: 1rem;">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.allMeetings.map(m => `
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: 1rem; font-weight: 500;">${m.title}</td>
                                <td style="padding: 1rem;">${new Date(m.date).toLocaleDateString('id-ID')} - ${m.time}</td>
                                <td style="padding: 1rem;">${m.location}</td>
                                <td style="padding: 1rem; font-family: monospace; font-size: 0.85rem;">${m.userId}</td>
                                <td style="padding: 1rem; display: flex; gap: 0.5rem;">
                                    <button class="btn btn-primary" style="padding: 0.4rem 0.8rem; border: none; cursor: pointer;" onclick="openEditMeeting('${m.id}')">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; background: #fee2e2; color: #ef4444; border: none; cursor: pointer;" onclick="deleteAdminMeeting('${m.id}')">
                                        <i class="fas fa-trash-alt"></i> Hapus
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ${state.allMeetings.length === 0 ? '<div class="empty-state">Belum ada rapat</div>' : ''}
            </div>
        `;
    }
}

async function deleteUser(id) {
    if (confirm('Yakin ingin menghapus user ini?')) {
        try {
            await apiFetch(`/admin/users/${id}?admin_id=${state.currentUser.id}`, { method: 'DELETE' });
            state.users = state.users.filter(u => u.id !== id);
            renderAdminPage();
            showToast('User berhasil dihapus', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    }
}

async function deleteAdminMeeting(id) {
    if (confirm('Yakin ingin menghapus rapat ini dari sistem?')) {
        try {
            await apiFetch(`/meetings/${id}`, { method: 'DELETE' });
            state.allMeetings = state.allMeetings.filter(m => m.id !== id);
            renderAdminPage();
            showToast('Rapat berhasil dihapus', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    }
}

initAdmin();

function openEditUser(id) {
    const u = state.users.find(x => x.id === id);
    if (!u) return;
    document.getElementById('edit-u-id').value = u.id;
    document.getElementById('edit-u-name').value = u.name;
    document.getElementById('edit-u-email').value = u.email;
    document.getElementById('edit-u-role').value = u.role || 'user';
    document.getElementById('edit-u-position').value = u.position || '';
    document.getElementById('edit-u-bio').value = u.bio || '';

    document.getElementById('admin-modal-overlay').classList.add('active');
    document.getElementById('admin-user-modal').classList.add('active');
}

function openEditMeeting(id) {
    const m = state.allMeetings.find(x => x.id === id);
    if (!m) return;
    document.getElementById('edit-m-id').value = m.id;
    document.getElementById('edit-m-title').value = m.title;
    document.getElementById('edit-m-date').value = m.date;
    document.getElementById('edit-m-time').value = m.time;
    document.getElementById('edit-m-location').value = m.location;
    document.getElementById('edit-m-description').value = m.description || '';

    document.getElementById('admin-modal-overlay').classList.add('active');
    document.getElementById('admin-meeting-modal').classList.add('active');
}

function closeAdminModal(modalId) {
    document.getElementById('admin-modal-overlay').classList.remove('active');
    document.getElementById(modalId).classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
    const userForm = document.getElementById('admin-user-form');
    if (userForm) {
        userForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-u-id').value;
            const body = {
                name: document.getElementById('edit-u-name').value,
                email: document.getElementById('edit-u-email').value,
                role: document.getElementById('edit-u-role').value,
                position: document.getElementById('edit-u-position').value,
                bio: document.getElementById('edit-u-bio').value
            };
            try {
                const res = await apiFetch(`/user/${id}`, { method: 'PUT', body });
                const idx = state.users.findIndex(u => u.id === id);
                if (idx !== -1) {
                    state.users[idx] = { ...state.users[idx], ...body, ...(res.data || {}) };
                }
                showToast('User berhasil diperbarui', 'success');
                closeAdminModal('admin-user-modal');
                renderAdminPage();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    const meetingForm = document.getElementById('admin-meeting-form');
    if (meetingForm) {
        meetingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-m-id').value;
            const m = state.allMeetings.find(x => x.id === id);
            const body = {
                title: document.getElementById('edit-m-title').value,
                date: document.getElementById('edit-m-date').value,
                time: document.getElementById('edit-m-time').value,
                location: document.getElementById('edit-m-location').value,
                description: document.getElementById('edit-m-description').value,
                userId: m.userId
            };
            try {
                const res = await apiFetch(`/meetings/${id}`, { method: 'PATCH', body });
                const idx = state.allMeetings.findIndex(x => x.id === id);
                if (idx !== -1) {
                    state.allMeetings[idx] = { ...state.allMeetings[idx], ...body, ...(res.data || {}) };
                }
                showToast('Rapat berhasil diperbarui', 'success');
                closeAdminModal('admin-meeting-modal');
                renderAdminPage();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }
});
