if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('./sw.js', { scope: './' })
			.then(registration => console.log('SW registered'))
			.catch(err => console.log('SW registration failed: ', err));
	});
}

const defaultData = {
	lists: [
		{
			id: 'list1',
			title: 'Shopping list',
			collaborators: ['E'],
			tasks: [
				{ id: 'task1', text: 'Meat', completed: false, dueDate: 'June 5 2025', assignee: 'G', priority: 'high' },
				{ id: 'task2', text: 'T-shirt', completed: false, assignee: 'W', priority: 'low' },
				{ id: 'task3', text: 'Apples', completed: false, startDate: 'May 30 2025', dueDate: 'June 5 2025', assignee: 'G' },
				{ id: 'task4', text: 'Eggs', completed: true, priority: 'high' }
			]
		},
		{
			id: 'list2',
			title: 'To do list',
			tasks: [
				{ id: 'task5', text: 'Pay the bill', completed: false },
				{ id: 'task6', text: 'Clean the house', completed: false },
				{ id: 'task7', text: 'Descale the coffee pot', completed: false },
				{ id: 'task8', text: 'Change alarm clock batteries', completed: false }
			]
		},
		{
			id: 'list3',
			title: 'University project list',
			tasks: [
				{ id: 'task9', text: 'User stories', completed: false },
				{ id: 'task10', text: 'Sketches', completed: false },
				{ id: 'task11', text: 'Programming', completed: false }
			]
		},
		{
			id: 'list4',
			title: 'Travel list',
			tasks: [
				{ id: 'task12', text: 'Research restaurants in Taranto', completed: false },
				{ id: 'task13', text: 'Buy tickets for MArTA', completed: false }
			]
		},
		{
			id: 'list5',
			title: 'Wish list',
			tasks: [
				{ id: 'task14', text: 'Learn to play piano', completed: false },
				{ id: 'task15', text: 'Write a book', completed: false }
			]
		}
	]
};

function saveAppData() {
	localStorage.setItem('todoAppData', JSON.stringify(appData));
}

// Initialize or load data
function initializeAppData() {
	const savedData = localStorage.getItem('todoAppData');
	return savedData ? JSON.parse(savedData) : defaultData;
}

let appData = initializeAppData();
saveAppData();

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
	renderHomepage();
	setupHomepageEvents();
	setupSearch();
});

function renderHomepage() {
	const notesContainer = document.querySelector('.notes-container');
	notesContainer.innerHTML = '';

	appData.lists.forEach(list => {
		const noteCard = document.createElement('div');
		noteCard.className = 'note-card';
		noteCard.dataset.listId = list.id;

		let html = `<h2>${list.title || 'New List'}</h2>`;

		// Show first few incomplete tasks
		const incompleteTasks = list.tasks.filter(task => !task.completed).slice(0, 3);
		incompleteTasks.forEach(task => {
			// Determine priority class
			let priorityClass = '';
			if (task.priority) {
				priorityClass = `priority-${task.priority.toLowerCase()}`;
			}

			html += `
		  <div class="task-item">
			<input type="checkbox" id="${task.id}" class="${priorityClass}">
			<label for="${task.id}">${task.text || "New Task"}</label>
		  </div>
		`;
		});

		// Show collaborators if any
		if (list.collaborators && list.collaborators.length > 0) {
			html += `<div class="collaborator">
		  <div class="collaborator-avatar">${list.collaborators[0]}</div>
		</div>`;
		}

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
			tasks: []
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
			return;
		}

		// Filter lists that match search term
		const filteredLists = appData.lists.filter(list => {
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

		// Show tasks that match the search term (up to 3)
		const matchingTasks = list.tasks.filter(task =>
			task.text.toLowerCase().includes(searchTerm)
		).slice(0, 3);

		matchingTasks.forEach(task => {
			let priorityClass = '';
			if (task.priority) {
				priorityClass = `priority-${task.priority.toLowerCase()}`;
			}

			// Highlight matching text in tasks
			const taskText = highlightText(task.text, searchTerm);

			html += `
                <div class="task-item">
                    <input type="checkbox" id="${task.id}" class="${priorityClass}" ${task.completed ? 'checked' : ''}>
                    <label for="${task.id}">${taskText}</label>
                </div>
            `;

		});

		// If no matching tasks but list title matches, show first few tasks
		if (matchingTasks.length === 0 && list.title.toLowerCase().includes(searchTerm)) {
			const incompleteTasks = list.tasks.filter(task => !task.completed).slice(0, 3);
			incompleteTasks.forEach(task => {
				let priorityClass = '';
				if (task.priority) {
					priorityClass = `priority-${task.priority.toLowerCase()}`;
				}

				html += `
                    <div class="task-item">
                        <input type="checkbox" id="${task.id}" class="${priorityClass}" ${task.completed ? 'checked' : ''}>
                        <label for="${task.id}">${task.text || "New Task"}</label>
                    </div>
                `;

			});
		}

		// Show collaborators if any
		if (list.collaborators && list.collaborators.length > 0) {
			html += `<div class="collaborator">
                <div class="collaborator-avatar">${list.collaborators[0]}</div>
            </div>`;
		}

		noteCard.innerHTML = html;
		notesContainer.appendChild(noteCard);
	});

	// Reattach event listeners to the new cards
	setupHomepageEvents();
}

function highlightText(text, searchTerm) {
	if (!searchTerm) return text;

	const regex = new RegExp(`(${searchTerm})`, 'gi');
	return text.replace(regex, '<span class="highlight">$1</span>');
}