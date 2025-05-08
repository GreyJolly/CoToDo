// Predefined accounts
const availableAccounts = [
	{ id: 1, name: "Alice", avatarColor: "#FF9AA2", initialLetter: "A", isFriendly: true },
	{ id: 2, name: "Alexander", avatarColor: "#FFB347", initialLetter: "A", isFriendly: true },
	{ id: 3, name: "Audrey", avatarColor: "#B5EAD7", initialLetter: "A", isFriendly: true },
	{ id: 4, name: "Ava", avatarColor: "#C7CEEA", initialLetter: "A", isFriendly: false },
	{ id: 5, name: "Bob", avatarColor: "#FFDAC1", initialLetter: "B", isFriendly: true },
	{ id: 6, name: "Mary", avatarColor: "#b0ff30", initialLetter: "M", isFriendly: true },
	{ id: 7, name: "Hazel", avatarColor: "#5df7ff", initialLetter: "H", isFriendly: true },
	{ id: 8, name: "William", avatarColor: "#e4e128", initialLetter: "W", isFriendly: false },
	{ id: 9, name: "Ted", avatarColor: "#b89aff", initialLetter: "T", isFriendly: true },
	{ id: 10, name: "John", avatarColor: "#92c1ff", initialLetter: "J", isFriendly: false }
];

// Initialize local storage
function initializeStorage() {
	if (!localStorage.getItem('friends')) {
		localStorage.setItem('friends', JSON.stringify([]));
	}
	if (!localStorage.getItem('friendRequests')) {
		localStorage.setItem('friendRequests', JSON.stringify([
			{ id: 7, name: "Hazel", avatarColor: "#5df7ff", initialLetter: "H", timestamp: Date.now() },
			{ id: 8, name: "William", avatarColor: "#e4e128", initialLetter: "W", timestamp: Date.now() }
		]));
	}
	if (!localStorage.getItem('pendingRequests')) {
		localStorage.setItem('pendingRequests', JSON.stringify([
			{ id: 9, name: "Ted", avatarColor: "#b89aff", initialLetter: "T", timestamp: Date.now() },
			{ id: 10, name: "John", avatarColor: "#92c1ff", initialLetter: "J", timestamp: Date.now() }
		]));
	}
}

// Load friends list
function loadFriends() {
	initializeStorage();
	const friends = JSON.parse(localStorage.getItem('friends'));
	const friendList = document.querySelector('.friend-list');
	friendList.innerHTML = '';

	if (friends.length === 0) {
		const emptyMsg = document.createElement('div');
		emptyMsg.className = 'no-results-msg';
		emptyMsg.textContent = 'No friends yet. Search for friends to add!';
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

function setupSearch() {
	const searchTextElement = document.querySelector('.search-friends-text');
	const searchButton = document.querySelector('.search-button');
	const friendList = document.querySelector('.friend-list');

	// Make search text editable and set placeholder behavior
	searchTextElement.contentEditable = true;
	searchTextElement.setAttribute('placeholder', 'Search new friends');

	// Clear placeholder on focus
	searchTextElement.addEventListener('focus', () => {
		if (searchTextElement.textContent === 'Search new friends') {
			searchTextElement.textContent = '';
		}
	});

	// Restore placeholder if empty on blur
	searchTextElement.addEventListener('blur', () => {
		if (searchTextElement.textContent === '') {
			searchTextElement.textContent = 'Search new friends';
		}
	});

	// Handle input events for dynamic search
	searchTextElement.addEventListener('input', () => {
		const searchText = searchTextElement.textContent.toLowerCase().trim();
		if (searchText === 'search new friends' || searchText === '') {
			loadFriends(); // Show all friends when search is empty
			return;
		}

		showSearchResults(searchText);
	});

	// Keep the search button click handler as fallback
	searchButton.addEventListener('click', () => {
		const searchText = searchTextElement.textContent.toLowerCase().trim();
		if (searchText === 'search new friends' || searchText === '') return;
		showSearchResults(searchText);
	});
}

function showSearchResults(searchText) {
	const friendList = document.querySelector('.friend-list');
	friendList.innerHTML = '';

	const currentFriends = JSON.parse(localStorage.getItem('friends'));
	const friendRequests = JSON.parse(localStorage.getItem('friendRequests'));
	const pendingRequests = JSON.parse(localStorage.getItem('pendingRequests'));

	const allFriendIds = [
		...currentFriends.map(f => f.id),
		...friendRequests.map(f => f.id),
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
			resultItem.className = 'friend-item search-result';
			resultItem.innerHTML = `
                <div class="friend-avatar" style="background-color: ${account.avatarColor};">${account.initialLetter}</div>
                <div class="friend-name">${account.name}</div>
                <button class="add-friend-btn"><i class="fa-solid fa-user-plus"></i></button>
            `;
			friendList.appendChild(resultItem);

			// Add click handler for the add friend button
			const addBtn = resultItem.querySelector('.add-friend-btn');
			addBtn.addEventListener('click', () => {
				addFriendRequest(account);
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
		noResultsMsg.textContent = 'No matching accounts found or already friends/requested';
		friendList.appendChild(noResultsMsg);
	}
}

function addFriendRequest(account) {
	const accountData = availableAccounts.find(a => a.id === account.id);

	if (accountData.isFriendly) {
		// Friendly account - auto-accept
		const friends = JSON.parse(localStorage.getItem('friends'));
		friends.push({
			id: account.id,
			name: account.name,
			avatarColor: account.avatarColor,
			initialLetter: account.initialLetter
		});
		localStorage.setItem('friends', JSON.stringify(friends));
		showConfirmation(`${account.name} accepted your friend request!`);
	} else {
		// Non-friendly account - add to pending
		const pendingRequests = JSON.parse(localStorage.getItem('pendingRequests'));
		if (!pendingRequests.some(r => r.id === account.id)) {
			pendingRequests.push({
				id: account.id,
				name: account.name,
				avatarColor: account.avatarColor,
				initialLetter: account.initialLetter,
				timestamp: Date.now()
			});
			localStorage.setItem('pendingRequests', JSON.stringify(pendingRequests));
			showConfirmation(`Friend request sent to ${account.name}!`);
		}
	}
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
document.addEventListener('DOMContentLoaded', () => {
	loadFriends();
	setupSearch();
});