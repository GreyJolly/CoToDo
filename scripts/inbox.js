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

// Shared lists that can be accepted
function createDefaultSharedLists() {
	return {
		"shared-list-1": {
			id: "shared-list-1",
			title: "Groceries",
			tasks: [
				{
					id: "task-grocery-1",
					text: "Buy milk",
					completed: false,
					priority: "medium"
				},
				{
					id: "task-grocery-2",
					text: "Get fresh vegetables",
					completed: false,
					priority: "high"
				},
				{
					id: "task-grocery-3",
					text: "Pick up bread",
					completed: false,
					priority: "low"
				},
				{
					id: "task-grocery-4",
					text: "Buy olive oil",
					completed: false,
					priority: "medium"
				}
			],
			contributors: [
				{
					id: 7,
					name: "Hazel",
					avatarColor: "#5df7ff",
					initialLetter: "H"
				},
				{
					id: getCurrentUser().id,
					name: getCurrentUser().displayName,
					avatarColor: getCurrentUser().avatarColor,
					initialLetter: getCurrentUser().displayName.charAt(0).toUpperCase()
				}
			],
			ownerId: 7
		},
		"shared-list-2": {
			id: "shared-list-2",
			title: "Project Tasks",
			tasks: [
				{
					id: "task-project-1",
					text: "Review design mockups",
					completed: false,
					priority: "high"
				},
				{
					id: "task-project-2",
					text: "Update project documentation",
					completed: false,
					priority: "medium"
				},
				{
					id: "task-project-3",
					text: "Schedule team meeting",
					completed: false,
					priority: "high"
				},
				{
					id: "task-project-4",
					text: "Test new features",
					completed: false,
					priority: "medium"
				},
				{
					id: "task-project-5",
					text: "Prepare presentation slides",
					completed: false,
					priority: "low"
				}
			],
			contributors: [
				{
					id: 6,
					name: "Mary",
					avatarColor: "#b0ff30",
					initialLetter: "M"
				},
				{
					id: getCurrentUser().id,
					name: getCurrentUser().displayName,
					avatarColor: getCurrentUser().avatarColor,
					initialLetter: getCurrentUser().displayName.charAt(0).toUpperCase()
				}
			],
			ownerId: 6
		}
	};
}

function loadCollaborationRequests() {
	const collaborationRequests = JSON.parse(localStorage.getItem('collaborationRequests')) || [];
	const requestList = document.querySelector('.friend-list');
	requestList.innerHTML = '';

	// Setup search
	setupSearch(collaborationRequests, requestList);
}

function setupSearch(requests, container) {
	const searchTextElement = document.querySelector('.search-friends-text');
	const searchButton = document.querySelector('.search-button');
	const searchClear = document.querySelector('.search-clear');

	// Make search text editable and set placeholder behavior
	searchTextElement.contentEditable = true;
	searchTextElement.setAttribute('placeholder', 'Search collaboration requests');

	// Clear placeholder on focus
	searchTextElement.addEventListener('focus', () => {
		if (searchTextElement.textContent === 'Search collaboration requests') {
			searchTextElement.textContent = '';
		}
	});

	// Restore placeholder if empty on blur
	searchTextElement.addEventListener('blur', () => {
		if (searchTextElement.textContent === '') {
			searchTextElement.textContent = 'Search collaboration requests';
		}
	});

	// Display all requests initially
	displayRequests(requests, container);

	// Handle input events for dynamic search
	searchTextElement.addEventListener('input', () => {
		const searchText = searchTextElement.textContent.toLowerCase().trim();
		searchClear.style.display = (searchText !== '' && searchText !== 'search collaboration requests') ? 'block' : 'none';

		if (searchText === 'search collaboration requests' || searchText === '') {
			displayRequests(requests, container); // Show all when empty
			return;
		}

		const filtered = requests.filter(request =>
			request.fromUserName.toLowerCase().includes(searchText) ||
			request.listName.toLowerCase().includes(searchText)
		);
		displayRequests(filtered, container);
	});

	// Clear search when X is clicked
	searchClear.addEventListener('click', () => {
		searchTextElement.textContent = 'Search collaboration requests';
		searchClear.style.display = 'none';
		displayRequests(requests, container);
	});

	// Keep the search button click handler as fallback
	searchButton.addEventListener('click', () => {
		const searchText = searchTextElement.textContent.toLowerCase().trim();
		if (searchText === 'search collaboration requests' || searchText === '') {
			displayRequests(requests, container);
			return;
		}

		const filtered = requests.filter(request =>
			request.fromUserName.toLowerCase().includes(searchText) ||
			request.listName.toLowerCase().includes(searchText)
		);
		displayRequests(filtered, container);
	});
}

