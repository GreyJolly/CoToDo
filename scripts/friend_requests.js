function loadFriendRequests() {
	const friendRequests = JSON.parse(localStorage.getItem('friendRequests'));
	const friendList = document.querySelector('.friend-list');
	friendList.innerHTML = '';

	// Setup search
	setupSearch(friendRequests, friendList);
}

function setupSearch(requests, container) {
	const searchTextElement = document.querySelector('.search-friends-text');
	const searchButton = document.querySelector('.search-button');

	// Make search text editable and set placeholder behavior
	searchTextElement.contentEditable = true;
	searchTextElement.setAttribute('placeholder', 'Search friend requests');

	// Clear placeholder on focus
	searchTextElement.addEventListener('focus', () => {
		if (searchTextElement.textContent === 'Search friend requests') {
			searchTextElement.textContent = '';
		}
	});

	// Restore placeholder if empty on blur
	searchTextElement.addEventListener('blur', () => {
		if (searchTextElement.textContent === '') {
			searchTextElement.textContent = 'Search friend requests';
		}
	});

	// Display all requests initially
	displayRequests(requests, container);

	// Handle search button click
	searchButton.addEventListener('click', () => {
		const searchText = searchTextElement.textContent.toLowerCase().trim();
		if (searchText === 'search friend requests' || searchText === '') {
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
		if (searchText === 'search friend requests' || searchText === '') {
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
            <div class="friend-actions">
                <button class="accept-btn"><i class="fa-solid fa-user-check"></i></button>
                <button class="reject-btn"><i class="fa-solid fa-user-xmark"></i></button>
            </div>
        `;
		container.appendChild(friendItem);

		// Add event listeners
		const acceptBtn = friendItem.querySelector('.accept-btn');
		const rejectBtn = friendItem.querySelector('.reject-btn');

		acceptBtn.addEventListener('click', () => {
			// Add to friends
			const friends = JSON.parse(localStorage.getItem('friends'));
			friends.push({
				id: request.id,
				name: request.name,
				avatarColor: request.avatarColor,
				initialLetter: request.initialLetter
			});
			localStorage.setItem('friends', JSON.stringify(friends));

			// Remove from requests
			const updatedRequests = requests.filter(r => r.id !== request.id);
			localStorage.setItem('friendRequests', JSON.stringify(updatedRequests));

			// Reload
			loadFriendRequests();
		});

		rejectBtn.addEventListener('click', () => {
			// Remove from requests
			const updatedRequests = requests.filter(r => r.id !== request.id);
			localStorage.setItem('friendRequests', JSON.stringify(updatedRequests));

			// Reload
			loadFriendRequests();
		});
	});
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
    } else if (currentPage === 'friends.html') {
        document.getElementById('friends-button').classList.add('active');
    } else if (currentPage === 'friend_requests.html') {
        document.getElementById('inbox-button1').classList.add('active');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    highlightCurrentPage();
});