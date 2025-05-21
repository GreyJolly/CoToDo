const availableAccounts = [
	{ id: 1, displayName: "Alice", avatarColor: "#FF9AA2", initialLetter: "A" },
	{ id: 2, displayName: "Alexander", avatarColor: "#FFB347", initialLetter: "A" },
	{ id: 3, displayName: "Audrey", avatarColor: "#B5EAD7", initialLetter: "A" },
	{ id: 4, displayName: "Ava", avatarColor: "#C7CEEA", initialLetter: "A" },
	{ id: 5, displayName: "Bob", avatarColor: "#FFDAC1", initialLetter: "B" },
	{ id: 6, displayName: "Mary", avatarColor: "#b0ff30", initialLetter: "M" },
	{ id: 7, displayName: "Hazel", avatarColor: "#5df7ff", initialLetter: "H" },
	{ id: 8, displayName: "William", avatarColor: "#e4e128", initialLetter: "W" },
	{ id: 9, displayName: "Ted", avatarColor: "#b89aff", initialLetter: "T" },
	{ id: 10, displayName: "John", avatarColor: "#92c1ff", initialLetter: "J" }
];

document.addEventListener('DOMContentLoaded', function () {
	const listId = getCurrentListId();
	renderContributorsPage(listId);
	// Back button
	document.querySelector('.backto-list')?.addEventListener('click', function (e) {
		e.preventDefault();
		const listId = getCurrentListId();
		window.location.href = `list.html?id=${listId}`;
	});
});

function getCurrentListId() {
	const urlParams = new URLSearchParams(window.location.search);
	return urlParams.get('listId') || 'list1';
}

function getAppData() {
	const data = localStorage.getItem('todoAppData');
	return data ? JSON.parse(data) : { lists: [] };
}

function getAllUsers() {
	const users = JSON.parse(localStorage.getItem('users')) || [];
	const currentUser = getCurrentUser();

	// Combine real users with our fictional accounts
	const allUsers = [...users, ...availableAccounts];

	return allUsers.filter(user => user.id !== currentUser.id); // Exclude current user
}

function renderContributorsPage(listId) {
	const appData = getAppData();
	const list = appData.lists.find(l => l.id === listId);
	const currentUser = getCurrentUser();

	if (!list) {
		window.location.href = 'index.html';
		return;
	}

	// Initialize contributors if not exists
	if (!list.contributors) {
		list.contributors = [];
		localStorage.setItem('todoAppData', JSON.stringify(appData));
	}

	// Add owner to contributors if not already present
	const isOwnerInContributors = list.contributors.some(c => c.id === list.ownerId);
	if (!isOwnerInContributors && list.ownerId) {
		const owner = {
			id: list.ownerId,
			name: currentUser.displayName,
			avatarColor: currentUser.avatarColor,
			initialLetter: currentUser.displayName.charAt(0).toUpperCase()
		};
		list.contributors.unshift(owner); // Add owner first
		localStorage.setItem('todoAppData', JSON.stringify(appData));
	}

	// Setup search functionality
	setupSearch(listId);

	// Render current contributors
	renderUserList(listId, '', list.contributors, list.ownerId);
}

function setupSearch(listId) {
	const searchTextElement = document.querySelector('.search-friends-text');
	const searchButton = document.querySelector('.search-button');

	// Make search text editable and set placeholder behavior
	searchTextElement.contentEditable = true;
	searchTextElement.setAttribute('placeholder', 'Search users');

	// Clear placeholder on focus
	searchTextElement.addEventListener('focus', () => {
		if (searchTextElement.textContent === 'Search users') {
			searchTextElement.textContent = '';
		}
	});

	// Restore placeholder if empty on blur
	searchTextElement.addEventListener('blur', () => {
		if (searchTextElement.textContent === '') {
			searchTextElement.textContent = 'Search users';
		}
	});

	// Handle input events for dynamic search
	searchTextElement.addEventListener('input', () => {
		const searchText = searchTextElement.textContent.toLowerCase().trim();
		const appData = getAppData();
		const list = appData.lists.find(l => l.id === listId);

		if (searchText === 'search users' || searchText === '') {
			renderUserList(listId, '', list?.contributors || []);
			return;
		}

		renderUserList(listId, searchText, list?.contributors || []);
	});

	// Keep the search button click handler as fallback
	searchButton.addEventListener('click', () => {
		const searchText = searchTextElement.textContent.toLowerCase().trim();
		const appData = getAppData();
		const list = appData.lists.find(l => l.id === listId);

		if (searchText === 'search users' || searchText === '') return;
		renderUserList(listId, searchText, list?.contributors || []);
	});
}

