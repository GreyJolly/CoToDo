document.addEventListener('DOMContentLoaded', function () {
	const loginForm = document.getElementById('login-form');

	if (loginForm) {
		loginForm.addEventListener('submit', function (e) {
			e.preventDefault();

			const identifier = document.getElementById('username').value.trim();
			const password = document.getElementById('password').value;

			try {
				if (!identifier || !password) {
					throw new Error('Please enter both username/email and password');
				}

				// Attempt login
				loginUser(identifier, password);

				// Redirect to home page
				window.location.href = 'index.html';

			} catch (error) {
				alert(error.message);
			}
		});
	}
	
	// Toggle password visibility
    document.querySelectorAll('.toggle-password').forEach(icon => {
        icon.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);
            
            if (passwordInput) {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                
                // Cambia l'icona
                this.classList.toggle('fa-eye');
                this.classList.toggle('fa-eye-slash');
            }
        });
    });
});