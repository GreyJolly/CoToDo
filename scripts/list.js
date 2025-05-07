function getAppData() {
	const data = localStorage.getItem('todoAppData');
	return data ? JSON.parse(data) : { lists: [] };
}

document.addEventListener('DOMContentLoaded', function () {
	const listId = getCurrentListId();
	renderListPage(listId);
});

function getCurrentListId() {
	const urlParams = new URLSearchParams(window.location.search);
	return urlParams.get('id') || 'list1';
}

function renderListPage(listId) {
	const appData = getAppData();
	const list = appData.lists.find(l => l.id === listId);

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
	setupDragAndDrop(listId);
}

function setupListPageEvents(listId) {
	// Remove old event listeners to prevent duplicates
	document.querySelectorAll('.task-item').forEach(task => {
		task.replaceWith(task.cloneNode(true));
	});

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

	// Set initial text
	listTitleElement.textContent = list.title || '';

	// Remove the readOnly handling (not needed for contenteditable)

	// Focus handler to select all text when editing
	listTitleElement.addEventListener('focus', function () {
		const range = document.createRange();
		range.selectNodeContents(this);
		const selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
	});

	// Blur handler to save changes
	listTitleElement.addEventListener('blur', function () {
		const newTitle = this.textContent.trim();
		list.title = newTitle;
		localStorage.setItem('todoAppData', JSON.stringify(appData));

		// If empty, show placeholder style
		if (!newTitle) {
			this.classList.add('placeholder');
		} else {
			this.classList.remove('placeholder');
		}
	});

	// Enter key handler
	listTitleElement.addEventListener('keydown', function (e) {
		if (e.key === 'Enter') {
			e.preventDefault();
			this.blur(); // This will trigger the blur handler above
		}
	});

	// Task item click - just navigate to task editor
	document.querySelectorAll('.task-item').forEach(taskItem => {
		taskItem.addEventListener('click', function (e) {
			// Don't navigate if clicking the checkbox
			if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') {
				return;
			}

			const taskId = taskItem.querySelector('input').id;
			const listId = getCurrentListId();
			window.location.href = `task.html?listId=${listId}&taskId=${taskId}`;
		});
	});

	// Back button
	document.querySelector('.backto-index')?.addEventListener('click', function(e) {
    e.preventDefault();
	document.querySelector('.backto-index')?.addEventListener('click', function(e) {
		e.preventDefault();
		
		const fromCalendar = localStorage.getItem('lastCalendarView');
		const lastCalendarDate = localStorage.getItem('lastCalendarDate');
		
		const urlParams = new URLSearchParams(window.location.search);
		const fromCalendarParam = urlParams.get('fromCalendar');
		
		if ((fromCalendar === 'true' || fromCalendarParam === 'true') && lastCalendarDate) {
			localStorage.removeItem('lastCalendarView');
			localStorage.removeItem('lastCalendarDate');
			
			window.location.href = `calendar.html?date=${lastCalendarDate}`;
		} else {
			window.location.href = 'index.html';
		}
	});
    
    // Check if we came from the calendar
    const lastCalendarDate = localStorage.getItem('lastCalendarDate');
    if (lastCalendarDate) {
        localStorage.removeItem('lastCalendarDate');
        window.location.href = `calendar.html?date=${lastCalendarDate}`;
    } else {
        window.location.href = 'index.html';
    }
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

function setupDragAndDrop(listId) {
	const incompleteContainer = document.querySelector('.incomplete-container .todo-list');
	const completeContainer = document.querySelector('.complete-container .todo-list');

	// Make containers drop zones with type checking
	[incompleteContainer, completeContainer].forEach(container => {
		container.addEventListener('dragover', e => {
			e.preventDefault();
			const draggable = document.querySelector('.dragging');
			const isDraggingComplete = draggable.querySelector('input').checked;
			const isTargetComplete = container === completeContainer;

			// Only allow drop if completion status matches
			if (isDraggingComplete === isTargetComplete) {
				const afterElement = getDragAfterElement(container, e.clientY);

				if (afterElement == null) {
					container.appendChild(draggable);
				} else {
					container.insertBefore(draggable, afterElement);
				}

				// Visual feedback
				const taskItems = container.querySelectorAll('.task-item:not(.dragging)');
				taskItems.forEach(item => item.classList.remove('over'));

				if (afterElement) {
					afterElement.classList.add('over');
				}
			}
		});

		container.addEventListener('dragleave', () => {
			const taskItems = container.querySelectorAll('.task-item');
			taskItems.forEach(item => item.classList.remove('over'));
		});
	});

	// Make tasks draggable
	document.querySelectorAll('.task-item').forEach(task => {
		task.setAttribute('draggable', true);

		task.addEventListener('dragstart', () => {
			task.classList.add('dragging');
		});

		task.addEventListener('dragend', () => {
			task.classList.remove('dragging');
			document.querySelectorAll('.task-item.over').forEach(item => {
				item.classList.remove('over');
			});
			updateTaskOrder(listId);
		});
	});
}

function getDragAfterElement(container, y) {
	const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];

	return draggableElements.reduce((closest, child) => {
		const box = child.getBoundingClientRect();
		const offset = y - box.top - box.height / 2;

		if (offset < 0 && offset > closest.offset) {
			return { offset: offset, element: child };
		} else {
			return closest;
		}
	}, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updateTaskOrder(listId) {
	const appData = getAppData();
	const list = appData.lists.find(l => l.id === listId);

	if (!list) return;

	// Get all tasks in their current DOM order
	const incompleteTasks = Array.from(document.querySelector('.incomplete-container .todo-list').children);
	const completeTasks = Array.from(document.querySelector('.complete-container .todo-list').children);

	// Rebuild the tasks array in the new order
	const newTasks = [];

	incompleteTasks.forEach(taskEl => {
		const taskId = taskEl.querySelector('input').id;
		const task = list.tasks.find(t => t.id === taskId);
		if (task) newTasks.push(task);
	});

	completeTasks.forEach(taskEl => {
		const taskId = taskEl.querySelector('input').id;
		const task = list.tasks.find(t => t.id === taskId);
		if (task) newTasks.push({ ...task, completed: true });
	});

	// Update the list and save
	list.tasks = newTasks;
	localStorage.setItem('todoAppData', JSON.stringify(appData));
}