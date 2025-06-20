if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('./sw.js', { scope: './' })
			.then(registration => console.log('SW registered'))
			.catch(err => console.error('SW registration failed: ', err));
	});
}

function saveAppData() {
	localStorage.setItem('todoAppData', JSON.stringify(appData));
}

// Initialize or load data
function initializeAppData() {
	const savedData = localStorage.getItem('todoAppData');
	if (savedData) {
		return JSON.parse(savedData)
	}
	else {
		const emptyData = { lists: [] }
		return emptyData
	}
}

// Get lists that the current user has left
function getLeftLists() {
	return JSON.parse(localStorage.getItem('leftLists')) || [];
}

// Filter out lists that the user has left
function getVisibleLists() {
	const leftLists = getLeftLists();
	const freshAppData = initializeAppData(); // Get fresh data from localStorage
	return freshAppData.lists.filter(list => !leftLists.includes(list.id));
}

let appData = initializeAppData();
saveAppData();

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {

	// Set user avatar
	const currentUser = getCurrentUser();
	if (currentUser) {
		const avatarElement = document.getElementById('user-avatar');
		if (avatarElement) {
			avatarElement.textContent = currentUser.displayName.charAt(0).toUpperCase();
		}
	}

	renderHomepage();
	setupHomepageEvents();
	setupSearch();
	setupDragAndDrop();
});

function renderHomepage() {
	const mainContent = document.querySelector('.main-content');
	const notesContainer = document.querySelector('.notes-container');
	notesContainer.innerHTML = '';

	const visibleLists = getVisibleLists();

	if (visibleLists.length === 0) {
		mainContent.innerHTML = `
            <div class="empty-state">
                <p>No lists saved press on the "+" button to create one</p>
            </div>
        `;
		return;
	}

	visibleLists.forEach(list => {
		const noteCard = document.createElement('div');
		noteCard.className = 'note-card';
		noteCard.dataset.listId = list.id;

		let html = `<h2>${list.title || 'New List'}</h2>`;

		// Get all incomplete tasks
		const incompleteTasks = list.tasks.filter(task => !task.completed);
		const hasTasks = incompleteTasks.length > 0;
		const hasCollaborators = list.contributors && list.contributors.length > 0;

		if (!hasTasks) {
			// Show empty state message for this list
			html += `
                <div class="task-item" style="pointer-events: none; color: #666;">
                    No tasks for this list, press on the "+" button to add one
                </div>
            `;
		} else {
			// Show tasks normally
			const hasManyTasks = incompleteTasks.length > 3;
			const tasksToShow = incompleteTasks.slice(0, 3);

			tasksToShow.forEach(task => {
				let priorityClass = '';
				if (task.priority) {
					priorityClass = `priority-${task.priority.toLowerCase()}`;
				}

				html += `
                <div class="task-item">
                    <input type="checkbox" id="${task.id}" class="${priorityClass}">
                    <label for="${task.id}" title="${task.text}">${truncateTaskText(task.text) || "New Task"}</label>
                </div>
                `;
			});

			// Container for bottom elements (will contain more + contributors)
			html += `<div class="bottom-elements-container">`;

			// Left side container (more indicator)
			html += `<div class="bottom-left-container">`;

			// More tasks indicator
			if (hasManyTasks) {
				const remainingCount = incompleteTasks.length - 3;
				html += `
                    <div class="more-tasks-indicator">
                        +${remainingCount} more...
                    </div>
                `;
			}

			html += `</div>`;


		}

		// Contributors container (right side)
		if (hasCollaborators) {
			html += `<div class="contributors-container">`;

			const contributorsToShow = list.contributors.slice(0, 4);
			contributorsToShow.forEach((contributor, index) => {
				const offset = index * 15;
				html += `
                        <div class="contributor-avatar" 
                             style="background-color: ${contributor.avatarColor};
                                    right: ${offset}px">
                            ${contributor.initialLetter}
                        </div>
                    `;
			});

			if (list.contributors.length > 4) {
				const offset = 4 * 15;
				html += `
                        <div class="contributor-more" 
                             style="right: ${offset}px">
                            +${list.contributors.length - 4}
                        </div>
                    `;
			}

			html += `</div>`;
		}
		html += `</div>`;

		noteCard.innerHTML = html;
		notesContainer.appendChild(noteCard);
	});
}

