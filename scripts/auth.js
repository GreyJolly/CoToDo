// Check if user is logged in and redirect if not
function checkAuth() {
	const isLoginPage = window.location.pathname.includes('login.html');
	const isSignupPage = window.location.pathname.includes('signup.html');

	if (!isLoginPage && !isSignupPage && !localStorage.getItem('loggedInUser')) {
		window.location.href = 'login.html';
	}
}

// Handle login
function handleLogin(username, password) {
	// In a real app, you would verify credentials properly
	const user = {
		username: username,
		email: username.includes('@') ? username : `${username}@example.com`,
		displayName: username.charAt(0).toUpperCase() + username.slice(1)
	};

	localStorage.setItem('loggedInUser', JSON.stringify(user));
	localStorage.setItem('isLoggedIn', 'true');

	window.location.href = 'index.html'; // Redirect to main page
}

// Handle logout
function handleLogout() {
	localStorage.removeItem('loggedInUser');
	localStorage.removeItem('isLoggedIn');
	window.location.href = 'login.html';
}

// Get current user
function getCurrentUser() {
	const user = localStorage.getItem('loggedInUser');
	return user ? JSON.parse(user) : null;
}

if (window.location.href != "login.html" || window.location.href != "signup.html") {
	document.addEventListener("DOMContentLoaded", checkAuth);
}