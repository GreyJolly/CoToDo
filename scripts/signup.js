// scripts/signup.js
document.addEventListener('DOMContentLoaded', function () {
	const signupForm = document.querySelector('.signup-form form');

	if (signupForm) {
		signupForm.addEventListener('submit', function (e) {
			e.preventDefault();

			const email = document.getElementById('email').value;
			const password = document.getElementById('password').value;
			const username = document.getElementById('username').value;

			// Simple validation
			if (email && password && username) {
				// In a real app, you would create a proper user account
				handleLogin(username, password);
			} else {
				alert('Please fill in all fields');
			}
		});
	}
});