function displayRequests(requests, container) {
	container.innerHTML = '';

	if (requests.length === 0) {
		const noResults = document.createElement('div');
		noResults.className = 'no-results-msg';
		noResults.textContent = 'No pending collaboration requests';
		container.appendChild(noResults);
		return;
	}

	requests.forEach(request => {
		const requestItem = document.createElement('div');
		requestItem.className = 'friend-item';
		requestItem.innerHTML = `
            <div class="friend-avatar" style="background-color: ${request.fromUserAvatarColor}">${request.fromUserInitialLetter}</div>
            <div class="request-details">
                <div class="request-message">${request.fromUserName} invites you to collaborate on "${request.listName}"</div>
                <div class="request-timestamp">${formatTimestamp(request.timestamp)}</div>
            </div>
            <div class="friend-actions">
                <button class="accept-btn"><i class="fa-solid fa-check"></i></button>
                <button class="reject-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `;
		container.appendChild(requestItem);

		// Add event listeners
		const acceptBtn = requestItem.querySelector('.accept-btn');
		const rejectBtn = requestItem.querySelector('.reject-btn');

		acceptBtn.addEventListener('click', () => {
			// Get app data
			const appData = JSON.parse(localStorage.getItem('todoAppData')) || { lists: [] };
			const currentUser = getCurrentUser();
			const defaultSharedLists = createDefaultSharedLists();

			let sharedList = appData.lists.find(l => l.id === request.listId);

			if (!sharedList) {
				sharedList = defaultSharedLists[request.listId];
				if (sharedList) {
					const newList = JSON.parse(JSON.stringify(sharedList));
					appData.lists.push(newList);
				}
			}

			if (sharedList) {
				if (!sharedList.contributors) {
					sharedList.contributors = [];
				}
				const isAlreadyContributor = sharedList.contributors.some(c => c.id === currentUser.id);

				if (!isAlreadyContributor) {
					sharedList.contributors.push({
						id: currentUser.id,
						name: currentUser.displayName,
						avatarColor: currentUser.avatarColor,
						initialLetter: currentUser.displayName.charAt(0).toUpperCase()
					});
				}
			}
			localStorage.setItem('todoAppData', JSON.stringify(appData));

			// Remove from requests
			const updatedRequests = requests.filter(r => r.id !== request.id);
			localStorage.setItem('collaborationRequests', JSON.stringify(updatedRequests));

			// Reload
			loadCollaborationRequests();
		});

		rejectBtn.addEventListener('click', () => {
            // Show the rejection confirmation popup
            const popup = document.getElementById('reject-popup');
            if (popup) {
                popup.style.display = 'flex';
                
                // Setup event listeners for the buttons
                popup.querySelector('.cancel-popup-button').onclick = function () {
                    popup.style.display = 'none';
                };

                popup.querySelector('.confirm-button').onclick = function () {
                    // Remove from requests
                    const updatedRequests = requests.filter(r => r.id !== request.id);
                    localStorage.setItem('collaborationRequests', JSON.stringify(updatedRequests));
                    
                    // Close popup and reload
                    popup.style.display = 'none';
                    loadCollaborationRequests();
                };

                // Close popup when clicking outside
                popup.onclick = function (e) {
                    if (e.target === popup) {
                        popup.style.display = 'none';
                    }
                };
            }
        });
	});
}

function formatTimestamp(timestamp) {
	const now = new Date();
	const date = new Date(timestamp);
	const seconds = Math.floor((now - date) / 1000);

	const intervals = {
		year: 31536000,
		month: 2592000,
		week: 604800,
		day: 86400,
		hour: 3600,
		minute: 60
	};

	if (seconds > intervals.week) {
		return date.toLocaleDateString();
	}
	
	if (seconds > intervals.day * 2) {
		const days = Math.floor(seconds / intervals.day);
		return `${days} days ago`;
	} else if (seconds > intervals.day) {
		return 'Yesterday';
	} else if (seconds > intervals.hour) {
		const hours = Math.floor(seconds / intervals.hour);
		return hours === 1 ? 'An hour ago' : `${hours} hours ago`;
	} else if (seconds > intervals.minute) {
		const minutes = Math.floor(seconds / intervals.minute);
		return minutes === 1 ? 'A minute ago' : `${minutes} minutes ago`;
	} else {
		return 'Just now';
	}
}

function highlightCurrentPage() {
	const currentPage = window.location.pathname.split('/').pop() || 'index.html';

	document.querySelectorAll('.footer button').forEach(button => {
		button.classList.remove('active');
	});

	if (currentPage === 'index.html') {
		document.getElementById('list-button').classList.add('active');
	} else if (currentPage === 'calendar.html') {
		document.getElementById('calendar-button').classList.add('active');
	} else if (currentPage === 'inbox.html') {
		document.getElementById('inbox-button1').classList.add('active');
	}
}

document.addEventListener('DOMContentLoaded', function () {
	initializeCollaborationRequests();
	loadCollaborationRequests();
	highlightCurrentPage();
});