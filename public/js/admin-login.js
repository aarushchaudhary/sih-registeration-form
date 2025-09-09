document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.textContent = '';
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // --- Use the full URL for the API endpoint ---
        const response = await fetch('https://ai4health.netlify.app/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            // Save the token and redirect to the dashboard
            localStorage.setItem('adminToken', data.token);
            window.location.href = '/admin.html';
        } else {
            errorMessage.textContent = 'Login failed. Please check your credentials.';
        }
    });
});