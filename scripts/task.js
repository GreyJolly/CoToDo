function getAppData() {
	const data = localStorage.getItem('todoAppData');
	return data ? JSON.parse(data) : { lists: [] };
}

function getCurrentTaskId() {
	const urlParams = new URLSearchParams(window.location.search);
	return urlParams.get('taskId');
}

function getCurrentListId() {
	const urlParams = new URLSearchParams(window.location.search);
	return urlParams.get('listId');
}

function loadTaskData() {
	const appData = getAppData();
	const listId = getCurrentListId();
	const taskId = getCurrentTaskId();

	if (!listId || !taskId) {
		console.error('Missing listId or taskId in URL');
		return null;
	}

	const list = appData.lists.find(l => l.id === listId);
	if (!list) {
		console.error('List not found');
		return null;
	}

	const task = list.tasks.find(t => t.id === taskId);
	if (!task) {
		console.error('Task not found');
		return null;
	}

	return { appData, list, task };
}

function renderTaskPage() {
	const taskData = loadTaskData();
	if (!taskData) return;

	const { task, list } = taskData;
	const headerCheckbox = document.querySelector('.task-header input[type="checkbox"]');

	if (!task.subtasks) {
		task.subtasks = [];
	}

	const titleInput = document.querySelector('.task-title');
	titleInput.value = task.text || '';

	const descInput = document.querySelector('.task-description');
	descInput.value = task.description || '';

	const completeCheckbox = document.getElementById('task-complete');
	completeCheckbox.checked = task.completed || false;

	const startDateElement = document.querySelector('.task-start-date');
	const dueDateElement = document.querySelector('.task-due-date');

	if (task.startDate) {
		startDateElement.textContent = task.startDate;
	}
	if (task.dueDate) {
		dueDateElement.textContent = task.dueDate;
	}

	if (task.priority) {
		setPriorityFlag(task.priority);
		headerCheckbox.classList.add(`priority-${task.priority}`);
	}

	if (task.subtasks && task.subtasks.length > 0) {
		const subtasksContainer = document.getElementById("subtasksContainer");
		subtasksContainer.classList.add("visible");
		subtasksContainer.hidden = false;
		renderSubtasks();
	}

	updateAssigneeDisplay();

	setupTaskEvents();
}

function setPriorityFlag(priority) {
	const flagIcon = document.getElementById('flag-icon');
	const headerCheckbox = document.querySelector('.task-header input[type="checkbox"]');

	// Remove all priority classes first
	flagIcon.className = 'flag-icon fa-regular fa-flag';
	flagIcon.style.color = '';
	headerCheckbox.classList.remove('priority-high', 'priority-medium', 'priority-low');

	switch (priority) {
		case 'high':
			flagIcon.className = 'flag-icon fa-solid fa-flag';
			flagIcon.style.color = 'red';
			headerCheckbox.classList.add('priority-high');
			break;
		case 'medium':
			flagIcon.className = 'flag-icon fa-solid fa-flag';
			flagIcon.style.color = 'orange';
			headerCheckbox.classList.add('priority-medium');
			break;
		case 'low':
			flagIcon.className = 'flag-icon fa-solid fa-flag';
			flagIcon.style.color = 'limegreen';
			headerCheckbox.classList.add('priority-low');
			break;
		default:
			flagIcon.className = 'flag-icon fa-regular fa-flag';
			flagIcon.style.color = '';
	}
}

