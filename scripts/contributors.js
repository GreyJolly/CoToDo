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

const AUTO_ACCEPT_DELAY = 10;
const AUTO_ACCEPT_STORAGE_KEY = 'todoApp_autoAccept';
const RECENTLY_ADDED_KEY = 'todoApp_recentlyAdded';
const LAST_CHECK_TIME_KEY = 'todoApp_lastCheckTime';
const autoAcceptTimers = {};
let currentListId = '';

document.addEventListener('DOMContentLoaded', function () {
    
    
    currentListId = getCurrentListId();
    
    
    document.querySelector('.backto-list')?.addEventListener('click', function (e) {
        e.preventDefault();
        window.location.href = `list.html?id=${currentListId}`;
    });

    processOfflineAutoAccepts();
    
    setupAutoAcceptTimers();
    
    renderContributorsPage(currentListId);
    
    setInterval(() => {
        checkForAutoAccepts();
    }, 2000);
    
    localStorage.setItem(LAST_CHECK_TIME_KEY, Date.now().toString());
});

function getCurrentListId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('listId') || 'list1';
}

function getAppData() {
    const data = localStorage.getItem('todoAppData');
    return data ? JSON.parse(data) : { lists: [] };
}

function getCurrentUser() {
    return {
        id: 0,
        displayName: "Current User",
        avatarColor: "#4285F4",
        initialLetter: "C"
    };
}

function getAllUsers() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const currentUser = getCurrentUser();

    const allUsers = [...users, ...availableAccounts];

    return allUsers.filter(user => user.id !== currentUser.id);
}

function processOfflineAutoAccepts() {
    
    
    const autoAcceptData = getAutoAcceptData();
    const now = Date.now();
    const lastCheckTime = parseInt(localStorage.getItem(LAST_CHECK_TIME_KEY) || '0');
    
    const expiredItems = autoAcceptData.filter(item => item.acceptTime <= now && item.acceptTime > lastCheckTime);
    
    if (expiredItems.length > 0) {
        
        
        expiredItems.forEach(item => {
            
            acceptInvitation(item.userId, item.invitationId);
        });
        
        const remainingItems = autoAcceptData.filter(item => item.acceptTime > now);
        saveAutoAcceptData(remainingItems);
        
    }
}

function checkForAutoAccepts() {
    const recentlyAdded = getRecentlyAdded();
    
    if (recentlyAdded.length > 0 && recentlyAdded.some(item => item.listId === currentListId)) {
        
        
        renderContributorsPage(currentListId);
        
        clearRecentlyAdded();
    }
}

function renderContributorsPage(listId) {
    
    
    const appData = getAppData();
    const list = appData.lists.find(l => l.id === listId);
    const currentUser = getCurrentUser();

    if (!list) {
        console.error("List not found, redirecting to index");
        window.location.href = 'index.html';
        return;
    }

    if (!list.contributors) {
        list.contributors = [];
        localStorage.setItem('todoAppData', JSON.stringify(appData));
    }

    const isOwnerInContributors = list.contributors.some(c => c.id === list.ownerId);
    if (!isOwnerInContributors && list.ownerId) {
        
        
        const owner = {
            id: list.ownerId,
            name: currentUser.displayName,
            avatarColor: currentUser.avatarColor,
            initialLetter: currentUser.displayName.charAt(0).toUpperCase()
        };
        list.contributors.unshift(owner);
        localStorage.setItem('todoAppData', JSON.stringify(appData));
    }

    setupSearch(listId);

    renderUserList(listId, '', list.contributors, list.ownerId);
}

