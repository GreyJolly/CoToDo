function getAppData() {
	const data = localStorage.getItem('todoAppData');
	const defaultData = { lists: [] };
	const appData = data ? JSON.parse(data) : defaultData;

	// Ensure each list has a contributors array
	appData.lists.forEach(list => {
		if (!list.contributors) {
			list.contributors = [];
		}
	});

	return appData;
}
// Add this to your list.js file or script section
document.addEventListener('DOMContentLoaded', function () {
	const completeContainer = document.querySelector('.complete-container');
	const toggleButton = document.querySelector('.toggle-complete');

	if (completeContainer && toggleButton) {
		completeContainer.addEventListener('click', function (e) {
			if (e.target.closest('h3')) {
				completeContainer.classList.toggle('collapsed');

				// Update the icon
				const icon = completeContainer.querySelector('.toggle-complete');
				icon.classList.toggle('fa-chevron-right');
				icon.classList.toggle('fa-chevron-down');
			}
		});
	}
	renderListPage(getCurrentListId());
});

function getCurrentListId() {
	const urlParams = new URLSearchParams(window.location.search);
	return urlParams.get('id') || 'list1';
}

function updateParentTaskCompletion(taskId, listId) {
    const appData = getAppData();
    const list = appData.lists.find(l => l.id === listId);
    const task = list.tasks.find(t => t.id === taskId);

    if (!task || !task.subtasks || task.subtasks.length === 0) return;

    // Check if all subtasks are completed
    const allSubtasksCompleted = task.subtasks.every(subtask => subtask.completed);
    
    // Only update if there's a change
    if (task.completed !== allSubtasksCompleted) {
        task.completed = allSubtasksCompleted;
        localStorage.setItem('todoAppData', JSON.stringify(appData));
        renderListPage(listId); // Re-render to show the updated state
    }
}

