window.addEventListener('pageshow', function(event) {
  // Check if page is loaded from cache
  if (event.persisted) {
    // Update your content
    loadFreshContent();
  }
});

// Predefined accounts
const availableAccounts = [
	{ id: 1, name: "Alice", avatarColor: "#FF9AA2", initialLetter: "A", isFriendly: true },
	{ id: 2, name: "Alexander", avatarColor: "#FFB347", initialLetter: "A", isFriendly: true },
	{ id: 3, name: "Audrey", avatarColor: "#B5EAD7", initialLetter: "A", isFriendly: true },
	{ id: 4, name: "Ava", avatarColor: "#C7CEEA", initialLetter: "A", isFriendly: false },
	{ id: 5, name: "Bob", avatarColor: "#FFDAC1", initialLetter: "B", isFriendly: false },
	{ id: 6, name: "Mary", avatarColor: "#b0ff30", initialLetter: "M", isFriendly: true },
	{ id: 7, name: "Hazel", avatarColor: "#5df7ff", initialLetter: "H", isFriendly: true },
	{ id: 8, name: "William", avatarColor: "#e4e128", initialLetter: "W", isFriendly: false },
	{ id: 9, name: "Ted", avatarColor: "#b89aff", initialLetter: "T", isFriendly: false },
	{ id: 10, name: "John", avatarColor: "#92c1ff", initialLetter: "J", isFriendly: false }
];

// Initialize local storage
function initializeStorage() {
	if (!localStorage.getItem('friends')) {
		localStorage.setItem('friends', JSON.stringify([]));
	}
	if (!localStorage.getItem('pendingRequests')) {
		localStorage.setItem('pendingRequests', JSON.stringify([]));
	}
	if (!localStorage.getItem('friendRequests')) {
		localStorage.setItem('friendRequests', JSON.stringify([
			{ id: 7, name: "Hazel", avatarColor: "#5df7ff", initialLetter: "H", isFriendly: true },
			{ id: 8, name: "William", avatarColor: "#e4e128", initialLetter: "W", isFriendly: false },
		]));
	}
}

// Load friends list
function loadFriends() {
	const friends = JSON.parse(localStorage.getItem('friends'));
	const friendList = document.getElementById('current-friends-list');
	friendList.innerHTML = '';

	if (friends.length === 0) {
		const emptyMsg = document.createElement('div');
		emptyMsg.className = 'no-results-msg';
		emptyMsg.textContent = 'No friends yet, you can search for friends to add';
		friendList.appendChild(emptyMsg);
		return;
	}

	friends.forEach(friend => {
		const friendItem = document.createElement('div');
		friendItem.className = 'friend-item';
		friendItem.innerHTML = `
            <div class="friend-avatar" style="background-color: ${friend.avatarColor};">${friend.initialLetter}</div>
            <div class="friend-name">${friend.name}</div>
        `;
		friendList.appendChild(friendItem);
	});
}

// Load pending requests
function loadPendingRequests() {
	const pendingRequests = JSON.parse(localStorage.getItem('pendingRequests'));
	const pendingList = document.getElementById('pending-requests-list');
	pendingList.innerHTML = '';

	if (pendingRequests.length === 0) {
		const emptyMsg = document.createElement('div');
		emptyMsg.className = 'no-results-msg';
		emptyMsg.textContent = 'No pending friend requests';
		pendingList.appendChild(emptyMsg);
		return;
	}

	pendingRequests.forEach(request => {
		const requestItem = document.createElement('div');
		requestItem.className = 'friend-item';
		requestItem.innerHTML = `
            <div class="friend-avatar" style="background-color: ${request.avatarColor};">${request.initialLetter}</div>
            <div class="friend-name">${request.name}</div>
            <button class="cancel-request-btn">Cancel</button>
        `;

		const cancelBtn = requestItem.querySelector('.cancel-request-btn');
		cancelBtn.addEventListener('click', () => {
			cancelRequest(request.id);
		});

		pendingList.appendChild(requestItem);
	});
}

// Cancel a pending request
function cancelRequest(id) {
	let pendingRequests = JSON.parse(localStorage.getItem('pendingRequests'));
	const request = pendingRequests.find(r => r.id === id);

	pendingRequests = pendingRequests.filter(r => r.id !== id);
	localStorage.setItem('pendingRequests', JSON.stringify(pendingRequests));

	showConfirmation(`Cancelled request to ${request.name}`);
	loadPendingRequests();
}

