document.addEventListener('DOMContentLoaded', function() {
    const listId = getCurrentListId();
    renderContributorsPage(listId);
});

function getCurrentListId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('listId') || 'list1';
}

function getAppData() {
    const data = localStorage.getItem('todoAppData');
    return data ? JSON.parse(data) : { lists: [] };
}

function getFriends() {
    const friends = localStorage.getItem('friends');
    return friends ? JSON.parse(friends) : [];
}

function renderContributorsPage(listId) {
    const appData = getAppData();
    const list = appData.lists.find(l => l.id === listId);
    const friends = getFriends();
    
    if (!list) {
        window.location.href = 'index.html';
        return;
    }
    
    // Initialize contributors if not exists
    if (!list.contributors) {
        list.contributors = [];
        localStorage.setItem('todoAppData', JSON.stringify(appData));
    }
    
    // Setup search functionality
    setupSearch(listId);
    
    // Render current contributors
    renderFriendList(listId, friends, '', list.contributors);
}

function setupSearch(listId) {
    const searchTextElement = document.querySelector('.search-friends-text');
    const searchButton = document.querySelector('.search-button');
    
    // Make search text editable and set placeholder behavior
    searchTextElement.contentEditable = true;
    searchTextElement.setAttribute('placeholder', 'Search contributors');
    
    // Clear placeholder on focus
    searchTextElement.addEventListener('focus', () => {
        if (searchTextElement.textContent === 'Search contributors') {
            searchTextElement.textContent = '';
        }
    });
    
    // Restore placeholder if empty on blur
    searchTextElement.addEventListener('blur', () => {
        if (searchTextElement.textContent === '') {
            searchTextElement.textContent = 'Search contributors';
        }
    });
    
    // Handle input events for dynamic search
    searchTextElement.addEventListener('input', () => {
        const searchText = searchTextElement.textContent.toLowerCase().trim();
        const friends = getFriends();
        const appData = getAppData();
        const list = appData.lists.find(l => l.id === listId);
        
        if (searchText === 'search contributors' || searchText === '') {
            renderFriendList(listId, friends, '', list?.contributors || []);
            return;
        }
        
        renderFriendList(listId, friends, searchText, list?.contributors || []);
    });
    
    // Keep the search button click handler as fallback
    searchButton.addEventListener('click', () => {
        const searchText = searchTextElement.textContent.toLowerCase().trim();
        const friends = getFriends();
        const appData = getAppData();
        const list = appData.lists.find(l => l.id === listId);
        
        if (searchText === 'search contributors' || searchText === '') return;
        renderFriendList(listId, friends, searchText, list?.contributors || []);
    });
}

function renderFriendList(listId, friends, searchTerm = '', currentContributors = []) {
    const friendListContainer = document.querySelector('.friend-list');
    friendListContainer.innerHTML = '';
    
    // Always show "Me" first (the list owner)
    const meItem = document.createElement('div');
    meItem.className = 'friend-item owner';
    meItem.innerHTML = `
        <div class="friend-avatar" style="background-color: #ee7300;">M</div>
        <div class="friend-name">Me</div>
        <div class="contributor-status">Owner</div>
    `;
    friendListContainer.appendChild(meItem);
    
    // Filter friends based on search term
    const filteredFriends = friends.filter(friend => 
        friend.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (filteredFriends.length === 0 && searchTerm) {
        const noResultsMsg = document.createElement('div');
        noResultsMsg.className = 'no-results-msg';
        noResultsMsg.textContent = 'No matching friends found';
        friendListContainer.appendChild(noResultsMsg);
        return;
    }
    
    // Add friends to the list
    filteredFriends.forEach(friend => {
        const isContributor = currentContributors.some(c => c.id === friend.id);
        const friendItem = document.createElement('div');
        friendItem.className = 'friend-item';
        friendItem.innerHTML = `
            <div class="friend-avatar" style="background-color: ${friend.avatarColor};">${friend.initialLetter}</div>
            <div class="friend-name">${friend.name}</div>
            <div class="contributor-toggle">
                <label class="switch">
                    <input type="checkbox" ${isContributor ? 'checked' : ''} data-friend-id="${friend.id}">
                    <span class="slider round"></span>
                </label>
            </div>
        `;
        
        // Add toggle event
        const toggle = friendItem.querySelector('input[type="checkbox"]');
        toggle.addEventListener('change', () => toggleContributor(listId, friend.id, toggle.checked));
        
        friendListContainer.appendChild(friendItem);
    });
}

function toggleContributor(listId, friendId, isContributor) {
    const appData = getAppData();
    const list = appData.lists.find(l => l.id === listId);
    
    if (!list) return;
    
    if (!list.contributors) {
        list.contributors = [];
    }
    
    if (isContributor) {
        // Add as contributor if not already
        const friend = getFriends().find(f => f.id === friendId);
        if (friend && !list.contributors.some(c => c.id === friendId)) {
            list.contributors.push({
                id: friend.id,
                name: friend.name,
                avatarColor: friend.avatarColor,
                initialLetter: friend.initialLetter
            });
        }
    } else {
        // Remove contributor
        list.contributors = list.contributors.filter(c => c.id !== friendId);
    }
    
    localStorage.setItem('todoAppData', JSON.stringify(appData));
}

// Update the back button to include listId
document.querySelector('.backto-index')?.addEventListener('click', function(e) {
    e.preventDefault();
    const listId = getCurrentListId();
    window.location.href = `list.html?id=${listId}`;
});