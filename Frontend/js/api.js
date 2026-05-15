//const BACKEND_BASE_URL = 'http://localhost:3000';
const BACKEND_BASE_URL = 'https://grievance-redressal-system-qing.onrender.com';
const API_BASE = `${BACKEND_BASE_URL}/api`;

const api = {
    async get(endpoint) {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            credentials: 'include'
        });

        let data;
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            data = await res.json();
        } else {
            const text = await res.text();
            throw new Error(`Server Error (${res.status}): ${text.slice(0, 100)}...`);
        }

        if (!res.ok) throw new Error(data.error || 'Request failed');
        return data;
    },

    async post(endpoint, body) {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            credentials: 'include'
        });

        let data;
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            data = await res.json();
        } else {
            const text = await res.text();
            throw new Error(`Server Error (${res.status}): ${text.slice(0, 100)}...`);
        }

        if (!res.ok) throw new Error(data.error || 'Request failed');
        return data;
    }
};

const toast = {
    show(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.textContent = message;
        container.appendChild(el);
        setTimeout(() => el.remove(), 4000);
    },
    error(message) {
        this.show(message, 'error');
    }
};
