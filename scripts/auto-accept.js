class AutoAcceptSystem {
    constructor() {
        this.AUTO_ACCEPT_DELAY = 10000; // 10 seconds
        this.AUTO_ACCEPT_STORAGE_KEY = 'todoApp_autoAccept';
        this.RECENTLY_ACCEPTED_KEY = 'todoApp_recentlyAccepted';
        this.LAST_CHECK_TIME_KEY = 'todoApp_lastCheckTime';
        this.CHECK_INTERVAL = 1000; // Check every second
        this.activeTimers = {};
        this.checkInterval = null;
    }

    // Initialize the auto-accept system
    init() {
        // Process any offline auto-accepts
        this.processOfflineAutoAccepts();
        
        // Set up active timers for pending auto-accepts
        this.setupActiveTimers();
        
        // Start checking for new acceptances
        this.startChecking();
        
        // Update last check time
        localStorage.setItem(this.LAST_CHECK_TIME_KEY, Date.now().toString());
    }

    // Start checking for new acceptances and timer updates
    startChecking() {
        this.checkInterval = setInterval(() => {
            this.checkForNewAcceptances();
            this.updateTimerDisplays();
        }, this.CHECK_INTERVAL);
    }

    // Stop checking (cleanup)
    stopChecking() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    // Schedule an auto-accept
    scheduleAutoAccept(userId, invitationId, listId, listName, targetUserName) {
        const acceptTime = Date.now() + this.AUTO_ACCEPT_DELAY;
        
        const autoAcceptData = this.getAutoAcceptData();
        
        // Remove any existing entry for this invitation
        const filteredData = autoAcceptData.filter(
            item => !(item.userId === userId && item.invitationId === invitationId)
        );
        
        // Add new entry
        filteredData.push({
            userId,
            invitationId,
            listId,
            listName,
            targetUserName,
            acceptTime
        });
        
        this.saveAutoAcceptData(filteredData);
        
        // Clear any existing timer
        this.clearTimer(userId, invitationId);
        
        // Set new timer
        const timerId = setTimeout(() => {
            this.performAutoAccept(userId, invitationId);
        }, this.AUTO_ACCEPT_DELAY);
        
        this.activeTimers[`${userId}-${invitationId}`] = timerId;
    }

    // Cancel an auto-accept
    cancelAutoAccept(userId, invitationId) {
        this.clearTimer(userId, invitationId);
        
        const autoAcceptData = this.getAutoAcceptData();
        const updatedData = autoAcceptData.filter(
            item => !(item.userId === userId && item.invitationId === invitationId)
        );
        this.saveAutoAcceptData(updatedData);
    }

    // Clear a specific timer
    clearTimer(userId, invitationId) {
        const key = `${userId}-${invitationId}`;
        if (this.activeTimers[key]) {
            clearTimeout(this.activeTimers[key]);
            delete this.activeTimers[key];
        }
    }

    // Perform the auto-accept
    performAutoAccept(userId, invitationId) {
        const autoAcceptData = this.getAutoAcceptData();
        const acceptItem = autoAcceptData.find(
            item => item.userId === userId && item.invitationId === invitationId
        );
        
        if (!acceptItem) return;
        
        // Get user data
        const user = this.getUserById(userId);
        if (!user) return;
        
        // Get the invitation
        const collaborationRequests = JSON.parse(
            localStorage.getItem(`collaborationRequests_${userId}`)
        ) || [];
        const invitation = collaborationRequests.find(req => req.id === invitationId);
        
        if (!invitation) return;
        
        // Accept the invitation
        const success = this.acceptInvitation(user, invitation);
        
        if (success) {
            // Record the acceptance for notification
            this.recordAcceptance(acceptItem);
            
            // Remove from auto-accept data
            const updatedData = autoAcceptData.filter(
                item => !(item.userId === userId && item.invitationId === invitationId)
            );
            this.saveAutoAcceptData(updatedData);
            
            // Clear timer
            this.clearTimer(userId, invitationId);
        }
    }

    // Accept an invitation
    acceptInvitation(user, invitation) {
        const appData = this.getAppData();
        const list = appData.lists.find(l => l.id === invitation.listId);
        
        if (!list) return false;
        
        if (!list.contributors) {
            list.contributors = [];
        }
        
        // Check if already a contributor
        if (list.contributors.some(c => c.id === user.id)) {
            return false;
        }
        
        // Add as contributor
        list.contributors.push({
            id: user.id,
            name: user.displayName,
            avatarColor: user.avatarColor || "#cccccc",
            initialLetter: user.displayName.charAt(0).toUpperCase()
        });
        
        // Save updated data
        localStorage.setItem('todoAppData', JSON.stringify(appData));
        
        // Remove the invitation
        const collaborationRequests = JSON.parse(
            localStorage.getItem(`collaborationRequests_${user.id}`)
        ) || [];
        const updatedRequests = collaborationRequests.filter(req => req.id !== invitation.id);
        localStorage.setItem(`collaborationRequests_${user.id}`, JSON.stringify(updatedRequests));
        
        return true;
    }

    // Process any auto-accepts that should have happened while offline
    processOfflineAutoAccepts() {
        const autoAcceptData = this.getAutoAcceptData();
        const now = Date.now();
        const lastCheckTime = parseInt(localStorage.getItem(this.LAST_CHECK_TIME_KEY) || '0');
        
        const expiredItems = autoAcceptData.filter(
            item => item.acceptTime <= now && item.acceptTime > lastCheckTime
        );
        
        expiredItems.forEach(item => {
            this.performAutoAccept(item.userId, item.invitationId);
        });
    }

    // Set up timers for pending auto-accepts
    setupActiveTimers() {
        const autoAcceptData = this.getAutoAcceptData();
        const now = Date.now();
        
        autoAcceptData.forEach(item => {
            const remainingTime = item.acceptTime - now;
            
            if (remainingTime > 0) {
                const timerId = setTimeout(() => {
                    this.performAutoAccept(item.userId, item.invitationId);
                }, remainingTime);
                
                this.activeTimers[`${item.userId}-${item.invitationId}`] = timerId;
            }
        });
    }

    // Check for new acceptances and show notifications
    checkForNewAcceptances() {
        const recentlyAccepted = this.getRecentlyAccepted();
        const now = Date.now();
        
        // Show notifications for recent acceptances (within last 10 seconds)
        recentlyAccepted.forEach(acceptance => {
            if (!acceptance.notified && (now - acceptance.timestamp) < 10000) {
                this.showAcceptanceNotification(acceptance);
                acceptance.notified = true;
            }
        });
        
        // Clean up old acceptances (older than 30 seconds)
        const cleanedAcceptances = recentlyAccepted.filter(
            acceptance => (now - acceptance.timestamp) < 30000
        );
        
        this.saveRecentlyAccepted(cleanedAcceptances);
    }

    // Update timer displays on the current page
    updateTimerDisplays() {
        const autoAcceptData = this.getAutoAcceptData();
        const now = Date.now();
        
        autoAcceptData.forEach(item => {
            const timeLeft = Math.max(0, Math.ceil((item.acceptTime - now) / 1000));
            
            // Update timer display on contributors page
            const timerElement = document.querySelector(
                `#invitation-${item.userId}-${item.invitationId} .auto-accept-timer`
            );
            
            if (timerElement && timeLeft > 0) {
                timerElement.textContent = `(Auto-accepts in ${timeLeft} seconds)`;
            }
        });
    }

    // Show acceptance notification popup
    showAcceptanceNotification(acceptance) {
        // Remove any existing notification
        this.hideNotification();
        
        const notification = document.createElement('div');
        notification.id = 'auto-accept-notification';
        notification.className = 'auto-accept-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fa-solid fa-user-check"></i>
                <span class="notification-message">
                    <strong>${acceptance.targetUserName}</strong> joined 
                    <strong>${acceptance.listName}</strong>
                </span>
                <button class="notification-close" onclick="window.autoAcceptSystem.hideNotification()">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('visible');
        }, 100);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideNotification();
        }, 5000);
        
        // Refresh current page if needed
        this.refreshCurrentPage(acceptance.listId);
    }

    // Hide notification
    hideNotification() {
        const notification = document.getElementById('auto-accept-notification');
        if (notification) {
            notification.classList.remove('visible');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }

    // Refresh current page if relevant
    refreshCurrentPage(listId) {
        const currentPath = window.location.pathname;
        const urlParams = new URLSearchParams(window.location.search);
        const currentListId = urlParams.get('id') || urlParams.get('listId');
        
        // Refresh contributors page if viewing the same list
        if (currentPath.includes('contributors.html') && currentListId === listId) {
            if (typeof renderContributorsPage === 'function') {
                renderContributorsPage(listId);
            }
        }
        
        // Refresh list page if viewing the same list
        if (currentPath.includes('list.html') && currentListId === listId) {
            if (typeof renderListPage === 'function') {
                renderListPage(listId);
            }
        }
        
        // Always refresh index page when contributors change
        if (currentPath.includes('index.html') || currentPath === '/' || currentPath === '') {
            if (typeof renderHomepage === 'function') {
                renderHomepage();
            }
        }
    }

    // Record an acceptance for notification
    recordAcceptance(acceptItem) {
        const recentlyAccepted = this.getRecentlyAccepted();
        
        recentlyAccepted.push({
            userId: acceptItem.userId,
            listId: acceptItem.listId,
            listName: acceptItem.listName,
            targetUserName: acceptItem.targetUserName,
            timestamp: Date.now(),
            notified: false
        });
        
        this.saveRecentlyAccepted(recentlyAccepted);
    }

    // Helper methods
    getAutoAcceptData() {
        const data = localStorage.getItem(this.AUTO_ACCEPT_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    saveAutoAcceptData(data) {
        localStorage.setItem(this.AUTO_ACCEPT_STORAGE_KEY, JSON.stringify(data));
    }

    getRecentlyAccepted() {
        const data = localStorage.getItem(this.RECENTLY_ACCEPTED_KEY);
        return data ? JSON.parse(data) : [];
    }

    saveRecentlyAccepted(data) {
        localStorage.setItem(this.RECENTLY_ACCEPTED_KEY, JSON.stringify(data));
    }

    getAppData() {
        const data = localStorage.getItem('todoAppData');
        return data ? JSON.parse(data) : { lists: [] };
    }

    getUserById(userId) {
        // Available accounts from the system
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
        
        return availableAccounts.find(u => u.id === userId);
    }

    // Cleanup method
    cleanup() {
        this.stopChecking();
        
        // Clear all timers
        Object.keys(this.activeTimers).forEach(key => {
            clearTimeout(this.activeTimers[key]);
        });
        this.activeTimers = {};
    }
}

// Global auto-accept system instance
window.autoAcceptSystem = new AutoAcceptSystem();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.autoAcceptSystem.init();
});

// Cleanup when page unloads
window.addEventListener('beforeunload', function() {
    if (window.autoAcceptSystem) {
        window.autoAcceptSystem.cleanup();
    }
});