let currentUser = null;

const app = document.getElementById('app');
const navbar = document.getElementById('navbar');
const navAdmin = document.getElementById('nav-admin');

// --- Router ---
const routes = {
    login: renderLogin,
    register: renderRegister,
    submit: renderSubmit,
    my: renderMyComplaints,
    admin: renderAdminDashboard
};

function navigate(route) {
    window.location.hash = route;
    if (routes[route]) {
        routes[route]();
    }
}

window.addEventListener('hashchange', () => {
    const route = window.location.hash.slice(1) || 'login';
    if (routes[route]) routes[route]();
});

// --- Auth Check ---
async function checkSession() {
    try {
        currentUser = await api.get('/auth/me');
        navbar.classList.remove('hidden');
        if (currentUser.role === 'admin') {
            navAdmin.classList.remove('hidden');
            if (!window.location.hash || window.location.hash === '#login') navigate('admin');
        } else {
            if (!window.location.hash || window.location.hash === '#login') navigate('my');
        }
    } catch (err) {
        navbar.classList.add('hidden');
        navigate('login');
    } finally {
        document.getElementById('initial-loader')?.remove();
    }
}

// --- Renderers ---

function renderLogin() {
    app.innerHTML = `
        <div class="card">
            <h2>Login</h2>
            <form id="login-form">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="login-email" required>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="login-password" required>
                </div>
                <button type="submit" class="btn-primary">Sign In</button>
            </form>
            <p style="text-align: center; margin-top: 1.5rem; color: var(--text-muted)">
                Don't have an account? <a href="#register" style="color: var(--primary)">Register</a>
            </p>
        </div>
    `;

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            currentUser = await api.post('/auth/login', {
                email: document.getElementById('login-email').value,
                password: document.getElementById('login-password').value
            });
            toast.show('Welcome back, ' + currentUser.name + '!');
            navbar.classList.remove('hidden');
            if (currentUser.role === 'admin') {
                navAdmin.classList.remove('hidden');
                navigate('admin');
            } else {
                navigate('my');
            }
        } catch (err) {
            toast.error(err.message);
        }
    });
}

function renderRegister() {
    app.innerHTML = `
        <div class="card" id="register-card">
            <h2>Register</h2>
            <form id="otp-form">
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" id="reg-name" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="reg-email" required>
                </div>
                <button type="submit" class="btn-primary">Send OTP</button>
            </form>
        </div>
    `;

    document.getElementById('otp-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        try {
            await api.post('/auth/send-otp', { name, email });
            toast.show('OTP sent to your email!');
            renderVerifyStep(email);
        } catch (err) {
            toast.error(err.message);
        }
    });
}

function renderVerifyStep(email) {
    const card = document.getElementById('register-card');
    card.innerHTML = `
        <h2>Verify OTP</h2>
        <form id="verify-form">
            <div class="form-group">
                <label>OTP Code</label>
                <input type="text" id="reg-otp" maxlength="6" required>
            </div>
            <div class="form-group">
                <label>New Password</label>
                <input type="password" id="reg-password" required>
            </div>
            <div class="form-group">
                <label>Confirm Password</label>
                <input type="password" id="reg-confirm" required>
            </div>
            <button type="submit" class="btn-primary">Complete Registration</button>
        </form>
    `;

    document.getElementById('verify-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const otp = document.getElementById('reg-otp').value;
        const password = document.getElementById('reg-password').value;
        const confirm = document.getElementById('reg-confirm').value;

        if (password !== confirm) return toast.error('Passwords do not match');

        try {
            await api.post('/auth/register', { email, otp, password });
            toast.show('Registration successful! Please login.');
            navigate('login');
        } catch (err) {
            toast.error(err.message);
        }
    });
}

function renderSubmit() {
    app.innerHTML = `
        <div class="card card-large">
            <h2>Submit a Complaint</h2>
            <div id="complaint-flow">
                <div class="form-group">
                    <label>Describe your issue</label>
                    <textarea id="complaint-text" rows="5" placeholder="What happened?"></textarea>
                </div>
                <button id="get-ai-q" class="btn-primary">Next</button>
            </div>
        </div>
    `;

    document.getElementById('get-ai-q').addEventListener('click', async () => {
        const text = document.getElementById('complaint-text').value;
        if (!text) return toast.error('Please enter your complaint');

        const btn = document.getElementById('get-ai-q');
        btn.textContent = 'Generating question...';
        btn.disabled = true;

        try {
            const { question } = await api.post('/ai/question', { complaintText: text });
            renderFollowUpStep(text, question);
        } catch (err) {
            toast.error(err.message);
            btn.textContent = 'Next';
            btn.disabled = false;
        }
    });
}