function setupSearch(listId) {
    const searchTextElement = document.querySelector('.search-friends-text');
    const searchButton = document.querySelector('.search-button');

    searchTextElement.contentEditable = true;
    searchTextElement.setAttribute('placeholder', 'Search users');

    searchTextElement.addEventListener('focus', () => {
        if (searchTextElement.textContent === 'Search users') {
            searchTextElement.textContent = '';
        }
    });

    searchTextElement.addEventListener('blur', () => {
        if (searchTextElement.textContent === '') {
            searchTextElement.textContent = 'Search users';
        }
    });

    searchTextElement.addEventListener('input', () => {
        const searchText = searchTextElement.textContent.toLowerCase().trim();
        const appData = getAppData();
        const list = appData.lists.find(l => l.id === listId);

        if (searchText === 'search users' || searchText === '') {
            renderUserList(listId, '', list?.contributors || [], list?.ownerId);
            return;
        }

        renderUserList(listId, searchText, list?.contributors || [], list?.ownerId);
    });

    searchButton.addEventListener('click', () => {
        const searchText = searchTextElement.textContent.toLowerCase().trim();
        const appData = getAppData();
        const list = appData.lists.find(l => l.id === listId);

        if (searchText === 'search users' || searchText === '') return;
        renderUserList(listId, searchText, list?.contributors || [], list?.ownerId);
    });
}

