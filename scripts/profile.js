document.addEventListener('DOMContentLoaded', function () {
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
		logoutButton.addEventListener('click', function () {
			logoutUser();
			window.location.href = 'login.html';
		});
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

	// Delete account button
	document.getElementById('delete-profile-button')?.addEventListener('click', function () {
		const currentUser = getCurrentUser();
		if (!currentUser) return;

		if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
			try {
				// Delete user data first
				deleteAllUserData(currentUser.id);

				// Then delete the account
				deleteUserAccount(currentUser.id);

				// Show confirmation and redirect
				alert('Your account has been deleted successfully.');
				window.location.href = 'login.html';
			} catch (error) {
				console.error('Account deletion failed:', error);
				alert('Failed to delete account. Please try again.');
			}
		}
	});

});