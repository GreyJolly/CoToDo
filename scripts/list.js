function getAppData() {
	const data = localStorage.getItem('todoAppData');
	return data ? JSON.parse(data) : { lists: [] };
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
	const listId = getCurrentListId();
	renderListPage(listId);
});

function getCurrentListId() {
	const urlParams = new URLSearchParams(window.location.search);
	return urlParams.get('id') || 'list1'; // Default to first list if no ID
}

function renderListPage(listId) {
	const appData = getAppData();
	const list = appData.lists.find(l => l.id === listId);

	// If list doesn't exist (shouldn't happen), redirect to homepage
	if (!list) {
		window.location.href = 'index.html';
		return;
	}

	const listTitleElement = document.querySelector('.list-text');
	listTitleElement.textContent = list.title || "New List";
	listTitleElement.classList.toggle('placeholder', !list.title);

	const incompleteContainer = document.querySelector('.incomplete-container .todo-list');
	const completeContainer = document.querySelector('.complete-container .todo-list');

	incompleteContainer.innerHTML = '';
	completeContainer.innerHTML = '';

	list.tasks.forEach(task => {
		const taskItem = document.createElement('div');
		taskItem.className = 'task-item';

		// Determine priority class
		let priorityClass = '';
		if (task.priority) {
			priorityClass = `priority-${task.priority.toLowerCase()}`;
		}

		let html = `
        <input type="checkbox" id="${task.id}" ${task.completed ? 'checked' : ''} class="${priorityClass}">
        <span class="task-label" data-task-id="${task.id}">${task.text || 'New Task'}</span>
        `;

		if (task.startDate && task.dueDate) {
			html += `<span class="task-date">${task.startDate} - ${task.dueDate}</span>`;
		} else {
			if (task.startDate) {
				html += `<span class="task-date">Due: ${task.startDate}</span>`;
			} else if (task.dueDate) {
				html += `<span class="task-date">Start: ${task.dueDate}</span>`;
			}
		}

		if (task.assignee) {
			const color = task.assignee === 'G' ? '#ff89d8' : '#FFC107';
			html += `<div class="task-avatar" style="background-color: ${color};">${task.assignee}</div>`;
		}

		taskItem.innerHTML = html;

		if (task.completed) {
			completeContainer.appendChild(taskItem);
		} else {
			incompleteContainer.appendChild(taskItem);
		}
	});
	setupListPageEvents(listId);
}

function setupListPageEvents(listId) {

	// Checkbox functionality
	document.querySelectorAll('.task-item input[type="checkbox"]').forEach(checkbox => {
		checkbox.addEventListener('change', function () {
			const appData = getAppData();
			const taskId = this.id;
			const list = appData.lists.find(l => l.id === listId);
			const task = list.tasks.find(t => t.id === taskId);

			if (task) {
				task.completed = this.checked;
				localStorage.setItem('todoAppData', JSON.stringify(appData));
				renderListPage(listId);
			}
		});
	});

	const listTitleElement = document.querySelector('.list-text');
	const appData = getAppData();
	const list = appData.lists.find(l => l.id === listId);

	// List name editing
	listTitleElement.addEventListener('focus', function () {
		if (this.classList.contains('placeholder')) {
			this.textContent = '';
			this.classList.remove('placeholder');
		}
	});

	listTitleElement.addEventListener('blur', function () {
		const newTitle = this.textContent.trim();
		list.title = newTitle;
		localStorage.setItem('todoAppData', JSON.stringify(appData));

		if (!newTitle) {
			this.textContent = "New List";
			this.classList.add('placeholder');
		}
	});

	listTitleElement.addEventListener('keydown', function (e) {
		if (e.key === 'Enter') {
			e.preventDefault();
			this.blur();
		}
	});

	// Task label click - just navigate to task editor
	document.querySelectorAll('.task-label').forEach(label => {
		label.addEventListener('click', function (e) {
			const taskId = e.target.getAttribute('data-task-id');
			const listId = getCurrentListId();
			window.location.href = `task.html?listId=${listId}&taskId=${taskId}`;
		});
	});

	// Back button
	document.querySelector('.backto-index')?.addEventListener('click', function (e) {
		e.preventDefault();
		window.location.href = 'index.html';
	});
}

function newTask() {
	const appData = getAppData();
	const listId = getCurrentListId();
	const list = appData.lists.find(l => l.id === listId);
	const newTaskId = 'task' + (list.tasks.length + 16);

	// Create a new empty task
	const newTask = {
		id: newTaskId,
		text: '',
		completed: false
	};

	// Add to the list and save
	list.tasks.push(newTask);
	localStorage.setItem('todoAppData', JSON.stringify(appData));

	// Navigate to the task editor
	window.location.href = `task.html?listId=${listId}&taskId=${newTaskId}`;
}