function renderUserList(listId, searchTerm = '', currentContributors = [], ownerId) {
    const userListContainer = document.querySelector('.friend-list');
    userListContainer.innerHTML = '';
    const allUsers = getAllUsers();
    const appData = getAppData();
    const list = appData.lists.find(l => l.id === listId);
    const currentUser = getCurrentUser();
    
    const recentlyAdded = getRecentlyAdded().filter(item => item.listId === listId)
                                          .map(item => item.userId);

    const currentSection = document.createElement('div');
    currentSection.className = 'contributors-section';
    currentSection.innerHTML = '<div class="section-title">Current Contributors</div>';
    
    const pendingSection = document.createElement('div');
    pendingSection.className = 'contributors-section pending-section';
    pendingSection.innerHTML = '<div class="section-title">Pending Invitations</div>';
    
    const searchSection = document.createElement('div');
    searchSection.className = 'search-section';
    
    const owner = currentContributors.find(c => c.id === ownerId);
    if (owner) {
        const ownerItem = document.createElement('div');
        ownerItem.className = 'friend-item owner';
        ownerItem.innerHTML = `
            <div class="friend-avatar" style="background-color: ${owner.avatarColor}">${owner.initialLetter}</div>
            <div class="friend-name">${owner.name}</div>
            <div class="contributor-status">Owner</div>
        `;
        
        if (!searchTerm || searchTerm === '' || owner.name.toLowerCase().includes(searchTerm.toLowerCase())) {
            currentSection.appendChild(ownerItem);
        }
    }

    const contributorsToShow = !searchTerm || searchTerm === '' 
        ? currentContributors.filter(c => c.id !== ownerId)
        : currentContributors.filter(c => 
            c.id !== ownerId && 
            c.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
    contributorsToShow.forEach(contributor => {
        const contributorItem = document.createElement('div');
        
        if (recentlyAdded.includes(contributor.id)) {
            contributorItem.className = 'friend-item contributor new-contributor';
        } else {
            contributorItem.className = 'friend-item contributor';
        }
        
        const isCurrentUser = contributor.id === currentUser.id;
        const isOwner = currentUser.id === ownerId;
        const isContributorOwner = contributor.id === ownerId;
        
        let actionButtonHtml = '';
        if (isCurrentUser && !isOwner) {
            actionButtonHtml = `
                <button class="leave-btn" data-user-id="${contributor.id}">
                    <i class="fa-solid fa-sign-out-alt"></i> Leave List
                </button>
            `;
        } else if (!isCurrentUser && !isContributorOwner) {
            actionButtonHtml = `
                <button class="remove-btn" data-user-id="${contributor.id}">
                    <i class="fa-solid fa-user-minus"></i> Remove
                </button>
            `;
        }
        
        contributorItem.innerHTML = `
            <div class="friend-avatar" style="background-color: ${contributor.avatarColor};">${contributor.initialLetter}</div>
            <div class="friend-name">${contributor.name}</div>
            <div class="contributor-toggle">
                ${actionButtonHtml}
            </div>
        `;

        const removeBtn = contributorItem.querySelector('.remove-btn');
        const leaveBtn = contributorItem.querySelector('.leave-btn');
        
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const userId = removeBtn.getAttribute('data-user-id');
                
                // Show the removal confirmation popup
                const popup = document.getElementById('remove-popup');
                if (popup) {
                    popup.style.display = 'flex';
                    
                    // Setup event listeners for the buttons
                    popup.querySelector('.cancel-popup-button').onclick = function() {
                        popup.style.display = 'none';
                    };

                    popup.querySelector('.confirm-button').onclick = function() {
                        removeContributor(listId, userId);
                        contributorItem.remove();
                        popup.style.display = 'none';
                    };

                    // Close popup when clicking outside
                    popup.onclick = function(e) {
                        if (e.target === popup) {
                            popup.style.display = 'none';
                        }
                    };
                }
            });
        }
        
        if (leaveBtn) {
            leaveBtn.addEventListener('click', () => {
                leaveList(listId, contributor.id);
            });
        }
        
        currentSection.appendChild(contributorItem);
    });
    
    if (searchTerm && searchTerm !== '' && contributorsToShow.length === 0 && 
        (!owner || !owner.name.toLowerCase().includes(searchTerm.toLowerCase()))) {
        const noMatchesMsg = document.createElement('div');
        noMatchesMsg.className = 'no-matches-msg';
        noMatchesMsg.textContent = `No contributors match "${searchTerm}"`;
        currentSection.appendChild(noMatchesMsg);
    }

    const sentInvitations = [];
    allUsers.forEach(user => {
        const userInvitations = JSON.parse(localStorage.getItem(`collaborationRequests_${user.id}`)) || [];
        const listInvitations = userInvitations.filter(inv => 
            inv.listId === listId && 
            inv.fromUserId === currentUser.id
        );
        
        listInvitations.forEach(inv => {
            sentInvitations.push({
                ...inv,
                toUserId: user.id,
                toUserName: user.displayName,
                toUserAvatarColor: user.avatarColor,
                toUserInitialLetter: user.displayName.charAt(0).toUpperCase()
            });
        });
    });

    if (sentInvitations.length > 0) {
        sentInvitations.forEach(invitation => {
            const invitationItem = document.createElement('div');
            invitationItem.className = 'friend-item invitation';
            invitationItem.id = `invitation-${invitation.toUserId}-${invitation.id}`;
            
            const autoAcceptData = getAutoAcceptData();
            const autoAcceptItem = autoAcceptData.find(item => 
                item.userId === invitation.toUserId && item.invitationId === invitation.id);
            
            let autoAcceptInfo = '';
            if (autoAcceptItem) {
                const now = Date.now();
                const timeLeft = Math.max(0, Math.ceil((autoAcceptItem.acceptTime - now) / 1000));
                if (timeLeft > 0) {
                    autoAcceptInfo = `<div class="auto-accept-timer">(Auto-accepts in ${timeLeft} seconds)</div>`;
                }
            }
            
            invitationItem.innerHTML = `
                <div class="friend-avatar" style="background-color: ${invitation.toUserAvatarColor || '#ccc'};">${invitation.toUserInitialLetter}</div>
                <div class="friend-name">${invitation.toUserName}</div>
                <div class="invitation-status">Invitation Sent ${autoAcceptInfo}</div>
                <div class="contributor-toggle">
                    <button class="cancel-invite-btn" data-user-id="${invitation.toUserId}" data-invite-id="${invitation.id}">
                        <i class="fa-solid fa-xmark"></i> Cancel
                    </button>
                </div>
            `;

            const cancelBtn = invitationItem.querySelector('.cancel-invite-btn');
            cancelBtn.addEventListener('click', () => {
                cancelInvitation(invitation.toUserId, invitation.id);
                invitationItem.remove();
                
                clearAutoAcceptTimer(invitation.toUserId, invitation.id);
            });
            pendingSection.appendChild(invitationItem);
        });
    } else if (!searchTerm || searchTerm === '') {
        const noInvitationsMsg = document.createElement('div');
        noInvitationsMsg.className = 'no-results-msg';
        noInvitationsMsg.textContent = 'No pending invitations';
        pendingSection.appendChild(noInvitationsMsg);
    }

    userListContainer.appendChild(currentSection);
    
    if (!searchTerm || searchTerm === '') {
        userListContainer.appendChild(pendingSection);
    }

    if (searchTerm && searchTerm !== 'search users') {
        searchSection.innerHTML = '<div class="section-title">Search Results</div>';
        
        const filteredUsers = allUsers.filter(user =>
            user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) &&
            user.id !== ownerId &&
            !currentContributors.some(c => c.id === user.id) && 
            !sentInvitations.some(inv => inv.toUserId === user.id)
        );

        if (filteredUsers.length === 0) {
            const noResultsMsg = document.createElement('div');
            noResultsMsg.className = 'no-results-msg';
            noResultsMsg.textContent = `No users found matching "${searchTerm}"`;
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
                    renderUserList(listId, '', list.contributors, list.ownerId);
                });

                searchSection.appendChild(userItem);
            });
        }
        
        userListContainer.appendChild(searchSection);
    } else if (!searchTerm) {
        const prompt = document.createElement('div');
        prompt.className = 'friends-prompt';
        prompt.textContent = 'Search for users to invite as collaborators';
        userListContainer.appendChild(prompt);
    }
}

