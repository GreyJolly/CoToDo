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
			contributors: [
				{ id: 1, name: "Alice", avatarColor: "#FF9AA2", initialLetter: "A" },
				{ id: 5, name: "Bob", avatarColor: "#FFDAC1", initialLetter: "B" }
			],
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

		// Get all incomplete tasks
        const incompleteTasks = list.tasks.filter(task => !task.completed);
        const hasManyTasks = incompleteTasks.length > 3;
        const hasCollaborators = list.contributors && list.contributors.length > 0;

        // Show first 3 tasks normally
        const tasksToShow = incompleteTasks.slice(0, 3);
        tasksToShow.forEach(task => {
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

		// Show 4th task if exists (with normal spacing)
        if (hasManyTasks) {
            const fourthTask = incompleteTasks[3];
            let priorityClass = '';
            if (fourthTask.priority) {
                priorityClass = `priority-${fourthTask.priority.toLowerCase()}`;
            }

        }

        // Container for bottom elements (will contain 4th task + more + contributors)
        html += `<div class="bottom-elements-container">`;
        
        // Left side container (4th task + more indicator)
        html += `<div class="bottom-left-container">`;

        // More tasks indicator (now inside bottom container)
        if (incompleteTasks.length > 3) {
            const remainingCount = incompleteTasks.length - 3;
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

		// Show contributors if any (right-aligned with thin black border)
		if (list.contributors && list.contributors.length > 0) {
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

		noteCard.innerHTML = html;
		notesContainer.appendChild(noteCard);
	});

	setupHomepageEvents();
}

function highlightText(text, searchTerm) {
	if (!searchTerm) return text;

	const regex = new RegExp(`(${searchTerm})`, 'gi');
	return text.replace(regex, '<span class="highlight">$1</span>');
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