function setupHomepageEvents() {
	// Click on note card to go to list page
	document.querySelectorAll('.note-card').forEach(card => {
		card.addEventListener('click', function (e) {
			if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'LABEL') {
				const listId = this.dataset.listId;
				window.location.href = `list.html?id=${listId}`;
			}
		});
	});

	// Checkbox functionality on homepage
	document.querySelectorAll('.note-card input[type="checkbox"]').forEach(checkbox => {
		checkbox.addEventListener('change', function () {
			const taskId = this.id;
			for (const list of appData.lists) {
				const task = list.tasks.find(t => t.id === taskId);
				if (task) {
					task.completed = this.checked;
					break;
				}
			}
			saveAppData();
		});
	});

	// Plus button to add new list
	document.getElementById('plus-button')?.addEventListener('click', function (e) {
		const newListId = 'list' + Date.now();
		const newList = {
			id: newListId,
			title: '',
			tasks: [],
			ownerId: getCurrentUser().id
		};
		appData.lists.push(newList);
		saveAppData();
		window.location.href = `list.html?id=${newListId}`; // Navigate to new list
	});
}

// Search functionality
function setupSearch() {
	const searchInput = document.querySelector('.search-input');
	const searchClear = document.querySelector('.search-clear');

	// Show/hide clear button based on input
	searchInput.addEventListener('input', function () {
		const hasText = this.value.trim().length > 0;
		searchClear.style.display = hasText ? 'block' : 'none';

		const searchTerm = this.value.toLowerCase().trim();

		if (searchTerm === '') {
			renderHomepage();
			setupHomepageEvents();
			return;
		}

		const visibleLists = getVisibleLists();
		const filteredLists = visibleLists.filter(list => {
			// Check if list title matches
			const titleMatch = list.title.toLowerCase().includes(searchTerm);

			// Check if any task text matches
			const taskMatch = list.tasks.some(task =>
				task.text.toLowerCase().includes(searchTerm)
			);

			return titleMatch || taskMatch;
		});

		renderSearchResults(filteredLists, searchTerm);
	});

	// Clear search when X is clicked
	searchClear.addEventListener('click', function () {
		searchInput.value = '';
		searchClear.style.display = 'none';
		renderHomepage();
		setupHomepageEvents();
	});
}

function renderSearchResults(lists, searchTerm) {
	const notesContainer = document.querySelector('.notes-container');
	notesContainer.innerHTML = '';

	if (lists.length === 0) {
		notesContainer.innerHTML = '<div class="no-results">No matching lists found</div>';
		return;
	}

	lists.forEach(list => {
		const noteCard = document.createElement('div');
		noteCard.className = 'note-card';
		noteCard.dataset.listId = list.id;

		// Highlight matching title
		let titleHtml = list.title || 'New List';
		if (searchTerm && list.title.toLowerCase().includes(searchTerm)) {
			titleHtml = highlightText(list.title, searchTerm);
		}

		let html = `<h2>${titleHtml}</h2>`;

		// Get all tasks that match the search term
		const matchingTasks = list.tasks.filter(task =>
			task.text.toLowerCase().includes(searchTerm)
		);

		// Or if title matches, show incomplete tasks
		const tasksToShow = matchingTasks.length > 0 ? matchingTasks :
			(list.title.toLowerCase().includes(searchTerm) ?
				list.tasks.filter(task => !task.completed) : []);

		const hasManyTasks = tasksToShow.length > 3;
		const hasCollaborators = list.contributors && list.contributors.length > 0;

		// Show first 3 tasks
		const visibleTasks = tasksToShow.slice(0, 3);
		visibleTasks.forEach(task => {
			let priorityClass = '';
			if (task.priority) {
				priorityClass = `priority-${task.priority.toLowerCase()}`;
			}

			const taskText = highlightText(task.text, searchTerm);
			const truncatedText = truncateTaskText(taskText);

			html += `
            <div class="task-item">
                <input type="checkbox" id="${task.id}" class="${priorityClass}" ${task.completed ? 'checked' : ''}>
                <label for="${task.id}" title="${task.text}">${truncatedText}</label>
            </div>
            `;
		});

		// Container for bottom elements
		html += `<div class="bottom-elements-container">`;

		// Left side container (4th task + more indicator)
		html += `<div class="bottom-left-container">`;

		// More tasks indicator
		if (tasksToShow.length > 3) {
			const remainingCount = tasksToShow.length - 3;
			html += `
                <div class="more-tasks-indicator">
                    +${remainingCount} more...
                </div>
            `;
		}

		html += `</div>`;

		// Contributors container (right side)
		if (hasCollaborators) {
			html += `<div class="contributors-container">`;

			const contributorsToShow = list.contributors.slice(0, 4);
			contributorsToShow.forEach((contributor, index) => {
				const offset = index * 15;
				html += `
                    <div class="contributor-avatar" 
                         style="background-color: ${contributor.avatarColor};
                                right: ${offset}px">
                        ${contributor.initialLetter}
                    </div>
                `;
			});

			if (list.contributors.length > 4) {
				const offset = 4 * 15;
				html += `
                    <div class="contributor-more" 
                         style="right: ${offset}px">
                        +${list.contributors.length - 4}
                    </div>
                `;
			}

			html += `</div>`;
		}
		html += `</div>`;

		noteCard.innerHTML = html;
		notesContainer.appendChild(noteCard);
	});

	setupHomepageEvents();
}