function removeContributor(listId, userId) {
    const appData = getAppData();
    const list = appData.lists.find(l => l.id === listId);

    if (!list || userId === list.ownerId) {
        console.error("Cannot remove the list owner");
        return;
    }

    if (!list.contributors) {
        list.contributors = [];
    }

    list.contributors = list.contributors.filter(c => c.id !== userId);
    localStorage.setItem('todoAppData', JSON.stringify(appData));
}

function leaveList(listId, userId) {
    const appData = getAppData();
    const list = appData.lists.find(l => l.id === listId);
    const currentUser = getCurrentUser();

    if (!list) {
        console.error("List not found");
        return;
    }

    if (userId === list.ownerId) {
        console.error("Owner cannot leave their own list");
        return;
    }

    // Remove the user from contributors
    if (list.contributors) {
        list.contributors = list.contributors.filter(c => c.id !== userId);
    }

    // If the current user is leaving, mark the list as left
    if (userId === currentUser.id) {
        const leftLists = JSON.parse(localStorage.getItem('leftLists')) || [];
        
        if (!leftLists.includes(listId)) {
            leftLists.push(listId);
            localStorage.setItem('leftLists', JSON.stringify(leftLists));
        }

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }

    localStorage.setItem('todoAppData', JSON.stringify(appData));
}

function sendCollaborationInvite(listId, userId, listName) {
    
    
    const currentUser = getCurrentUser();
    const allUsers = getAllUsers();
    const targetUser = allUsers.find(u => u.id === userId) || 
                       availableAccounts.find(u => u.id === userId);

    if (!targetUser) {
        console.error("Target user not found");
        return;
    }

    const collaborationRequests = JSON.parse(localStorage.getItem(`collaborationRequests_${userId}`)) || [];

    const newInvitation = {
        id: Date.now().toString(),
        listId: listId,
        listName: listName,
        fromUserId: currentUser.id,
        fromUserName: currentUser.displayName,
        fromUserAvatarColor: currentUser.avatarColor,
        fromUserInitialLetter: currentUser.displayName.charAt(0).toUpperCase(),
        timestamp: Date.now()
    };

    collaborationRequests.push(newInvitation);
    localStorage.setItem(`collaborationRequests_${userId}`, JSON.stringify(collaborationRequests));

    scheduleAutoAccept(userId, newInvitation.id, AUTO_ACCEPT_DELAY);
    
}

function cancelInvitation(userId, invitationId) {
    
    
    const collaborationRequests = JSON.parse(localStorage.getItem(`collaborationRequests_${userId}`)) || [];
    
    const updatedRequests = collaborationRequests.filter(req => req.id !== invitationId);
    
    localStorage.setItem(`collaborationRequests_${userId}`, JSON.stringify(updatedRequests));
    
    clearAutoAcceptTimer(userId, invitationId);
}

function getRecentlyAdded() {
    const data = localStorage.getItem(RECENTLY_ADDED_KEY);
    return data ? JSON.parse(data) : [];
}

function addToRecentlyAdded(userId, listId) {
    
    
    const recentlyAdded = getRecentlyAdded();
    
    recentlyAdded.push({
        userId,
        listId,
        timestamp: Date.now()
    });
    
    localStorage.setItem(RECENTLY_ADDED_KEY, JSON.stringify(recentlyAdded));
}

function clearRecentlyAdded() {
    localStorage.setItem(RECENTLY_ADDED_KEY, JSON.stringify([]));
}