function toggleSubtaskCompletion(taskId, subtaskIndex) {
    const appData = getAppData();
    const listId = getCurrentListId();
    const list = appData.lists.find(l => l.id === listId);
    const task = list.tasks.find(t => t.id === taskId);

    if (task && task.subtasks && task.subtasks[subtaskIndex]) {
        // Toggle the subtask status
        task.subtasks[subtaskIndex].completed = !task.subtasks[subtaskIndex].completed;
        localStorage.setItem('todoAppData', JSON.stringify(appData));
        
        // Update parent task completion
        updateParentTaskCompletion(taskId, listId);
    }
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
        // Create main task item
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
            <div class="task-right-container">
        `;

        // Add date if it exists
        if (task.startDate && task.dueDate) {
            html += `<span class="task-date">${task.startDate} - ${task.dueDate}</span>`;
        } else if (task.startDate) {
            html += `<span class="task-date">Due: ${task.startDate}</span>`;
        } else if (task.dueDate) {
            html += `<span class="task-date">Start: ${task.dueDate}</span>`;
        }

        // Add avatar for assignee
        if (task.assignee) {
            if (task.assignee === 'me') {
                html += `<div class="task-avatar" style="background-color: #ee7300;">M</div>`;
            } else {
                const contributor = list.contributors?.find(c => c.id === task.assignee);
                if (contributor) {
                    html += `<div class="task-avatar" style="background-color: ${contributor.avatarColor};">${contributor.initialLetter}</div>`;
                } else {
                    html += `<div class="task-avatar" style="background-color: #cccccc;">?</div>`;
                }
            }
        } else {
            html += '<div class="task-avatar-placeholder"></div>';
        }

        html += `</div>`;

        taskItem.innerHTML = html;

        // Create subtasks container if there are subtasks
        if (task.subtasks && task.subtasks.length > 0) {
            const subtasksContainer = document.createElement('div');
            subtasksContainer.className = 'subtasks-container';

			const connectorLine = document.createElement('div');
    		connectorLine.className = 'task-connector-line';
   			subtasksContainer.appendChild(connectorLine);

			task.subtasks.forEach((subtask, index) => {
				const subtaskItem = document.createElement('div');
				subtaskItem.className = 'subtask-item';
				
				subtaskItem.innerHTML = `
					<input type="checkbox" ${subtask.completed ? 'checked' : ''}
						onchange="toggleSubtaskCompletion('${task.id}', ${index})">
					<span class="subtask-label">${subtask.text}</span>
				`;
				
				subtasksContainer.appendChild(subtaskItem);
			});

			if (task.subtasks && task.subtasks.length > 0) {
    			updateParentTaskCompletion(task.id, listId);
			}

            // Append main task and subtasks to a container
            const taskContainer = document.createElement('div');
            taskContainer.className = 'task-container';
            taskContainer.appendChild(taskItem);
            taskContainer.appendChild(subtasksContainer);

            if (task.completed) {
                completeContainer.appendChild(taskContainer);
            } else {
                incompleteContainer.appendChild(taskContainer);
            }
        } else {
            // If no subtasks, just append the task
            if (task.completed) {
                completeContainer.appendChild(taskItem);
            } else {
                incompleteContainer.appendChild(taskItem);
            }
        }
    });

    setupListPageEvents(listId);
    setupDragAndDrop(listId);
}

function setupListPageEvents(listId) {
	document.querySelectorAll('.task-item').forEach(task => {
		task.replaceWith(task.cloneNode(true));
	});

	// Checkbox functionality
	document.querySelectorAll('.task-item input[type="checkbox"]').forEach(checkbox => {
		checkbox.addEventListener('change', function() {
			const appData = getAppData();
			const taskId = this.id;
			const list = appData.lists.find(l => l.id === listId);
			const task = list.tasks.find(t => t.id === taskId);

			if (task) {
				const newCompletedState = this.checked;
				task.completed = newCompletedState;
				
				// Update all subtasks to match parent task state
				if (task.subtasks && task.subtasks.length > 0) {
					task.subtasks.forEach(subtask => {
						subtask.completed = newCompletedState;
					});
				}
				
				localStorage.setItem('todoAppData', JSON.stringify(appData));
				renderListPage(listId);
			}
		});
	});

	const listTitleElement = document.querySelector('.list-text');
	const appData = getAppData();
	const list = appData.lists.find(l => l.id === listId);

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

		// Update placeholder style based on whether there's content
		if (newTitle === '') {
			this.textContent = 'New List'; // Reset to placeholder text
			this.classList.add('placeholder');
		} else {
			this.classList.remove('placeholder');
		}
	});

	// Enter key handler
	listTitleElement.addEventListener('keydown', function (e) {
		if (e.key === 'Enter') {
			e.preventDefault();
			// Remove placeholder class immediately when user starts typing
			if (this.classList.contains('placeholder')) {
				this.textContent = ''; // Clear placeholder text
				this.classList.remove('placeholder');
			}
			this.blur();
		}
	});

	listTitleElement.addEventListener('input', function () {
		// Remove placeholder style as soon as user starts typing
		if (this.classList.contains('placeholder')) {
			this.classList.remove('placeholder');
			// If the content is still the placeholder text, clear it
			if (this.textContent.trim() === 'New List') {
				this.textContent = '';
			}
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
	document.querySelector('.backto-index')?.addEventListener('click', function (e) {
		e.preventDefault();
		document.querySelector('.backto-index')?.addEventListener('click', function (e) {
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
		completed: false,
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

function deleteList() {
	const listId = getCurrentListId();
	const appData = getAppData();

	// Show the confirmation popup
	const popup = document.getElementById('delete-confirm-popup');
	popup.style.display = 'flex';

	// Close any other popups (if you have any)
	// document.querySelectorAll('.popup').forEach(p => {
	//     if (p.id !== 'delete-confirm-popup') p.style.display = 'none';
	// });

	// Setup event listeners for the buttons
	popup.querySelector('.cancel-button').onclick = function () {
		popup.style.display = 'none';
	};

	popup.querySelector('.confirm-button').onclick = function () {
		appData.lists = appData.lists.filter(list => list.id !== listId);
		localStorage.setItem('todoAppData', JSON.stringify(appData));
		popup.style.display = 'none';
		window.location.href = 'index.html';
	};

	// Close popup when clicking outside
	popup.onclick = function (e) {
		if (e.target === popup) {
			popup.style.display = 'none';
		}
	};
}

function getFriends() {
	const friends = localStorage.getItem('friends');
	return friends ? JSON.parse(friends) : [];
}