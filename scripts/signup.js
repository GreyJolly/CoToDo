document.addEventListener('DOMContentLoaded', function () {
	const signupForm = document.querySelector('.signup-form form');

	if (signupForm) {
		signupForm.addEventListener('submit', function (e) {
			e.preventDefault();

			const email = document.getElementById('email').value.trim();
			const password = document.getElementById('password').value;
			const username = document.getElementById('username').value.trim();

			try {
				// Validate inputs
				if (!email || !password || !username) {
					throw new Error('Please fill in all fields');
				}

				// Validate email format
				if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
					throw new Error('Please enter a valid email address');
				}

				// Validate username format (alphanumeric with optional single hyphens)
				if (!/^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/.test(username)) {
					throw new Error('Username may only contain alphanumeric characters or single hyphens, and cannot begin or end with a hyphen');
				}

				// Validate password
				const isStrongPassword = password.length >= 15 ||
					(password.length >= 8 && /[a-z]/.test(password) && /\d/.test(password));

				if (!isStrongPassword) {
					throw new Error('Password should be at least 15 characters OR at least 8 characters including a number and a lowercase letter');
				}

				// Register the user
				const user = registerUser(email, username, password);

				// Login the user
				loginUser(user.email, password);

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