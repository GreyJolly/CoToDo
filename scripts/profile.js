document.addEventListener('DOMContentLoaded', function () {
	checkAuth();

	const currentUser = getCurrentUser();

	// Set profile information
	if (currentUser) {
		const avatar = document.querySelector('.account-avatar');
		const name = document.querySelector('.profile-name');

		if (avatar) avatar.textContent = currentUser.displayName.charAt(0);
		if (name) name.textContent = currentUser.displayName;
	}

	// Handle logout
	const logoutButton = document.querySelector('.logout');
	if (logoutButton) {
		logoutButton.addEventListener('click', handleLogout);
	}

	// Add click handlers for other buttons
	document.getElementById('modify-mail-button')?.addEventListener('click', () => {
		alert('Change email functionality would go here');
	});

	document.getElementById('modify-password-button')?.addEventListener('click', () => {
		alert('Change password functionality would go here');
	});

	document.getElementById('support-button')?.addEventListener('click', () => {
		alert('Support functionality would go here');
	});

	document.getElementById('delete-profile-button')?.addEventListener('click', () => {
		if (confirm('Are you sure you want to delete your account?')) {
			handleLogout();
			alert('Account deleted (simulated)');
		}
	});
});