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
	document.querySelector('.list-text').textContent = list.title;

	const incompleteContainer = document.querySelector('.incomplete-container .todo-list');
	const completeContainer = document.querySelector('.complete-container .todo-list');

	incompleteContainer.innerHTML = '';
	completeContainer.innerHTML = '';

	list.tasks.forEach(task => {
		const taskItem = document.createElement('div');
		taskItem.className = 'task-item';

		let html = `
		<input type="checkbox" id="${task.id}" ${task.completed ? 'checked' : ''}>
		<label for="${task.id}">${task.text}</label>
	  `;

		if (task.date) {
			html += `<span class="task-date">${task.date}</span>`;
		} else {
			html += '<span class="task-date"></span>';
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
				renderListPage(listId); // Re-render to move task between complete/incomplete
			}
			localStorage.setItem('todoAppData', JSON.stringify(appData));
			renderListPage(listId);
		});
	});

	// Back button
	document.querySelector('.backto-index')?.addEventListener('click', function (e) {
		e.preventDefault();
		window.location.href = 'index.html';
	});

	// Plus button to add new task
	document.getElementById('plus-button')?.addEventListener('click', function (e) {
		const appData = getAppData();
		e.preventDefault();
		const list = appData.lists.find(l => l.id === listId);
		const newTaskId = 'task' + (list.tasks.length + 16);

		list.tasks.push({
			id: newTaskId,
			text: 'New Task',
			completed: false
		});
		localStorage.setItem('todoAppData', JSON.stringify(appData));

		renderListPage(listId);
	});
}