function truncateTaskText(text) {
	if (!text) return "New Task";
	const maxLength = 40;
	return text.length > maxLength ?
		text.substring(0, maxLength - 3) + '...' :
		text;
}

function highlightText(text, searchTerm) {
	if (!searchTerm) return text;

	const regex = new RegExp(`(${searchTerm})`, 'gi');
	return text.replace(regex, '<span class="highlight">$1</span>');
}

let draggedItem = null;
let draggedIndex = null;

function setupDragAndDrop() {
	const notesContainer = document.querySelector('.notes-container');
	const noteCards = document.querySelectorAll('.note-card');
	if (!notesContainer || !noteCards) {
		return;
	}

	noteCards.forEach((card, index) => {
		card.setAttribute('draggable', 'true');
		card.dataset.index = index;

		// Drag start
		card.addEventListener('dragstart', function (e) {
			draggedItem = this;
			draggedIndex = parseInt(this.dataset.index);
			this.classList.add('dragging');
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/html', this.innerHTML);
			this.style.opacity = '0.4';
		});

		// Drag end - cleanup
		card.addEventListener('dragend', function () {
			this.classList.remove('dragging');
			this.style.opacity = '1';
			document.querySelectorAll('.note-card').forEach(c => {
				c.classList.remove('over');
			});
			draggedItem = null;
			draggedIndex = null;
		});

		// Drag over - prevent default to allow drop
		card.addEventListener('dragover', function (e) {
			e.preventDefault();
			e.dataTransfer.dropEffect = 'move';
			return false;
		});

		// Drag enter - visual feedback
		card.addEventListener('dragenter', function (e) {
			e.preventDefault();
			if (this !== draggedItem) {
				// Remove 'over' class from all cards first
				document.querySelectorAll('.note-card').forEach(c => {
					if (c !== this) c.classList.remove('over');
				});
				// Then add to current hovered card
				this.classList.add('over');
			}
		});

		// Drag leave - remove visual feedback
		card.addEventListener('dragleave', function (e) {
			// Only remove if we're not entering a child element
			if (!this.contains(e.relatedTarget) && this !== draggedItem) {
				this.classList.remove('over');
			}
		});

		// Drop handler
		card.addEventListener('drop', function (e) {
			e.preventDefault();
			e.stopPropagation();

			// Remove any leftover over classes
			document.querySelectorAll('.note-card').forEach(c => {
				c.classList.remove('over');
			});

			if (draggedItem && this !== draggedItem) {
				// Get the bounding rectangles
				const targetRect = this.getBoundingClientRect();

				// Determine if we should place before or after
				const isAfter = (e.clientY - targetRect.top) > (targetRect.height / 2);

				// Swap the items in the DOM
				if (isAfter) {
					notesContainer.insertBefore(draggedItem, this.nextSibling);
				} else {
					notesContainer.insertBefore(draggedItem, this);
				}

				// Update data-index attributes
				document.querySelectorAll('.note-card').forEach((card, idx) => {
					card.dataset.index = idx;
				});

				// Update the order in appData
				const listId1 = draggedItem.dataset.listId;
				const listId2 = this.dataset.listId;

				const index1 = appData.lists.findIndex(list => list.id === listId1);
				const index2 = appData.lists.findIndex(list => list.id === listId2);

				if (index1 !== -1 && index2 !== -1) {
					// Move the dragged item to its new position
					const [movedList] = appData.lists.splice(index1, 1);
					const newIndex = index1 < index2 ? index2 : index2;
					appData.lists.splice(newIndex, 0, movedList);
					saveAppData();
				}
			}
			return false;
		});
	});

	// Container events to handle dropping at the end
	notesContainer.addEventListener('dragover', function (e) {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
		return false;
	});

	notesContainer.addEventListener('drop', function (e) {
		e.preventDefault();
		if (draggedItem) {
			// Remove any leftover over classes
			document.querySelectorAll('.note-card').forEach(c => {
				c.classList.remove('over');
			});

			// Move to the end
			notesContainer.appendChild(draggedItem);

			// Update data-index attributes
			document.querySelectorAll('.note-card').forEach((card, idx) => {
				card.dataset.index = idx;
			});

			// Update the order in appData
			const listId = draggedItem.dataset.listId;
			const index = appData.lists.findIndex(list => list.id === listId);

			if (index !== -1) {
				// Move to the end of the array
				const [movedList] = appData.lists.splice(index, 1);
				appData.lists.push(movedList);
				saveAppData();
			}
		}
		return false;
	});
}