function renderUserList(listId, searchTerm = '', currentContributors = [], ownerId) {
    const userListContainer = document.querySelector('.friend-list');
    userListContainer.innerHTML = '';
    const allUsers = getAllUsers();
    const appData = getAppData();
    const list = appData.lists.find(l => l.id === listId);

    // Create sections
    const currentSection = document.createElement('div');
    currentSection.className = 'contributors-section';
    currentSection.innerHTML = '<div class="section-title">Current Contributors</div>';
    
    const searchSection = document.createElement('div');
    searchSection.className = 'search-section';
    
    // Show owner first
    const owner = currentContributors.find(c => c.id === ownerId);
    if (owner) {
        const ownerItem = document.createElement('div');
        ownerItem.className = 'friend-item owner';
        ownerItem.innerHTML = `
            <div class="friend-avatar" style="background-color: ${owner.avatarColor}">${owner.initialLetter}</div>
            <div class="friend-name">${owner.name}</div>
            <div class="contributor-status">Owner</div>
        `;
        currentSection.appendChild(ownerItem);
    }

    // Add current contributors (excluding owner)
    currentContributors
        .filter(c => c.id !== ownerId)
        .forEach(contributor => {
            const contributorItem = document.createElement('div');
            contributorItem.className = 'friend-item contributor';
            contributorItem.innerHTML = `
                <div class="friend-avatar" style="background-color: ${contributor.avatarColor};">${contributor.initialLetter}</div>
                <div class="friend-name">${contributor.name}</div>
                <div class="contributor-toggle">
                    <label class="switch">
                        <input type="checkbox" checked data-user-id="${contributor.id}">
                        <span class="slider round"></span>
                    </label>
                </div>
            `;

            const toggle = contributorItem.querySelector('input[type="checkbox"]');
            toggle.addEventListener('change', () => toggleContributor(listId, contributor.id, toggle.checked));
            currentSection.appendChild(contributorItem);
        });

    userListContainer.appendChild(currentSection);

    // Only show search section if there's a search term
    if (searchTerm && searchTerm !== 'search users') {
        searchSection.innerHTML = '<div class="section-title">Search Results</div>';
        
        // Filter users based on search term
        const filteredUsers = allUsers.filter(user =>
            user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) &&
            user.id !== ownerId && // Don't show owner
            !currentContributors.some(c => c.id === user.id) // Don't show existing contributors
        );

        if (filteredUsers.length === 0) {
            const noResultsMsg = document.createElement('div');
            noResultsMsg.className = 'no-results-msg';
            noResultsMsg.textContent = 'No matching users found';
            searchSection.appendChild(noResultsMsg);
        } else {
            filteredUsers.forEach(user => {
                const userItem = document.createElement('div');
                userItem.className = 'friend-item';
                userItem.innerHTML = `
                    <div class="friend-avatar" style="background-color: ${user.avatarColor};">${user.displayName.charAt(0)}</div>
                    <div class="friend-name">${user.displayName}</div>
                    <div class="contributor-actions">
                        <button class="invite-btn" data-user-id="${user.id}"><i class="fa-solid fa-envelope"></i>Invite to collaborate</button>
                    </div>
                `;

                const inviteBtn = userItem.querySelector('.invite-btn');
                inviteBtn.addEventListener('click', () => {
                    sendCollaborationInvite(listId, user.id, list.title || 'Untitled List');
                    userItem.remove();
                });

                searchSection.appendChild(userItem);
            });
        }
        
        userListContainer.appendChild(searchSection);
    } else if (!searchTerm) {
        // Show prompt when no search is active
        const prompt = document.createElement('div');
        prompt.className = 'friends-prompt';
        prompt.textContent = 'Search for users to invite as collaborators';
        userListContainer.appendChild(prompt);
    }
}

function toggleContributor(listId, userId, isContributor) {
	const appData = getAppData();
	const list = appData.lists.find(l => l.id === listId);
	const currentUser = getCurrentUser();

	if (!list) return;

	if (!list.contributors) {
		list.contributors = [];
	}

	if (isContributor) {
		// Add as contributor if not already
		const user = getAllUsers().find(u => u.id === userId);
		if (user && !list.contributors.some(c => c.id === userId)) {
			list.contributors.push({
				id: user.id,
				name: user.displayName,
				avatarColor: user.avatarColor,
				initialLetter: user.displayName.charAt(0).toUpperCase()
			});
		}
	} else {
		// Remove contributor
		list.contributors = list.contributors.filter(c => c.id !== userId);
	}

	localStorage.setItem('todoAppData', JSON.stringify(appData));
}

function sendCollaborationInvite(listId, userId, listName) {
	const currentUser = getCurrentUser();
	const allUsers = JSON.parse(localStorage.getItem('users')) || [];
	const targetUser = allUsers.find(u => u.id === userId);

	if (!targetUser) return;

	// Get or create collaboration requests for target user
	const collaborationRequests = JSON.parse(localStorage.getItem(`collaborationRequests_${userId}`)) || [];

	// Add new request
	collaborationRequests.push({
		id: Date.now().toString(),
		listId: listId,
		listName: listName,
		fromUserId: currentUser.id,
		fromUserName: currentUser.displayName,
		fromUserAvatarColor: currentUser.avatarColor,
		fromUserInitialLetter: currentUser.displayName.charAt(0).toUpperCase(),
		timestamp: Date.now()
	});

	localStorage.setItem(`collaborationRequests_${userId}`, JSON.stringify(collaborationRequests));

	// Show confirmation
	const confirmation = document.createElement('div');
	confirmation.className = 'confirmation-msg';
	confirmation.textContent = `Invitation sent to ${targetUser.displayName}`;
	document.querySelector('.friend-list').appendChild(confirmation);

	setTimeout(() => {
		confirmation.remove();
	}, 2000);
}