function setupTaskEvents() {
	// Save changes when leaving the page
	window.addEventListener('beforeunload', saveTaskChanges);

	// Back button
	document.querySelector('.backto-list')?.addEventListener('click', function (e) {
		e.preventDefault();
		saveTaskChanges();

		// Check if we came from the calendar
		const lastCalendarDate = localStorage.getItem('lastCalendarDate');
		if (lastCalendarDate) {
			// Remove the stored date so it doesn't affect future navigation
			localStorage.removeItem('lastCalendarDate');
			// Go back to calendar with the stored date
			window.location.href = `calendar.html?date=${lastCalendarDate}`;
		} else {
			// Default behavior - go back to list
			window.location.href = `list.html?id=${getCurrentListId()}`;
		}
	});

	// Priority popup
	document.getElementById('flag-icon')?.addEventListener('click', openPriorityPopup);

	// Checkbox change
	document.getElementById('task-complete')?.addEventListener('change', function () {
		const taskData = loadTaskData();
		if (!taskData) return;

		const { appData, task } = taskData;
		const newCompletedState = this.checked;
		task.completed = newCompletedState;

		// Update all subtasks to match parent task state
		if (task.subtasks && task.subtasks.length > 0) {
			task.subtasks.forEach(subtask => {
				subtask.completed = newCompletedState;
			});
		}

		localStorage.setItem('todoAppData', JSON.stringify(appData));
		renderSubtasks(); // Refresh subtask display
	});

	// Title and description changes
	document.querySelector('.task-title')?.addEventListener('input', debounce(saveTaskChanges, 300));
	document.querySelector('.task-description')?.addEventListener('input', debounce(saveTaskChanges, 300));

	// Priority options
	document.querySelectorAll('.priority-option').forEach(option => {
		option.addEventListener('click', function () {
			selectPriority(this.getAttribute('data-priority'));
		});
	});

	// Calendar date selection
	document.querySelector('.task-dates')?.addEventListener('click', function (e) {
		// Only open calendar if not clicking on a specific date element
		if (!e.target.classList.contains('task-start-date') &&
			!e.target.classList.contains('task-due-date')) {
			openCalendar(getDateSelectionMode());
		}
	});

	// Close popups when clicking outside
	document.addEventListener('click', function (e) {

		if (!e.target.closest('.priority-popup') &&
			!e.target.matches('#flag-icon')) {
			closePriorityPopup();
		}
		if (!e.target.closest('.calendar-header') &&
			!e.target.closest('.calendar-days') &&
			!e.target.closest('.calendar-day') &&
			!e.target.closest('.task-dates') &&
			!e.target.closest('.task-date-item')) {
			closeCalendar();
		}
		if (!e.target.closest('.enter-hint-container') && !e.target.closest('#bullet-list-button') && !e.target.closest('.task-date-item')) {
			const hint = document.getElementById("enterHintContainer");
			if (hint) {
				hint.classList.remove("visible");
				hint.hidden = true;
			}
		}
		if (!e.target.closest('.assign-members-popup') &&
			!e.target.closest('#user-list-button') &&
			!e.target.closest('.assignee-container')
		) {
			const assign = document.getElementById("assignMembersPopup");
			if (assign) {
				assign.classList.remove("visible");
				assign.hidden = true;
			}
		}
		if (!e.target.closest('.add-subtask-container') && !e.target.closest('#bullet-list-button')) {
			const addSubtaskContainer = document.getElementById("addSubtaskContainer");
			if (addSubtaskContainer) {
				addSubtaskContainer.classList.remove("visible");
				addSubtaskContainer.hidden = true;
			}
		}
	});

	// Handle Escape key to close popups
	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape') {
			closePriorityPopup();
			closeCalendar();
			const hint = document.getElementById("enterHintContainer");
			if (hint) {
				hint.classList.remove("visible");
				hint.hidden = true;
			}
			const assign = document.getElementById("assignMembersPopup");
			if (assign) {
				assign.classList.remove("visible");
				assign.hidden = true;
			}
		}
	});
}
function saveTaskChanges() {
	const taskData = loadTaskData();
	if (!taskData) return;

	const { appData, list, task } = taskData;

	// Update task properties
	task.text = document.querySelector('.task-title').value;
	task.description = document.querySelector('.task-description').value;
	task.completed = document.getElementById('task-complete').checked;

	// Save to localStorage
	localStorage.setItem('todoAppData', JSON.stringify(appData));
}