// Setup search functionality
function setupSearch() {
	const searchTextElement = document.querySelector('.search-friends-text');
	const searchButton = document.querySelector('.search-button');
	const searchClear = document.querySelector('.search-clear');
	const friendsTab = document.getElementById('friends-tab');
	const pendingTab = document.getElementById('pending-tab');

	// Make search text editable and set placeholder behavior
	searchTextElement.contentEditable = true;
	searchTextElement.setAttribute('placeholder', 'Search new friends');

	// Prevent newlines on Enter key and trigger search instead
	searchTextElement.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			const searchText = searchTextElement.textContent.toLowerCase().trim();
			if (searchText !== searchTextElement.getAttribute('placeholder').toLowerCase() && searchText !== '') {
				performSearch(searchText);
			}
		}
	});

	// Clear placeholder on focus
	searchTextElement.addEventListener('focus', () => {
		if (searchTextElement.textContent === searchTextElement.getAttribute('placeholder')) {
			searchTextElement.textContent = '';
		}
	});

	// Restore placeholder if empty on blur
	searchTextElement.addEventListener('blur', () => {
		if (searchTextElement.textContent === '') {
			searchTextElement.textContent = searchTextElement.getAttribute('placeholder');
		}
	});

	// Handle input events for dynamic search
	searchTextElement.addEventListener('input', () => {
		const searchText = searchTextElement.textContent.toLowerCase().trim();
		const isPlaceholder = searchText === searchTextElement.getAttribute('placeholder').toLowerCase();
		searchClear.style.display = (searchText !== '' && !isPlaceholder) ? 'block' : 'none';

		if (isPlaceholder || searchText === '') {
			if (friendsTab.classList.contains('active')) {
				loadFriends();
			} else {
				loadPendingRequests();
			}
			return;
		}

		performSearch(searchText);
	});

	// Clear search when X is clicked
	searchClear.addEventListener('click', () => {
		searchTextElement.textContent = searchTextElement.getAttribute('placeholder');
		searchClear.style.display = 'none';
		if (friendsTab.classList.contains('active')) {
			loadFriends();
		} else {
			loadPendingRequests();
		}
	});

	// Search button click handler
	searchButton.addEventListener('click', () => {
		const searchText = searchTextElement.textContent.toLowerCase().trim();
		if (searchText === searchTextElement.getAttribute('placeholder').toLowerCase() || searchText === '') return;
		performSearch(searchText);
	});

	// Update search placeholder when tab changes (without changing content)
	friendsTab.addEventListener('click', () => {
		const currentText = searchTextElement.textContent.trim();
		if (currentText === 'Search pending requests' || currentText === '') {
			searchTextElement.textContent = 'Search new friends';
		}
		searchTextElement.setAttribute('placeholder', 'Search new friends');
	});

	pendingTab.addEventListener('click', () => {
		const currentText = searchTextElement.textContent.trim();
		if (currentText === 'Search new friends' || currentText === '') {
			searchTextElement.textContent = 'Search pending requests';
		}
		searchTextElement.setAttribute('placeholder', 'Search pending requests');
	});

}

// Perform search based on active tab
function performSearch(searchText) {
	const friendsTab = document.getElementById('friends-tab');

	if (friendsTab.classList.contains('active')) {
		showFriendSearchResults(searchText);
	} else {
		showPendingSearchResults(searchText);
	}
}

// Show search results for friends tab
function showFriendSearchResults(searchText) {
	const friendList = document.getElementById('current-friends-list');
	friendList.innerHTML = '';

	const currentFriends = JSON.parse(localStorage.getItem('friends'));
	const pendingRequests = JSON.parse(localStorage.getItem('pendingRequests'));

	const allFriendIds = [
		...currentFriends.map(f => f.id),
		...pendingRequests.map(f => f.id)
	];

	// Find matching accounts that aren't already friends or requested
	const results = availableAccounts.filter(account =>
		account.name.toLowerCase().includes(searchText) &&
		!allFriendIds.includes(account.id)
	).slice(0, 3); // Show max 3 results

	if (results.length > 0) {
		results.forEach(account => {
			const resultItem = document.createElement('div');
			resultItem.className = 'friend-item';
			resultItem.innerHTML = `
				<div class="friend-avatar" style="background-color: ${account.avatarColor};">${account.initialLetter}</div>
				<div class="friend-name">${account.name}</div>
				<button class="add-friend-btn"><i class="fa-solid fa-user-plus"></i> Send request</button>
			`;
			friendList.appendChild(resultItem);

			// Add click handler for the add friend button
			const addBtn = resultItem.querySelector('.add-friend-btn');
			addBtn.addEventListener('click', () => {
				sendFriendRequest(account);
				resultItem.remove(); // Remove from results after sending request
			});
		});

		// Add a "no results" message if there are more accounts not shown
		if (results.length < availableAccounts.filter(a => !allFriendIds.includes(a.id)).length) {
			const moreResultsMsg = document.createElement('div');
			moreResultsMsg.className = 'more-results-msg';
			moreResultsMsg.textContent = '... and more. Try a more specific search.';
			friendList.appendChild(moreResultsMsg);
		}
	} else {
		const noResultsMsg = document.createElement('div');
		noResultsMsg.className = 'no-results-msg';
		noResultsMsg.textContent = 'No matching accounts found, or matches are already friends or requested';
		friendList.appendChild(noResultsMsg);
	}
}

