// Key for storing all registered users
const USERS_STORAGE_KEY = 'todoAppUsers';
// Key for current logged in user
const CURRENT_USER_KEY = 'loggedInUser';

// Initialize users storage if empty
function initializeUsers() {
	if (!localStorage.getItem(USERS_STORAGE_KEY)) {
		localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([]));
	}
}

// Register a new user
function registerUser(email, username, password) {
	initializeUsers();
	const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY));

	// Check if username or email already exists
	const userExists = users.some(user =>
		user.username.toLowerCase() === username.toLowerCase() ||
		user.email.toLowerCase() === email.toLowerCase()
	);

	if (userExists) {
		throw new Error('Username or email already exists');
	}

	// Create new user object
	const newUser = {
		id: Date.now().toString(),
		email,
		username,
		password, // Note: In a real app, never store plain text passwords!
		displayName: username.charAt(0).toUpperCase() + username.slice(1),
		avatarColor: getRandomColor(),
		createdAt: new Date().toISOString()
	};

	// Save the new user
	users.push(newUser);
	localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

	return newUser;
}

// Authenticate user
function loginUser(identifier, password) {
	initializeUsers();
	const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY));

	// Find user by username or email
	const user = users.find(user =>
		(user.username.toLowerCase() === identifier.toLowerCase()) ||
		(user.email.toLowerCase() === identifier.toLowerCase())
	);

	if (!user) {
		throw new Error('User not found');
	}

	if (user.password !== password) { // In real app, use proper password hashing
		throw new Error('Invalid password');
	}

	// Store logged in user (without password)
	const { password: _, ...userWithoutPassword } = user;
	localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));

	return userWithoutPassword;
}

// Logout user
function logoutUser() {
	localStorage.removeItem(CURRENT_USER_KEY);
}


// Get current user
function getCurrentUser() {
	const user = localStorage.getItem(CURRENT_USER_KEY);
	return user ? JSON.parse(user) : null;
}

function getRandomColor() {
	return "#ee7300";
}

// Delete user account
function deleteUserAccount(userId) {
	initializeUsers();
	const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY));

	// Find user index
	const userIndex = users.findIndex(user => user.id === userId);
	if (userIndex === -1) {
		throw new Error('User not found');
	}

	// Remove user from storage
	users.splice(userIndex, 1);
	localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

	// If deleted user is currently logged in, log them out
	const currentUser = getCurrentUser();
	if (currentUser && currentUser.id === userId) {
		logoutUser();
	}

	return true;
}

// Delete all user data (lists, tasks, etc.)
function deleteAllUserData(userId) {
	// Get the app data
	const appData = JSON.parse(localStorage.getItem('todoAppData') || { lists: [] });

	// Filter out lists owned by this user
	appData.lists = appData.lists.filter(list => {
		// Keep lists that don't belong to this user
		return list.ownerId !== userId;

		// For shared lists where user is just a contributor:
		// return !list.contributors?.some(c => c.userId === userId);
	});

	// Save the cleaned data
	localStorage.setItem('todoAppData', JSON.stringify(appData));
}

document.addEventListener("DOMContentLoaded", function () {
	// Check if user is logged in and redirect if not
	const isLoginPage = window.location.pathname.includes('login.html');
	const isSignupPage = window.location.pathname.includes('signup.html');

	if (!isLoginPage && !isSignupPage && !localStorage.getItem(CURRENT_USER_KEY)) {
		window.location.href = 'login.html';
	}
});