// Popup handling functions
function openPriorityPopup() {
	const popup = document.getElementById("priorityPopup");
	popup.classList.toggle("visible");
	popup.hidden = false;
	closeOtherPopups(popup);
}

function closePriorityPopup() {
	const popup = document.getElementById("priorityPopup");
	popup.classList.remove("visible");
	popup.hidden = true;
}

function openAssignMembers() {
	const assignPopup = document.getElementById("assignMembersPopup");
	if (!assignPopup) return;

	// Clear existing options
	assignPopup.innerHTML = '<div class="assign-to-header">Assign to:</div>';

	const taskData = loadTaskData();
	if (!taskData) return;

	const { list, task } = taskData;

	// Add "None" option
	const noneOption = document.createElement('div');
	noneOption.className = 'member-option';
	noneOption.onclick = () => selectMember('none');
	noneOption.innerHTML = `
        <div class="member-avatar" style="background-color: #a29bfe;">
            <i class="fa-solid fa-ban"></i>
        </div>
        <span class="member-name">None</span>
        ${!task.assignee ? '<i class="fa-solid fa-check"></i>' : ''}
    `;
	assignPopup.appendChild(noneOption);

	// Add "Me" (current user) option
	const meOption = document.createElement('div');
	meOption.className = 'member-option';
	meOption.onclick = () => selectMember('me');
	meOption.innerHTML = `
        <div class="member-avatar" style="background-color: #ee7300;">M</div>
        <span class="member-name">Me</span>
        ${task.assignee === 'me' ? '<i class="fa-solid fa-check"></i>' : ''}
    `;
	assignPopup.appendChild(meOption);

	// Add contributors from the list
	if (list.contributors && list.contributors.length > 0) {
		list.contributors.forEach(contributor => {
			const memberOption = document.createElement('div');
			memberOption.className = 'member-option';
			memberOption.onclick = () => selectMember(contributor.id);
			memberOption.innerHTML = `
                <div class="member-avatar" style="background-color: ${contributor.avatarColor}">
                    ${contributor.initialLetter}
                </div>
                <span class="member-name">${contributor.name}</span>
                ${task.assignee === contributor.id ? '<i class="fa-solid fa-check"></i>' : ''}
            `;
			assignPopup.appendChild(memberOption);
		});
	}

	assignPopup.classList.toggle("visible");
	assignPopup.hidden = !assignPopup.hidden;
	closeOtherPopups(assignPopup);
}

function openCalendar(start_or_due) {
	const calendarPopup = document.getElementById("calendarPopup");
	if (!calendarPopup) return;

	if (start_or_due == "start") {
		document.getElementById('radio-start').click();
	}
	else {
		document.getElementById('radio-due').click();
	}

	if (getDateSelectionMode() == "start") {
		document.getElementById("task-date-item-start").classList.add("selecting");
		document.getElementById("task-date-item-due").classList.remove("selecting");
	} else {
		document.getElementById("task-date-item-due").classList.add("selecting");
		document.getElementById("task-date-item-start").classList.remove("selecting");
	}

	// Do not proceed with the rendering if the calendar is already visible
	if (calendarPopup.classList.contains("visible")) { return; }

	calendarPopup.classList.toggle("visible");
	calendarPopup.hidden = false;
	closeOtherPopups(calendarPopup);

	loadExistingDates();
	generateCalendar();

}

function closeCalendar() {
	const calendarPopup = document.getElementById("calendarPopup");
	if (calendarPopup) {
		calendarPopup.classList.remove("visible");
		calendarPopup.hidden = true;
	}
	document.getElementById("task-date-item-start").classList.remove("selecting");
	document.getElementById("task-date-item-due").classList.remove("selecting");

}

function closeOtherPopups(currentPopup) {
	const popups = [
		document.getElementById("priorityPopup"),
		document.getElementById("enterHintContainer"),
		document.getElementById("assignMembersPopup"),
		document.getElementById("calendarPopup"),
	];

	popups.forEach(popup => {
		if (popup && popup !== currentPopup) {
			popup.classList.remove("visible");
			popup.hidden = true;
		}
	});
}