function renderFollowUpStep(complaintText, aiQuestion) {
    const flow = document.getElementById('complaint-flow');
    flow.innerHTML = `
        <div class="complaint-text" style="opacity: 0.6; padding: 1rem; background: rgba(0,0,0,0.2); border-radius: 0.5rem; margin-bottom: 1.5rem">
            ${complaintText}
        </div>
        <div class="ai-section" style="margin-bottom: 1.5rem">
            <div class="ai-question">AI Follow-up:</div>
            <p>${aiQuestion}</p>
        </div>
        <div class="form-group">
            <label>Your Answer</label>
            <textarea id="user-answer" rows="3" placeholder="Provide more details..."></textarea>
        </div>
        <button id="final-submit" class="btn-primary">Submit Complaint</button>
    `;

    document.getElementById('final-submit').addEventListener('click', async () => {
        const userAnswer = document.getElementById('user-answer').value;
        try {
            await api.post('/complaints', { complaintText, aiQuestion, userAnswer });
            toast.show('Complaint submitted successfully!');
            navigate('my');
        } catch (err) {
            toast.error(err.message);
        }
    });
}

async function renderMyComplaints() {
    app.innerHTML = '<div class="loader"></div>';
    try {
        const complaints = await api.get('/complaints/my');
        app.innerHTML = `
            <div class="card card-large">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem">
                    <h2 style="margin: 0">My Complaints</h2>
                    <button onclick="navigate('submit')" class="btn-primary" style="width: auto; margin: 0; padding: 0.5rem 1rem">New Complaint</button>
                </div>
                <div id="complaints-list">
                    ${complaints.length ? complaints.map(c => `
                        <div class="complaint-item">
                            <div class="complaint-header">
                                <span class="complaint-date">${new Date(c.createdAt).toLocaleString()}</span>
                            </div>
                            <div class="complaint-text">${c.complaintText}</div>
                            <div class="ai-section">
                                <div class="ai-question">${c.aiQuestion}</div>
                                <div class="user-answer">${c.userAnswer}</div>
                            </div>
                        </div>
                    `).join('') : '<p style="text-align: center; color: var(--text-muted)">No complaints found.</p>'}
                </div>
            </div>
        `;
    } catch (err) {
        toast.error(err.message);
    }
}

async function renderAdminDashboard() {
    app.innerHTML = '<div class="loader"></div>';
    try {
        const complaints = await api.get('/admin/complaints');
        app.innerHTML = `
            <div class="card card-large">
                <h2>Admin Dashboard</h2>
                <div id="admin-list">
                    ${complaints.length ? complaints.map(c => `
                        <div class="complaint-item">
                            <div class="complaint-header">
                                <strong>${c.userName} (${c.userEmail})</strong>
                                <span class="complaint-date">${new Date(c.createdAt).toLocaleString()}</span>
                            </div>
                            <div class="complaint-text">${c.complaintText}</div>
                            <div class="ai-section">
                                <div class="ai-question">${c.aiQuestion}</div>
                                <div class="user-answer">${c.userAnswer}</div>
                            </div>
                        </div>
                    `).join('') : '<p style="text-align: center; color: var(--text-muted)">No complaints in system.</p>'}
                </div>
            </div>
        `;
    } catch (err) {
        toast.error(err.message);
    }
}

// --- Global Actions ---

document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
        await api.post('/auth/logout');
        toast.show('Logged out');
        checkSession();
    } catch (err) {
        toast.error(err.message);
    }
});

document.getElementById('nav-my-complaints').addEventListener('click', () => navigate('my'));
document.getElementById('nav-new-complaint').addEventListener('click', () => navigate('submit'));
document.getElementById('nav-admin').addEventListener('click', () => navigate('admin'));

// Initialize
checkSession();
window.navigate = navigate; // Export to global scope
