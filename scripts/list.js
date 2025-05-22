const MAX_TITLE_LENGTH = 30;

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

function getCurrentUser() {
    return {
        id: 0,
        displayName: "Current User",
        avatarColor: "#4285F4",
        initialLetter: "C"
    };
}

document.addEventListener('DOMContentLoaded', function () {
	const completeContainer = document.querySelector('.complete-container');
	const toggleButton = document.querySelector('.toggle-complete');

	if (completeContainer && toggleButton) {
		completeContainer.addEventListener('click', function (e) {
			if (e.target.closest('h3')) {
				completeContainer.classList.toggle('collapsed');

				const icon = completeContainer.querySelector('.toggle-complete');
				icon.classList.toggle('fa-chevron-right');
				icon.classList.toggle('fa-chevron-down');
			}
		});
	}
	renderListPage(getCurrentListId());
	setupOwnershipBasedUI(getCurrentListId());

	const titleInput = document.querySelector('.list-title');
	if (titleInput.value == '') {
		titleInput.focus();
		setTimeout(titleInput.focus(), 300);
	}
});

function getCurrentListId() {
	const urlParams = new URLSearchParams(window.location.search);
	return urlParams.get('id') || 'list1';
}

function setupOwnershipBasedUI(listId) {
	const appData = getAppData();
	const list = appData.lists.find(l => l.id === listId);
	const currentUser = getCurrentUser();
	
	if (!list) return;
	
	const isOwner = list.ownerId === currentUser.id;
	const deleteListButton = document.getElementById('delete-list-button');
	
	if (isOwner) {
		deleteListButton.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
		deleteListButton.onclick = deleteList;
		deleteListButton.style.color = 'red';
	} else {
		deleteListButton.innerHTML = '<i class="fa-solid fa-sign-out-alt"></i>';
		deleteListButton.onclick = leaveCurrentList;
		deleteListButton.style.color = '#ff9800';
	}
}

function leaveCurrentList() {
	const listId = getCurrentListId();
	const currentUser = getCurrentUser();
	
	const popup = document.getElementById('leave-confirm-popup');
	if (!popup) {
		createLeaveConfirmPopup();
	}
	
	const leavePopup = document.getElementById('leave-confirm-popup');
	leavePopup.style.display = 'flex';
	
	leavePopup.querySelector('.cancel-button').onclick = function () {
		leavePopup.style.display = 'none';
	};

	leavePopup.querySelector('.confirm-button').onclick = function () {
		leaveList(listId, currentUser.id);
		leavePopup.style.display = 'none';
	};

	leavePopup.onclick = function (e) {
		if (e.target === leavePopup) {
			leavePopup.style.display = 'none';
		}
	};
}

function createLeaveConfirmPopup() {
	const popup = document.createElement('div');
	popup.id = 'leave-confirm-popup';
	popup.className = 'popup';
	popup.style.display = 'none';
	popup.innerHTML = `
		<div class="popup-content">
			<p>Are you sure you want to leave this list? You will no longer have access to it.</p>
			<div class="popup-buttons">
				<button class="popup-button cancel-button">Cancel</button>
				<button class="popup-button confirm-button" style="background-color: #ff9800;">Leave</button>
			</div>
		</div>
	`;
	document.body.appendChild(popup);
}

function leaveList(listId, userId) {
	console.log(`User ${userId} leaving list ${listId}`);
	
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

	if (list.contributors) {
		list.contributors = list.contributors.filter(c => c.id !== userId);
	}

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

	const listTitleElement = document.querySelector('.list-title');
	listTitleElement.value = list.title || "";
	listTitleElement.placeholder = "New List";

	const incompleteContainer = document.querySelector('.incomplete-container .todo-list');
	const completeContainer = document.querySelector('.complete-container .todo-list');

	incompleteContainer.innerHTML = '';
	completeContainer.innerHTML = '';

	setupListPageEvents(listId);

	// Check if there are no tasks
	if (list.tasks.length === 0) {
		const emptyMessage = document.createElement('div');
		emptyMessage.className = 'no-results-msg';
		emptyMessage.innerHTML = `
            <p>No tasks for this list, press on the "+" button to add one</p>
        `;
		incompleteContainer.appendChild(emptyMessage);

		// Hide the complete container when there are no tasks
		document.querySelector('.complete-container').style.display = 'none';
		return;
	} else {
		// Make sure complete container is visible when there are tasks
		document.querySelector('.complete-container').style.display = 'block';
	}

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
			html += `<span class="task-date">Start: ${task.startDate}</span>`;
		} else if (task.dueDate) {
			html += `<span class="task-date">Due: ${task.dueDate}</span>`;
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

	setupDragAndDrop(listId);
}