// Month and year to track current calendar view
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();
let tempStartDate = null; // Temporary storage for start date selection
let tempDueDate = null; // Temporary storage for due date selection

function getDateSelectionMode() {
	return document.querySelector('input[name="dateType"]:checked').value;
}

function generateCalendar() {

	const calendarDays = document.querySelector('.calendar-days');
	if (!calendarDays) return;

	// Clear previous calendar days
	calendarDays.innerHTML = '';

	// Set the month and year display
	const monthYearText = document.querySelector('.calendar-month-year');
	if (monthYearText) {
		const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
			'July', 'August', 'September', 'October', 'November', 'December'];
		monthYearText.textContent = `${monthNames[currentCalendarMonth]} ${currentCalendarYear}`;
	}

	// Get the first day of the month and the number of days
	const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1).getDay();
	const daysInMonth = new Date(currentCalendarYear, currentCalendarMonth + 1, 0).getDate();

	// Get previous month's last days
	const prevMonthLastDay = new Date(currentCalendarYear, currentCalendarMonth, 0).getDate();

	// Add day headers (Mon, Tue, etc.)
	const dayHeaders = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
	const headerRow = document.createElement('div');
	headerRow.className = 'calendar-header-row';

	dayHeaders.forEach(day => {
		const dayHeader = document.createElement('div');
		dayHeader.className = 'calendar-day-header';
		dayHeader.textContent = day;
		headerRow.appendChild(dayHeader);
	});

	calendarDays.appendChild(headerRow);

	// Create calendar grid
	let dayCount = 1;
	let nextMonthDay = 1;

	// Adjust firstDay to start from Monday (0) instead of Sunday (0)
	let adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

	for (let i = 0; i < 6; i++) { // 6 weeks max in a month view
		const weekRow = document.createElement('div');
		weekRow.className = 'calendar-week-row';

		for (let j = 0; j < 7; j++) { // 7 days in a week
			const dayCell = document.createElement('div');
			dayCell.className = 'calendar-day';

			if (i === 0 && j < adjustedFirstDay) {
				// Previous month days
				const prevDay = prevMonthLastDay - adjustedFirstDay + j + 1;
				dayCell.textContent = prevDay;
				dayCell.classList.add('prev-month-day');
			} else if (dayCount > daysInMonth) {
				// Next month days
				dayCell.textContent = nextMonthDay;
				dayCell.classList.add('next-month-day');
				nextMonthDay++;
			} else {
				// Current month days
				dayCell.textContent = dayCount;
				const currentDate = new Date(currentCalendarYear, currentCalendarMonth, dayCount);

				// Highlight today's date
				const today = new Date();
				if (currentDate.toDateString() === today.toDateString()) {
					dayCell.classList.add('today');
				}

				// Check if this date is the start date
				if (tempStartDate && currentDate.toDateString() === tempStartDate.toDateString()) {
					dayCell.classList.add('selected-start');
				}

				// Check if this date is the due date
				if (tempDueDate && currentDate.toDateString() === tempDueDate.toDateString()) {
					dayCell.classList.add('selected-due');
				}

				// Highlight dates in range between start and due dates
				if (tempStartDate && tempDueDate) {
					if (currentDate > tempStartDate && currentDate < tempDueDate) {
						dayCell.classList.add('in-range');
					}
				} else if (tempStartDate || tempDueDate) {
					// When selecting due date, highlight dates after start date
					if (tempStartDate && currentDate > tempStartDate || tempDueDate && currentDate < tempDueDate) {
						dayCell.classList.add('potential-range');
					}
				}

				// Add click event to select a date
				dayCell.addEventListener('click', function () {
					selectDate(currentDate);
				});

				dayCount++;
			}

			weekRow.appendChild(dayCell);
		}

		calendarDays.appendChild(weekRow);

		// Stop if we've displayed all days of the current month and at least some of next month
		if (dayCount > daysInMonth && i >= 3) {
			break;
		}
	}

}