// Show search results for pending tab
function showPendingSearchResults(searchText) {
	const pendingList = document.getElementById('pending-requests-list');
	pendingList.innerHTML = '';

	const pendingRequests = JSON.parse(localStorage.getItem('pendingRequests'));
	const results = pendingRequests.filter(request =>
		request.name.toLowerCase().includes(searchText)
	);

	if (results.length > 0) {
		results.forEach(request => {
			const requestItem = document.createElement('div');
			requestItem.className = 'friend-item';
			requestItem.innerHTML = `
				<div class="friend-avatar" style="background-color: ${request.avatarColor};">${request.initialLetter}</div>
				<div class="friend-name">${request.name}</div>
				<button class="cancel-request-btn">Cancel</button>
			`;

			const cancelBtn = requestItem.querySelector('.cancel-request-btn');
			cancelBtn.addEventListener('click', () => {
				cancelRequest(request.id);
			});

			pendingList.appendChild(requestItem);
		});
	} else {
		const noResultsMsg = document.createElement('div');
		noResultsMsg.className = 'no-results-msg';
		noResultsMsg.textContent = 'No matching pending requests found';
		pendingList.appendChild(noResultsMsg);
	}
}

// Send friend request
function sendFriendRequest(account) {
	const pendingRequests = JSON.parse(localStorage.getItem('pendingRequests'));

	// Check if request already exists
	if (pendingRequests.some(r => r.id === account.id)) {
		showConfirmation(`Request to ${account.name} already pending`);
		return;
	}

	// Add to pending requests
	const newRequest = {
		id: account.id,
		name: account.name,
		avatarColor: account.avatarColor,
		initialLetter: account.initialLetter,
		timestamp: Date.now()
	};

	pendingRequests.push(newRequest);
	localStorage.setItem('pendingRequests', JSON.stringify(pendingRequests));

	showConfirmation(`Friend request sent to ${account.name}!`);

	// If account is friendly, set up auto-accept after random delay
	if (account.isFriendly) {
		const delay = Math.floor(Math.random() * 8000) + 2000; // 2-10 seconds
		setTimeout(() => {
			acceptFriendRequest(account);
		}, delay);
	}
}

// Accept friend request (called automatically for friendly accounts)
function acceptFriendRequest(account) {
	let pendingRequests = JSON.parse(localStorage.getItem('pendingRequests'));
	let friends = JSON.parse(localStorage.getItem('friends'));

	// Check if request still exists
	if (!pendingRequests.some(r => r.id === account.id)) {
		return;
	}

	// Remove from pending
	pendingRequests = pendingRequests.filter(r => r.id !== account.id);
	localStorage.setItem('pendingRequests', JSON.stringify(pendingRequests));

	// Add to friends
	friends.push({
		id: account.id,
		name: account.name,
		avatarColor: account.avatarColor,
		initialLetter: account.initialLetter
	});
	localStorage.setItem('friends', JSON.stringify(friends));

	// Update UI
	loadPendingRequests();
	loadFriends();

	// Show notification
	showConfirmation(`${account.name} accepted your friend request!`);
}

// Show confirmation message
function showConfirmation(message) {
	const currentTab = document.querySelector('.tab-button.active').id;
	const listElement = currentTab === 'friends-tab' ?
		document.getElementById('current-friends-list') :
		document.getElementById('pending-requests-list');

	const confirmation = document.createElement('div');
	confirmation.className = 'confirmation-msg';
	confirmation.textContent = message;
	listElement.appendChild(confirmation);

	setTimeout(() => {
		confirmation.remove();
		if (currentTab === 'friends-tab') {
			loadFriends();
		} else {
			loadPendingRequests();
		}
	}, 2000);
}

// Setup tab switching
function setupTabs() {
	const friendsTab = document.getElementById('friends-tab');
	const pendingTab = document.getElementById('pending-tab');
	const friendsSection = document.getElementById('friends-section');
	const pendingSection = document.getElementById('pending-section');
	const searchTextElement = document.querySelector('.search-friends-text');

	friendsTab.addEventListener('click', () => {
		friendsTab.classList.add('active');
		pendingTab.classList.remove('active');
		friendsSection.style.display = 'block';
		pendingSection.style.display = 'none';
		searchTextElement.setAttribute('placeholder', 'Search new friends');

		// If there's a search query, perform the search
		const searchText = searchTextElement.textContent.trim();
		if (searchText !== '' && searchText !== 'Search pending requests') {
			if (searchText === 'Search new friends') {
				loadFriends();
			} else {
				performSearch(searchText);
			}
		} else {
			loadFriends();
		}
	});

	pendingTab.addEventListener('click', () => {
		pendingTab.classList.add('active');
		friendsTab.classList.remove('active');
		pendingSection.style.display = 'block';
		friendsSection.style.display = 'none';
		searchTextElement.setAttribute('placeholder', 'Search pending requests');

		// If there's a search query, perform the search
		const searchText = searchTextElement.textContent.trim();
		if (searchText !== '' && searchText !== 'Search new friends') {
			if (searchText === 'Search pending requests') {
				loadPendingRequests();
			} else {
				performSearch(searchText);
			}
		} else {
			loadPendingRequests();
		}
	});
}

// Highlight current page in footer
function highlightCurrentPage() {
	const currentPage = window.location.pathname.split('/').pop() || 'friends.html';

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

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
	initializeStorage();
	setupTabs();
	setupSearch();
	loadFriends();
	highlightCurrentPage();

	// Show friends section by default
	document.getElementById('friends-section').style.display = 'block';
});