function acceptInvitation(userId, invitationId) {
    
    
    const user = availableAccounts.find(u => u.id === userId);
    
    if (!user) {
        console.error("User not found");
        return false;
    }
    
    const collaborationRequests = JSON.parse(localStorage.getItem(`collaborationRequests_${userId}`)) || [];
    
    const invitation = collaborationRequests.find(req => req.id === invitationId);
    
    if (!invitation) {
        console.error("Invitation not found");
        return false;
    }
    
    const appData = getAppData();
    const list = appData.lists.find(l => l.id === invitation.listId);
    
    if (!list) {
        console.error("List not found");
        return false;
    }
    
    if (!list.contributors) {
        list.contributors = [];
    }
    
    if (!list.contributors.some(c => c.id === userId)) {
        list.contributors.push({
            id: user.id,
            name: user.displayName,
            avatarColor: user.avatarColor || "#cccccc",
            initialLetter: user.displayName.charAt(0).toUpperCase()
        });
        
        localStorage.setItem('todoAppData', JSON.stringify(appData));
        
        const updatedRequests = collaborationRequests.filter(req => req.id !== invitationId);
        localStorage.setItem(`collaborationRequests_${userId}`, JSON.stringify(updatedRequests));
        
        clearAutoAcceptTimer(userId, invitationId);
        
        
        
        addToRecentlyAdded(userId, list.id);
        
        const invitationElement = document.getElementById(`invitation-${userId}-${invitationId}`);
        if (invitationElement) {
            invitationElement.remove();
        }
        
        
        if (currentListId === list.id) {
            renderContributorsPage(list.id);
        }
        
        return true;
    } else {
        
        return false;
    }
}

window.acceptInvitation = acceptInvitation;

function getAutoAcceptData() {
    const data = localStorage.getItem(AUTO_ACCEPT_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveAutoAcceptData(data) {
    localStorage.setItem(AUTO_ACCEPT_STORAGE_KEY, JSON.stringify(data));
}

function scheduleAutoAccept(userId, invitationId, delayInSeconds) {
    
    
    const acceptTime = Date.now() + (delayInSeconds * 1000);
    
    const autoAcceptData = getAutoAcceptData();
    
    const filteredData = autoAcceptData.filter(
        item => !(item.userId === userId && item.invitationId === invitationId)
    );
    
    filteredData.push({
        userId,
        invitationId,
        acceptTime
    });
    
    saveAutoAcceptData(filteredData);
    
    clearAutoAcceptTimer(userId, invitationId);
    
    const timerId = setTimeout(() => {
        
        acceptInvitation(userId, invitationId);
    }, delayInSeconds * 1000);
    
    autoAcceptTimers[`${userId}-${invitationId}`] = timerId;
}

function clearAutoAcceptTimer(userId, invitationId) {
    const key = `${userId}-${invitationId}`;
    if (autoAcceptTimers[key]) {
        
        clearTimeout(autoAcceptTimers[key]);
        delete autoAcceptTimers[key];
    }
    
    const autoAcceptData = getAutoAcceptData();
    const updatedData = autoAcceptData.filter(
        item => !(item.userId === userId && item.invitationId === invitationId)
    );
    saveAutoAcceptData(updatedData);
}

function setupAutoAcceptTimers() {
    
    
    const autoAcceptData = getAutoAcceptData();
    const now = Date.now();
    
    const validItems = autoAcceptData.filter(item => item.acceptTime > now);
    
    validItems.forEach(item => {
        const remainingTime = Math.max(0, Math.ceil((item.acceptTime - now) / 1000));
        
        
        
        if (remainingTime > 0) {
            const timerId = setTimeout(() => {
                
                acceptInvitation(item.userId, item.invitationId);
            }, remainingTime * 1000);
            
            autoAcceptTimers[`${item.userId}-${item.invitationId}`] = timerId;
        } else {
            
            acceptInvitation(item.userId, item.invitationId);
        }
    });
    
    const cleanedData = validItems.length < autoAcceptData.length ? validItems : autoAcceptData;
    saveAutoAcceptData(cleanedData);
    
    if (validItems.length > 0) {
    }
}