function navigateCalendar(direction) {
	// Update current month and year
	currentCalendarMonth += direction;

	// Handle year change
	if (currentCalendarMonth < 0) {
		currentCalendarMonth = 11;
		currentCalendarYear--;
	} else if (currentCalendarMonth > 11) {
		currentCalendarMonth = 0;
		currentCalendarYear++;
	}

	// Regenerate calendar
	generateCalendar();
}

function selectDate(date) {
	if (getDateSelectionMode() == 'start') {
		if (!tempStartDate || tempStartDate.getTime() != date.getTime()) {
			tempStartDate = date;
		} else {
			tempStartDate = null;
		}
	} else {
		if (!tempDueDate || tempDueDate.getTime() != date.getTime()) {
			tempDueDate = date;
		} else {
			tempDueDate = null;
		}
	}
	if (tempStartDate && tempDueDate && tempStartDate > tempDueDate) {
		date = tempDueDate
		tempDueDate = tempStartDate;
		tempStartDate = date;
	}

	saveSelectedDates();

	// Regenerate calendar to update highlights
	generateCalendar();
}

function saveSelectedDates() {
	const taskData = loadTaskData();
	if (!taskData) return;

	const { appData, task } = taskData;

	// Format dates as "Month Day, Year" (e.g., "May 15, 2025")
	const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'];

	if (tempStartDate) {
		const formattedStartDate = `${monthNames[tempStartDate.getMonth()]} ${tempStartDate.getDate()}, ${tempStartDate.getFullYear()}`;
		task.startDate = formattedStartDate;
	} else {
		delete task.startDate;
	}

	if (tempDueDate) {
		const formattedDueDate = `${monthNames[tempDueDate.getMonth()]} ${tempDueDate.getDate()}, ${tempDueDate.getFullYear()}`;
		task.dueDate = formattedDueDate;
	} else {
		delete task.dueDate;
	}

	// Save changes
	localStorage.setItem('todoAppData', JSON.stringify(appData));

	// Update date displays
	updateDateDisplays();
}

function updateDateDisplays() {
	const startDateElement = document.querySelector('.task-start-date');
	const dueDateElement = document.querySelector('.task-due-date');

	if (startDateElement && tempStartDate) {
		const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
			'July', 'August', 'September', 'October', 'November', 'December'];
		const formattedDate = `${monthNames[tempStartDate.getMonth()]} ${tempStartDate.getDate()}, ${tempStartDate.getFullYear()}`;
		startDateElement.textContent = formattedDate;
	} else {
		startDateElement.textContent = "No date";
	}

	if (dueDateElement && tempDueDate) {
		const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
			'July', 'August', 'September', 'October', 'November', 'December'];
		const formattedDate = `${monthNames[tempDueDate.getMonth()]} ${tempDueDate.getDate()}, ${tempDueDate.getFullYear()}`;
		dueDateElement.textContent = formattedDate;
	} else {
		dueDateElement.textContent = "No date";
	}
}

function loadExistingDates() {
	const taskData = loadTaskData();
	if (!taskData || !taskData.task) return;

	const { task } = taskData;

	// Parse existing start date if present
	if (task.startDate) {
		const dateMatch = task.startDate.match(/(\w+) (\d+), (\d+)/);
		if (dateMatch) {
			const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
				'July', 'August', 'September', 'October', 'November', 'December'];
			const selectedMonth = monthNames.indexOf(dateMatch[1]);
			const selectedDay = parseInt(dateMatch[2]);
			const selectedYear = parseInt(dateMatch[3]);

			tempStartDate = new Date(selectedYear, selectedMonth, selectedDay);
		}
	}

	// Parse existing due date if present
	if (task.dueDate) {
		const dateMatch = task.dueDate.match(/(\w+) (\d+), (\d+)/);
		if (dateMatch) {
			const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
				'July', 'August', 'September', 'October', 'November', 'December'];
			const selectedMonth = monthNames.indexOf(dateMatch[1]);
			const selectedDay = parseInt(dateMatch[2]);
			const selectedYear = parseInt(dateMatch[3]);

			tempDueDate = new Date(selectedYear, selectedMonth, selectedDay);
		}
	}

	// Update calendar view to show the month of the start date or due date if available
	if (tempStartDate) {
		currentCalendarMonth = tempStartDate.getMonth();
		currentCalendarYear = tempStartDate.getFullYear();
	} else if (tempDueDate) {
		currentCalendarMonth = tempDueDate.getMonth();
		currentCalendarYear = tempDueDate.getFullYear();
	}
}

