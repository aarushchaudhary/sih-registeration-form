document.addEventListener('DOMContentLoaded', () => {
    const teamsRegisteredEl = document.getElementById('teams-registered');
    const countdownEl = document.getElementById('countdown');
    const registerButtonContainer = document.getElementById('register-button-container');

    // --- 1. Fetch Stats ---
    fetch('/api/stats')
        .then(response => response.json())
        .then(data => {
            teamsRegisteredEl.textContent = data.teamsRegistered;

            // --- NEW: Show or hide the register button ---
            if (data.registrationsOpen) {
                registerButtonContainer.style.display = 'block';
            } else {
                registerButtonContainer.innerHTML = '<p style="font-weight: bold; color: #e60000;">Registrations are currently closed.</p>';
            }
        })
        .catch(error => console.error('Error fetching stats:', error));
});