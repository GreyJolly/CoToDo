// Initialize default collaboration requests
function initializeCollaborationRequests() {
	if (!localStorage.getItem('collaborationRequests')) {
		const currentUser = getCurrentUser();
		const initialRequests = [
			{
				id: "1",
				listId: "shared-list-1",
				listName: "Groceries",
				fromUserId: 7, // Hazel
				fromUserName: "Hazel",
				fromUserAvatarColor: "#5df7ff",
				fromUserInitialLetter: "H",
				timestamp: Date.now() - 86400000 // 1 day ago
			},
			{
				id: "2",
				listId: "shared-list-2",
				listName: "Project Tasks",
				fromUserId: 6, // Mary
				fromUserName: "Mary",
				fromUserAvatarColor: "#b0ff30",
				fromUserInitialLetter: "M",
				timestamp: Date.now() - 3600000 // 1 hour ago
			}
		];

		// Store requests for current user
		localStorage.setItem('collaborationRequests', JSON.stringify(initialRequests));

		// Also store them in the user-specific key for future use
		localStorage.setItem(`collaborationRequests_${currentUser.id}`, JSON.stringify(initialRequests));
	}
}

// Footer notification badge handler
class FooterNotificationHandler {
	constructor() {
		// Initialize collaboration requests first
		initializeCollaborationRequests();

		this.initializeBadges();
		this.attachEventListeners();
		this.startPolling();
	}

	initializeBadges() {
		// Add badges to all inbox buttons across pages
		const inboxButtons = document.querySelectorAll('#inbox-button1');
		inboxButtons.forEach(button => {
			if (!button.querySelector('.notification-badge')) {
				const badge = document.createElement('span');
				badge.className = 'notification-badge';
				badge.style.display = 'none';
				button.appendChild(badge);
			}
		});

		// Initial update
		this.updateBadge();
	}

	updateBadge() {
		const collaborationRequests = JSON.parse(localStorage.getItem('collaborationRequests')) || [];
		const badges = document.querySelectorAll('.notification-badge');

		badges.forEach(badge => {
			if (collaborationRequests.length > 0) {
				badge.textContent = collaborationRequests.length;
				badge.style.display = 'flex';
				// Add pulse animation for new notifications
				badge.classList.add('pulse');
				setTimeout(() => badge.classList.remove('pulse'), 600);
			} else {
				badge.style.display = 'none';
			}
		});
	}

	attachEventListeners() {
		// Listen for storage changes (for cross-tab updates)
		window.addEventListener('storage', (e) => {
			if (e.key === 'collaborationRequests') {
				this.updateBadge();
			}
		});

		// Listen for custom events from inbox.js
		window.addEventListener('collaborationRequestsUpdated', () => {
			this.updateBadge();
		});
	}

	startPolling() {
		// Check for updates every 5 seconds
		setInterval(() => {
			this.updateBadge();
		}, 5000);
	}
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
	window.footerNotificationHandler = new FooterNotificationHandler();
});

// Global function to trigger badge update
window.updateInboxBadge = function () {
	if (window.footerNotificationHandler) {
		window.footerNotificationHandler.updateBadge();
	}
};