function selectPriority(priority) {
	const taskData = loadTaskData();
	if (!taskData) return;

	const { appData, task } = taskData;
	task.priority = priority;
	setPriorityFlag(priority);
	localStorage.setItem('todoAppData', JSON.stringify(appData));
	closePriorityPopup();
}

function selectMember(memberId) {
	const taskData = loadTaskData();
	if (!taskData) return;

	const { appData, task, list } = taskData;

	if (memberId === 'none') {
		task.assignee = null;
	} else if (memberId === 'me') {
		task.assignee = 'me';
	} else {
		// Verify the member is actually a contributor
		const isContributor = list.contributors?.some(c => c.id === memberId);
		if (isContributor) {
			task.assignee = memberId;
		}
	}

	// Save changes
	localStorage.setItem('todoAppData', JSON.stringify(appData));

	// Update the assignee display
	updateAssigneeDisplay();

	// Close the popup
	const assignPopup = document.getElementById("assignMembersPopup");
	if (assignPopup) {
		assignPopup.classList.remove("visible");
		assignPopup.hidden = true;
	}
}

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

function openSublist() {
	const subtasksContainer = document.getElementById("subtasksContainer");
	const addSubtaskContainer = document.getElementById("addSubtaskContainer");

	if (subtasksContainer.hidden) {
		subtasksContainer.classList.add("visible");
		subtasksContainer.hidden = false;
		renderSubtasks();
	}

	addSubtaskContainer.classList.toggle("visible");
	addSubtaskContainer.hidden = !addSubtaskContainer.hidden;

	if (!addSubtaskContainer.hidden) {
		document.getElementById("addSubtaskInput").focus();
	}

	closeOtherPopups(null);
}

function renderSubtasks() {
	const taskData = loadTaskData();
	if (!taskData) return;

	const { task } = taskData;
	const subtasksList = document.getElementById("subtasksList");

	subtasksList.innerHTML = '';

	if (task.subtasks && task.subtasks.length > 0) {
		task.subtasks.forEach((subtask, index) => {
			const subtaskElement = document.createElement('div');
			subtaskElement.className = 'subtask';
			subtaskElement.innerHTML = `
                <input type="checkbox" class="subtask-checkbox" ${subtask.completed ? 'checked' : ''} 
                    data-index="${index}" onchange="toggleSubtaskCompletion(${index})">
                <input type="text" class="subtask-text" value="${subtask.text}" 
                    data-index="${index}" onchange="updateSubtaskText(${index})">
                <button class="delete-subtask" onclick="deleteSubtask(${index})">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            `;
			subtasksList.appendChild(subtaskElement);

			if (subtask.completed) {
				subtaskElement.querySelector('.subtask-text').style.color = '#aaa';
			}
		});
	}

	const addSubtaskInput = document.getElementById("addSubtaskInput");
	addSubtaskInput.value = '';
	addSubtaskInput.addEventListener('keypress', function (e) {
		if (e.key === 'Enter' && this.value.trim() !== '') {
			addSubtask(this.value.trim());
			this.value = '';
		}
	});
}

function addSubtask(text) {
	const taskData = loadTaskData();
	if (!taskData) return;

	const { appData, task } = taskData;

	if (!task.subtasks) {
		task.subtasks = [];
	}

	task.subtasks.push({
		text: text,
		completed: false
	});

	localStorage.setItem('todoAppData', JSON.stringify(appData));
	renderSubtasks();
}

