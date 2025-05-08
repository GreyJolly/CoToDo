function loadPendingRequests() {
	const pendingRequests = JSON.parse(localStorage.getItem('pendingRequests'));
	const friendList = document.querySelector('.friend-list');
	friendList.innerHTML = '';

	// Setup search
	setupSearch(pendingRequests, friendList);
}

function setupSearch(requests, container) {
	const searchTextElement = document.querySelector('.search-friends-text');
	const searchButton = document.querySelector('.search-button');

	// Make search text editable and set placeholder behavior
	searchTextElement.contentEditable = true;
	searchTextElement.setAttribute('placeholder', 'Search pending requests');

	// Clear placeholder on focus
	searchTextElement.addEventListener('focus', () => {
		if (searchTextElement.textContent === 'Search pending requests') {
			searchTextElement.textContent = '';
		}
	});

	// Restore placeholder if empty on blur
	searchTextElement.addEventListener('blur', () => {
		if (searchTextElement.textContent === '') {
			searchTextElement.textContent = 'Search pending requests';
		}
	});

	// Display all requests initially
	displayRequests(requests, container);

	// Handle search button click
	searchButton.addEventListener('click', () => {
		const searchText = searchTextElement.textContent.toLowerCase().trim();
		if (searchText === 'search pending requests' || searchText === '') {
			displayRequests(requests, container);
			return;
		}

		const filtered = requests.filter(request =>
			request.name.toLowerCase().includes(searchText)
		);
		displayRequests(filtered, container);
	});

	// Handle input events for dynamic search
	searchTextElement.addEventListener('input', () => {
		const searchText = searchTextElement.textContent.toLowerCase().trim();
		if (searchText === 'search pending requests' || searchText === '') {
			displayRequests(requests, container); // Show all when empty
			return;
		}
		const filtered = requests.filter(request =>
			request.name.toLowerCase().includes(searchText)
		);
		displayRequests(filtered, container);
	});
}

function displayRequests(requests, container) {
	container.innerHTML = '';

	if (requests.length === 0) {
		const noResults = document.createElement('div');
		noResults.className = 'no-results-msg';
		noResults.textContent = 'No matching requests found';
		container.appendChild(noResults);
		return;
	}

	requests.forEach(request => {
		const friendItem = document.createElement('div');
		friendItem.className = 'friend-item';
		friendItem.innerHTML = `
		<div class="friend-avatar" style="background-color: ${request.avatarColor};">${request.initialLetter}</div>
		<div class="friend-name">${request.name}</div>
		<button class="cancel-request-btn"><i class="fa-solid fa-xmark"></i></button>
	`;

		const cancelBtn = friendItem.querySelector('.cancel-request-btn');
		cancelBtn.addEventListener('click', () => {
			const updatedRequests = requests.filter(r => r.id !== request.id);
			localStorage.setItem('pendingRequests', JSON.stringify(updatedRequests));
			showConfirmation(`Cancelled request to ${request.name}`);
		});
		container.appendChild(friendItem);
	});
}

function showConfirmation(message) {
	const friendList = document.querySelector('.friend-list');
	const confirmation = document.createElement('div');
	confirmation.className = 'confirmation-msg';
	confirmation.textContent = message;
	friendList.appendChild(confirmation);

	setTimeout(() => {
		confirmation.remove();
		loadFriends();
	}, 2000);
}

// Initialize the page
document.addEventListener('DOMContentLoaded', loadPendingRequests);