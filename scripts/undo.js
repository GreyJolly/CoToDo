class UndoSystem {
	constructor() {
		this.UNDO_TIMEOUT = 5000; // 5 seconds
		this.currentUndoTimer = null;
	}

	// Store a deleted item for potential undo
	storeDeletedItem(type, data) {
		const undoData = {
			type: type, // 'task', 'list', 'leave', or 'request'
			data: data,
			timestamp: Date.now(),
			originalLocation: data.originalLocation || null
		};

		localStorage.setItem('pendingUndo', JSON.stringify(undoData));
	}

	// Get pending undo data
	getPendingUndo() {
		const undoData = localStorage.getItem('pendingUndo');
		return undoData ? JSON.parse(undoData) : null;
	}

	// Clear pending undo
	clearPendingUndo() {
		localStorage.removeItem('pendingUndo');
		if (this.currentUndoTimer) {
			clearTimeout(this.currentUndoTimer);
			this.currentUndoTimer = null;
		}
	}

	// Show undo popup
	showUndoPopup(message, onUndo) {
		// Remove existing undo popup if any
		this.hideUndoPopup();

		// Create undo popup element
		const undoPopup = document.createElement('div');
		undoPopup.id = 'undo-popup';
		undoPopup.className = 'undo-popup';
		undoPopup.innerHTML = `
            <div class="undo-content">
                <span class="undo-message">${message}</span>
                <button class="undo-button" onclick="window.undoSystem.performUndo()">
                    <i class="fa-solid fa-undo"></i> Undo
                </button>
                <button class="undo-close" onclick="window.undoSystem.hideUndoPopup()">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>
            <div class="undo-progress-bar"></div>
        `;

		document.body.appendChild(undoPopup);

		// Store the undo callback
		this.currentUndoCallback = onUndo;

		// Animate in
		setTimeout(() => {
			undoPopup.classList.add('visible');
		}, 100);

		// Start progress bar animation
		const progressBar = undoPopup.querySelector('.undo-progress-bar');
		progressBar.style.animation = `undoProgress ${this.UNDO_TIMEOUT}ms linear forwards`;

		// Auto-hide after timeout
		this.currentUndoTimer = setTimeout(() => {
			this.hideUndoPopup();
			this.clearPendingUndo();
		}, this.UNDO_TIMEOUT);
	}

	// Hide undo popup
	hideUndoPopup() {
		const undoPopup = document.getElementById('undo-popup');
		if (undoPopup) {
			undoPopup.classList.remove('visible');
			setTimeout(() => {
				if (undoPopup.parentNode) {
					undoPopup.parentNode.removeChild(undoPopup);
				}
			}, 300);
		}

		if (this.currentUndoTimer) {
			clearTimeout(this.currentUndoTimer);
			this.currentUndoTimer = null;
		}
	}

	// Perform undo operation
	performUndo() {
		if (this.currentUndoCallback) {
			this.currentUndoCallback();
		}
		this.hideUndoPopup();
		this.clearPendingUndo();
	}

	// Initialize undo system on page load
	init() {
		// Check for pending undo on page load
		const pendingUndo = this.getPendingUndo();
		if (pendingUndo) {
			// Check if undo is still valid (not too old)
			const age = Date.now() - pendingUndo.timestamp;
			if (age < this.UNDO_TIMEOUT) {
				this.handlePendingUndo(pendingUndo);
			} else {
				this.clearPendingUndo();
			}
		}
	}

	// Handle pending undo based on type
	handlePendingUndo(undoData) {
		switch (undoData.type) {
			case 'task':
				this.showUndoPopup(
					`Task "${undoData.data.task.text || 'Untitled'}" deleted`,
					() => this.undoTaskDeletion(undoData.data)
				);
				break;
			case 'list':
				this.showUndoPopup(
					`List "${undoData.data.list.title || 'Untitled'}" deleted`,
					() => this.undoListDeletion(undoData.data)
				);
				break;
			case 'leave':
				this.showUndoPopup(
					`Left list "${undoData.data.list.title || 'Untitled'}"`,
					() => this.undoLeaveList(undoData.data)
				);
				break;
			case 'request':
				this.showUndoPopup(
					`Rejected request from ${undoData.data.request.fromUserName}`,
					() => this.undoRequestRejection(undoData.data)
				);
				break;
		}
	}

	// Undo task deletion
	undoTaskDeletion(taskData) {
		const appData = this._getAppData();
		const list = appData.lists.find(l => l.id === taskData.listId);

		if (list) {
			// Restore task to its original position
			if (taskData.originalIndex !== undefined && taskData.originalIndex < list.tasks.length) {
				list.tasks.splice(taskData.originalIndex, 0, taskData.task);
			} else {
				list.tasks.push(taskData.task);
			}

			localStorage.setItem('todoAppData', JSON.stringify(appData));

			// Refresh current page if we're on the list page
			if (window.location.pathname.includes('list.html')) {
				const currentListId = this._getCurrentListId();
				if (currentListId === taskData.listId && typeof renderListPage === 'function') {
					renderListPage(currentListId);
				}
			}

			// Refresh index page if we're there (tasks affect index display)
			if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
				this._forceRenderIndexPage();
			}

			// Show success message
			this.showSuccessMessage('Task restored');
		}
	}

	// Undo list deletion
	undoListDeletion(listData) {
		const appData = this._getAppData();

		// Restore list to its original position
		if (listData.originalIndex !== undefined && listData.originalIndex < appData.lists.length) {
			appData.lists.splice(listData.originalIndex, 0, listData.list);
		} else {
			appData.lists.push(listData.list);
		}

		localStorage.setItem('todoAppData', JSON.stringify(appData));

		// Always refresh index page after list restoration
		this._forceRenderIndexPage();

		// Show success message
		this.showSuccessMessage('List restored');
	}

	// Undo leaving a list
	undoLeaveList(leaveData) {
		const appData = this._getAppData();
		const list = appData.lists.find(l => l.id === leaveData.listId);

		if (list && leaveData.userContributorData) {
			// Restore user as contributor
			if (!list.contributors) {
				list.contributors = [];
			}

			// Add user back to contributors if not already there
			const existingContributor = list.contributors.find(c => c.id === leaveData.userContributorData.id);
			if (!existingContributor) {
				list.contributors.push(leaveData.userContributorData);
			}

			// Remove from leftLists
			const leftLists = JSON.parse(localStorage.getItem('leftLists')) || [];
			const updatedLeftLists = leftLists.filter(id => id !== leaveData.listId);
			localStorage.setItem('leftLists', JSON.stringify(updatedLeftLists));

			localStorage.setItem('todoAppData', JSON.stringify(appData));

			// Always refresh index page after rejoining list
			this._forceRenderIndexPage();

			// Show success message
			this.showSuccessMessage('Rejoined list');
		}
	}

	// Undo request rejection
	undoRequestRejection(requestData) {
		const currentRequests = JSON.parse(localStorage.getItem('collaborationRequests')) || [];

		// Restore the request to the list
		currentRequests.push(requestData.request);
		localStorage.setItem('collaborationRequests', JSON.stringify(currentRequests));

		// Refresh inbox page if we're there
		if (window.location.pathname.includes('inbox.html')) {
			this._forceRenderInboxPage();
		}

		// Show success message
		this.showSuccessMessage('Request restored');
	}

	// Show success message
	showSuccessMessage(message) {
		const successPopup = document.createElement('div');
		successPopup.className = 'undo-popup success-popup';
		successPopup.innerHTML = `
            <div class="undo-content">
                <i class="fa-solid fa-check-circle"></i>
                <span class="undo-message">${message}</span>
            </div>
        `;

		document.body.appendChild(successPopup);

		setTimeout(() => {
			successPopup.classList.add('visible');
		}, 100);

		setTimeout(() => {
			successPopup.classList.remove('visible');
			setTimeout(() => {
				if (successPopup.parentNode) {
					successPopup.parentNode.removeChild(successPopup);
				}
			}, 300);
		}, 2000);
	}

	// Helper methods to avoid conflicts with existing functions
	_getAppData() {
		const data = localStorage.getItem('todoAppData');
		return data ? JSON.parse(data) : { lists: [] };
	}

	_getCurrentListId() {
		const urlParams = new URLSearchParams(window.location.search);
		return urlParams.get('id') || urlParams.get('listId');
	}

	// Force re-render of index page, handling case where .notes-container doesn't exist
	_forceRenderIndexPage() {
		// Only run if we're on the index page
		if (!(window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname === '')) {
			return;
		}

		// IMPORTANT: Refresh the global appData variable by calling a refresh function if it exists
		if (typeof window.refreshAppData === 'function') {
			window.refreshAppData();
		}

		// Check if renderHomepage function exists
		if (typeof renderHomepage === 'function') {
			// First, ensure the main content structure exists
			const mainContent = document.querySelector('.main-content');
			if (mainContent) {
				// If there's no .notes-container, we need to recreate the proper structure
				let notesContainer = document.querySelector('.notes-container');
				if (!notesContainer) {
					// Recreate the main content structure
					mainContent.innerHTML = `
                        <div class="notes-container">
                        </div>
                    `;
				}
			}

			// Now render the homepage
			renderHomepage();

			// Setup events if the function exists
			if (typeof setupHomepageEvents === 'function') {
				setupHomepageEvents();
			}
		} else {
			// Fallback: try to manually update if renderHomepage doesn't exist
			console.warn('renderHomepage function not found, attempting manual update');
			this._manualIndexUpdate();
		}
	}

	// Force re-render of inbox page
	_forceRenderInboxPage() {
		// Only run if we're on the inbox page
		if (!window.location.pathname.includes('inbox.html')) {
			return;
		}

		// Check if loadCollaborationRequests function exists and call it
		if (typeof loadCollaborationRequests === 'function') {
			loadCollaborationRequests();
		} else {
			console.warn('loadCollaborationRequests function not found');
		}
	}

	// Fallback method for manual index update
	_manualIndexUpdate() {
		const mainContent = document.querySelector('.main-content');
		if (!mainContent) return;

		const appData = this._getAppData();
		const visibleLists = this._getVisibleLists(appData);

		if (visibleLists.length === 0) {
			mainContent.innerHTML = `
                <div class="empty-state">
                    <p>No lists saved press on the "+" button to create one</p>
                </div>
            `;
		} else {
			// Recreate notes container if it doesn't exist
			mainContent.innerHTML = `
                <div class="notes-container">
                </div>
            `;

			renderHomepage();
		}
	}

	// Helper to get visible lists (similar to getVisibleLists in index.js)
	_getVisibleLists(appData) {
		const leftLists = JSON.parse(localStorage.getItem('leftLists')) || [];
		return appData.lists.filter(list => !leftLists.includes(list.id));
	}
}

// Global undo system instance
window.undoSystem = new UndoSystem();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
	window.undoSystem.init();
});