function toggleSubtaskCompletion(index) {
	const taskData = loadTaskData();
	if (!taskData) return;

	const { appData, task } = taskData;

	if (task.subtasks && task.subtasks[index]) {
		task.subtasks[index].completed = !task.subtasks[index].completed;
		localStorage.setItem('todoAppData', JSON.stringify(appData));

		// Update parent task completion
		const allSubtasksCompleted = task.subtasks.every(subtask => subtask.completed);
		if (task.completed !== allSubtasksCompleted) {
			task.completed = allSubtasksCompleted;
			localStorage.setItem('todoAppData', JSON.stringify(appData));

			// Update the checkbox in the UI
			document.getElementById('task-complete').checked = task.completed;
		}

		renderSubtasks();
	}
}

function updateSubtaskText(index) {
	const subtaskText = document.querySelector(`.subtask-text[data-index="${index}"]`);
	if (!subtaskText) return;

	const newText = subtaskText.value;
	const taskData = loadTaskData();
	if (!taskData) return;

	const { appData, task } = taskData;

	if (task.subtasks && task.subtasks[index]) {
		task.subtasks[index].text = newText;
		localStorage.setItem('todoAppData', JSON.stringify(appData));
	}
}

function deleteSubtask(index) {
	const taskData = loadTaskData();
	if (!taskData) return;

	const { appData, task } = taskData;

	if (task.subtasks && task.subtasks[index]) {
		task.subtasks.splice(index, 1);
		localStorage.setItem('todoAppData', JSON.stringify(appData));
		renderSubtasks();
	}
}

function deleteTask() {
	const taskData = loadTaskData();
	if (!taskData) return;

	const { appData, list, task } = taskData;
	const listId = getCurrentListId();
	const taskId = getCurrentTaskId();

	// Show the confirmation popup
	const popup = document.getElementById('delete-confirm-popup');
	popup.style.display = 'flex';

	// Setup event listeners for the buttons
	popup.querySelector('.cancel-button').onclick = function () {
		popup.style.display = 'none';
	};

	popup.querySelector('.confirm-button').onclick = function () {
		list.tasks = list.tasks.filter(t => t.id !== taskId);
		localStorage.setItem('todoAppData', JSON.stringify(appData));
		popup.style.display = 'none';
		window.location.href = `list.html?id=${listId}`;
	};

	// Close popup when clicking outside
	popup.onclick = function (e) {
		if (e.target === popup) {
			popup.style.display = 'none';
		}
	};
}

function updateAssigneeDisplay() {
	const taskData = loadTaskData();
	if (!taskData) return;

	const { task, list } = taskData;
	const assigneeButton = document.getElementById('assigneeButton');
	const assigneeAvatar = document.getElementById('assigneeAvatar');
	const assigneeText = document.querySelector('.assignee-text');

	if (task.assignee) {
		if (task.assignee === 'me') {
			assigneeAvatar.innerHTML = 'M';
			assigneeAvatar.style.backgroundColor = '#ee7300';
			assigneeText.textContent = 'Me';
		} else {
			const contributor = list.contributors?.find(c => c.id === task.assignee);
			if (contributor) {
				assigneeAvatar.innerHTML = contributor.initialLetter;
				assigneeAvatar.style.backgroundColor = contributor.avatarColor;
				assigneeText.textContent = contributor.name;
			} else {
				// Fallback for unknown assignee
				assigneeAvatar.innerHTML = '<i class="fa-solid fa-user"></i>';
				assigneeAvatar.style.backgroundColor = '#cccccc';
				assigneeText.textContent = 'Assigned';
			}
		}
	} else {
		// No assignee
		assigneeAvatar.innerHTML = '<i class="fa-solid fa-user-plus"></i>';
		assigneeAvatar.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
		assigneeText.textContent = 'Assign to';
	}
}

document.addEventListener('DOMContentLoaded', function () {
	renderTaskPage();
});