function setupListPageEvents(listId) {
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

	const listTitleElement = document.querySelector('.list-title');
	const appData = getAppData();
	const list = appData.lists.find(l => l.id === listId);

	// Input handler to save changes
	listTitleElement.addEventListener('input', debounce(function () {
		let newTitle = this.value.trim();

		// Ensure we don't save more than the allowed amount of characters
		if (newTitle.length > MAX_TITLE_LENGTH) {
			newTitle = newTitle.substring(0, MAX_TITLE_LENGTH);
			this.value = newTitle;
		}

		list.title = newTitle;
		localStorage.setItem('todoAppData', JSON.stringify(appData));
	}, 300));

	// Keypress handler for Enter key
	listTitleElement.addEventListener('keydown', function (e) {
		if (e.key === 'Enter') {
			e.preventDefault();
			this.blur();
		}
	});

	// Focus handler to select all text when editing
	listTitleElement.addEventListener('focus', function () {
		// Blur handler to ensure title is saved even if debounce doesn't run
		listTitleElement.addEventListener('blur', function () {
			let newTitle = this.value.trim();

			if (newTitle.length > MAX_TITLE_LENGTH) {
				newTitle = newTitle.substring(0, MAX_TITLE_LENGTH);
				this.value = newTitle;
			}

			list.title = newTitle;
			localStorage.setItem('todoAppData', JSON.stringify(appData));
		});

		this.select();
	});

	// Task item click - just navigate to task editor
	document.querySelectorAll('.task-item').forEach(taskItem => {
		const taskId = taskItem.querySelector('input').id;
		const listId = getCurrentListId();
		taskItem.addEventListener('click', function (e) {
			// Don't navigate if clicking the checkbox
			if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') {
				return;
			}
			window.location.href = `task.html?listId=${listId}&taskId=${taskId}`;
		});
	});

	// Task container click, for handling subtasks - just navigate to task editor
	document.querySelectorAll('.task-container').forEach(taskContainer => {
		const taskId = taskContainer.querySelector('input').id;
		const listId = getCurrentListId();
		taskContainer.addEventListener('click', function (e) {
			// Don't navigate if clicking the checkbox
			if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') {
				return;
			}
			window.location.href = `task.html?listId=${listId}&taskId=${taskId}`;
		});
	});

	// Back button
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
}

// Add this debounce function if not already present
function debounce(func, wait) {
	let timeout;
	return function () {
		const context = this, args = arguments;
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			func.apply(context, args);
		}, wait);
	};
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
			if (!draggable) return;

			const isDraggingComplete = draggable.querySelector('input').checked;
			const isTargetComplete = container === completeContainer;

			// Only allow drop if completion status matches
			if (isDraggingComplete === isTargetComplete) {
				const afterElement = getDragAfterElement(container, e.clientY);

				// If dragging a task with subtasks, we need to move the entire container
				const taskContainer = draggable.closest('.task-container');
				const elementToMove = taskContainer || draggable;

				if (afterElement == null) {
					container.appendChild(elementToMove);
				} else {
					const afterTaskContainer = afterElement.closest('.task-container');
					const referenceElement = afterTaskContainer || afterElement;
					container.insertBefore(elementToMove, referenceElement);
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

			// If this task has subtasks, we need to hide the subtasks while dragging
			const taskContainer = task.closest('.task-container');
			if (taskContainer && taskContainer.querySelector('.subtasks-container')) {
				taskContainer.style.opacity = '0.5';
			}
		});

		task.addEventListener('dragend', () => {
			task.classList.remove('dragging');
			document.querySelectorAll('.task-item.over').forEach(item => {
				item.classList.remove('over');
			});

			// Restore subtasks visibility
			const taskContainer = task.closest('.task-container');
			if (taskContainer) {
				taskContainer.style.opacity = '';
			}

			updateTaskOrder(listId);
		});
	});
}

function getDragAfterElement(container, y) {
	// Get all draggable elements (either task-items or task-containers)
	const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging), .task-container:not(.dragging)')];

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

	// Helper function to extract task ID from either a task-item or task-container
	const getTaskId = (element) => {
		const taskItem = element.classList.contains('task-item') ? element : element.querySelector('.task-item');
		return taskItem?.querySelector('input')?.id;
	};

	incompleteTasks.forEach(element => {
		const taskId = getTaskId(element);
		if (!taskId) return;

		const task = list.tasks.find(t => t.id === taskId);
		if (task) newTasks.push(task);
	});

	completeTasks.forEach(element => {
		const taskId = getTaskId(element);
		if (!taskId) return;

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