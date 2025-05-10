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

	// Set task title
	const titleInput = document.querySelector('.task-title');
	titleInput.value = task.text || '';

	// Set task description
	const descInput = document.querySelector('.task-description');
	descInput.value = task.description || '';

	// Set completion status
	const completeCheckbox = document.getElementById('task-complete');
	completeCheckbox.checked = task.completed || false;

	// Set dates if they exist
	const startDateElement = document.querySelector('.task-start-date');
	const dueDateElement = document.querySelector('.task-due-date');

	if (task.startDate) {
		startDateElement.textContent = task.startDate;
	}
	if (task.dueDate) {
		dueDateElement.textContent = task.dueDate;
	}

	// Set priority if exists
	if (task.priority) {
		setPriorityFlag(task.priority);
	}

	// Set assignee if exists
	if (task.assignee) {
	}

	// Setup event listeners
	setupTaskEvents();
}

function setPriorityFlag(priority) {
	const flagIcon = document.getElementById('flag-icon');

	switch (priority) {
		case 'high':
			flagIcon.className = 'fa-solid fa-flag';
			flagIcon.style.color = 'red';
			break;
		case 'medium':
			flagIcon.className = 'fa-solid fa-flag';
			flagIcon.style.color = 'orange';
			break;
		case 'low':
			flagIcon.className = 'fa-solid fa-flag';
			flagIcon.style.color = 'limegreen';
			break;
		default:
			flagIcon.className = 'fa-regular fa-flag';
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
		saveTaskChanges();
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
			openCalendar();
		}
	});

	// Close popups when clicking outside
	document.addEventListener('click', function (e) {
		if (!e.target.closest('.priority-popup') && !e.target.matches('#flag-icon')) {
			closePriorityPopup();
		}
		if (!e.target.closest('.calendar-popup') && !e.target.closest('.calendar-day') && !e.target.closest('.task-dates')) {
			closeCalendar();
		}
		if (!e.target.closest('.enter-hint-container') && !e.target.closest('#bullet-list-button')) {
			const hint = document.getElementById("enterHintContainer");
			if (hint) {
				hint.classList.remove("visible");
				hint.hidden = true;
			}
		}
		if (!e.target.closest('.assign-members-popup') && !e.target.closest('#user-list-button')) {
			const assign = document.getElementById("assignMembersPopup");
			if (assign) {
				assign.classList.remove("visible");
				assign.hidden = true;
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

function openSublist() {
	const hint = document.getElementById("enterHintContainer");
	hint.classList.toggle("visible");
	hint.hidden = !hint.hidden;
	closeOtherPopups(hint);
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

function openCalendar() {
	const calendarPopup = document.getElementById("calendarPopup");
	if (!calendarPopup) return;

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
}

function closeOtherPopups(currentPopup) {
	const popups = [
		document.getElementById("priorityPopup"),
		document.getElementById("enterHintContainer"),
		document.getElementById("assignMembersPopup"),
		document.getElementById("calendarPopup")
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

	// Close the popup
	const assignPopup = document.getElementById("assignMembersPopup");
	if (assignPopup) {
		assignPopup.classList.remove("visible");
		assignPopup.hidden = true;
	}

	// TOBEDONE: update visual
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

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
	renderTaskPage();
});