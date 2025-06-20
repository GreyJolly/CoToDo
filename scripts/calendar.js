const urlParams = new URLSearchParams(window.location.search);
const dateParam = urlParams.get('date');
let calendarOpen = false;

let currentDate;
if (dateParam) {
	currentDate = new Date(dateParam);
} else {
	currentDate = new Date();
}

let currentCalendarMonth = currentDate.getMonth();
let currentCalendarYear = currentDate.getFullYear();

document.addEventListener('DOMContentLoaded', function () {
	const monthElement = document.querySelector('.month');
	const prevBtn = document.querySelector('.fa-angle-left');
	const nextBtn = document.querySelector('.fa-angle-right');
	const calendarHeader = document.querySelector('.calendar-header');

	const calendarDaysButton = document.getElementById('calendar-days-button');
	if (calendarDaysButton) {
		calendarDaysButton.addEventListener('click', function (e) {
			e.stopPropagation();
			if (calendarOpen) {
				closeCalendar();
			} else {
				openCalendar();
			}
		});
	}

	const todayBtn = document.createElement('button');
	todayBtn.textContent = 'Back to today';
	todayBtn.className = 'today-btn';
	todayBtn.addEventListener('click', function () {
		currentDate = new Date();
		updateCalendar();
	});

	const navContainer = document.createElement('div');
	navContainer.className = 'calendar-nav';
	navContainer.appendChild(prevBtn);
	navContainer.appendChild(monthElement);
	navContainer.appendChild(nextBtn);
	calendarHeader.insertBefore(navContainer, calendarHeader.firstChild);
	calendarHeader.appendChild(todayBtn);

	document.addEventListener('click', function (e) {
		if (calendarOpen && !e.target.closest('.calendar-popup') && !e.target.closest('.month')) {
			closeCalendar();
		}
	});

	const calendarPopup = document.getElementById("calendarPopup");
	if (calendarPopup) {
		calendarPopup.addEventListener('click', function (e) {
			e.stopPropagation();
		});
	}

	prevBtn.addEventListener('click', function () {
		currentDate.setDate(currentDate.getDate() - 1);
		updateCalendar();
	});

	nextBtn.addEventListener('click', function () {
		currentDate.setDate(currentDate.getDate() + 1);
		updateCalendar();
	});

	updateCalendar();

	const dateInput = document.getElementById('dateInput');
	if (dateInput) {
		dateInput.addEventListener('keypress', function (e) {
			if (e.key === 'Enter') {
				goToSelectedDate();
			}
		});
	}
});

function formatDate(date) {
	const day = date.getDate();
	const month = date.toLocaleString('en-GB', { month: 'long' });
	const year = date.getFullYear();
	return `${day} ${month} ${year}`;
}

function parseTaskDate(dateString) {
	if (!dateString) return null;

	if (dateString.includes(',')) {
		const dateParts = dateString.split(' ');
		const month = dateParts[0];
		const day = dateParts[1].replace(',', '');
		const year = dateParts[2];
		return new Date(`${month} ${day}, ${year}`);
	}

	if (dateString.includes('-')) {
		const [year, month, day] = dateString.split('-');
		return new Date(year, month - 1, day);
	}

	return null;
}

function getAppData() {
	const data = localStorage.getItem('todoAppData');
	return data ? JSON.parse(data) : { lists: [] };
}

function getTasksForDate(date) {
	const appData = getAppData();
	const currentDate = new Date(date.setHours(0, 0, 0, 0));

	let tasks = [];
	appData.lists.forEach(list => {
		list.tasks.forEach(task => {
			const startDate = parseTaskDate(task.startDate);
			const dueDate = parseTaskDate(task.dueDate);

			if (startDate && dueDate) {
				const normalizedStart = new Date(startDate.setHours(0, 0, 0, 0));
				const normalizedDue = new Date(dueDate.setHours(0, 0, 0, 0));

				if (currentDate >= normalizedStart && currentDate <= normalizedDue) {
					tasks.push({
						...task,
						listId: list.id,
						listTitle: list.title || "New List",
						listColor: list.color || "#cccccc"
					});
				}
			}
			else if (dueDate) {
				const normalizedDue = new Date(dueDate.setHours(0, 0, 0, 0));
				if (currentDate.getTime() === normalizedDue.getTime()) {
					tasks.push({
						...task,
						listId: list.id,
						listTitle: list.title || "New List",
						listColor: list.color || "#cccccc"
					});
				}
			}
		});
	});

	return tasks;
}

function renderTasksForDate(tasks) {
	const todoListContainer = document.querySelector('.todo-list');
	const mainContent = document.querySelector('.main-content'); // Get the main content area
	todoListContainer.innerHTML = '';

	// Remove any existing no-tasks message first
	const existingNoTasks = mainContent.querySelector('.no-tasks');
	if (existingNoTasks) {
		mainContent.removeChild(existingNoTasks);
	}

	if (tasks.length === 0) {
		const noTasksDiv = document.createElement('div');
		noTasksDiv.className = 'no-tasks';
		noTasksDiv.textContent = 'No tasks for this date';
		mainContent.appendChild(noTasksDiv);
		return;
	}

	tasks.forEach(task => {
		const taskItem = document.createElement('div');
		taskItem.className = 'task-item';
		if (task.completed) {
			taskItem.classList.add('completed');
		}

		let priorityClass = '';
		if (task.priority) {
			priorityClass = `priority-${task.priority.toLowerCase()}`;
		}

		let html = `
            <input type="checkbox" id="${task.id}" ${task.completed ? 'checked' : ''} 
                   class="${priorityClass}${task.completed ? ' completed-priority' : ''}">
            <span class="task-label">${task.text || 'New Task'}</span>
            <span class="task-list-name" style="background-color: #515CC6">${task.listTitle}</span>
        `;

		taskItem.innerHTML = html;
		todoListContainer.appendChild(taskItem);

		taskItem.addEventListener('click', function (e) {
			if (e.target.tagName !== 'INPUT' && !e.target.classList.contains('task-list-name')) {
				localStorage.setItem('lastCalendarView', 'true');
				localStorage.setItem('lastCalendarDate', currentDate.toISOString());
				window.location.href = `task.html?listId=${task.listId}&taskId=${task.id}`;
			}
		});

		const listNameElement = taskItem.querySelector('.task-list-name');
		listNameElement.addEventListener('click', function (e) {
			e.stopPropagation();
			localStorage.setItem('lastCalendarView', 'true');
			localStorage.setItem('lastCalendarDate', currentDate.toISOString());
			window.location.href = `list.html?id=${task.listId}`;
		});

		const checkbox = taskItem.querySelector('input[type="checkbox"]');
		checkbox.addEventListener('change', function () {
			const appData = getAppData();
			let found = false;

			appData.lists.forEach(list => {
				const taskToUpdate = list.tasks.find(t => t.id === task.id);
				if (taskToUpdate) {
					taskToUpdate.completed = this.checked;
					found = true;

					if (this.checked) {
						taskItem.classList.add('completed');
						checkbox.classList.add('completed-priority');
					} else {
						taskItem.classList.remove('completed');
						checkbox.classList.remove('completed-priority');
					}
				}
			});

			if (found) {
				localStorage.setItem('todoAppData', JSON.stringify(appData));
			}
		});
	});
}

function isToday(date) {
	const today = new Date();
	return date.toDateString() === today.toDateString();
}

function updateCalendar() {
	const monthElement = document.querySelector('.month');
	const todayBtn = document.querySelector('.today-btn');

	const options = { day: 'numeric', month: 'long', year: 'numeric' };
	monthElement.textContent = currentDate.toLocaleDateString('en-GB', options);
	const tasks = getTasksForDate(new Date(currentDate));
	renderTasksForDate(tasks);

	if (todayBtn) {
		todayBtn.style.display = isToday(currentDate) ? 'none' : 'block';
	}
}

function openCalendar() {
	const calendarPopup = document.getElementById("calendarPopup");
	if (!calendarPopup) return;

	currentCalendarMonth = currentDate.getMonth();
	currentCalendarYear = currentDate.getFullYear();

	// Set the current date in the input field
	const dateInput = document.getElementById('dateInput');
	if (dateInput) {
		const year = currentDate.getFullYear();
		const month = String(currentDate.getMonth() + 1).padStart(2, '0');
		const day = String(currentDate.getDate()).padStart(2, '0');
		dateInput.value = `${year}-${month}-${day}`;
	}

	calendarPopup.hidden = false;
	calendarPopup.classList.add("visible");
	calendarOpen = true;

	generateCalendar();
}

function closeCalendar() {
	const calendarPopup = document.getElementById("calendarPopup");
	if (calendarPopup) {
		calendarPopup.classList.remove("visible");
		setTimeout(() => {
			if (!calendarPopup.classList.contains("visible")) {
				calendarPopup.hidden = true;
			}
		}, 200);
		calendarOpen = false;
	}
}

function generateCalendar() {
	const calendarDays = document.querySelector('.calendar-days');
	if (!calendarDays) return;

	calendarDays.innerHTML = '';

	const monthYearText = document.querySelector('.calendar-month-year');
	if (monthYearText) {
		const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
			'July', 'August', 'September', 'October', 'November', 'December'];
		monthYearText.textContent = `${monthNames[currentCalendarMonth]} ${currentCalendarYear}`;
	}

	const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1).getDay();
	const daysInMonth = new Date(currentCalendarYear, currentCalendarMonth + 1, 0).getDate();
	const prevMonthLastDay = new Date(currentCalendarYear, currentCalendarMonth, 0).getDate();

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

	let dayCount = 1;
	let nextMonthDay = 1;
	let adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

	for (let i = 0; i < 6; i++) {
		const weekRow = document.createElement('div');
		weekRow.className = 'calendar-week-row';

		for (let j = 0; j < 7; j++) {
			const dayCell = document.createElement('div');
			dayCell.className = 'calendar-day';

			if (i === 0 && j < adjustedFirstDay) {
				const prevDay = prevMonthLastDay - adjustedFirstDay + j + 1;
				dayCell.textContent = prevDay;
				dayCell.classList.add('prev-month-day');
			} else if (dayCount > daysInMonth) {
				dayCell.textContent = nextMonthDay;
				dayCell.classList.add('next-month-day');
				nextMonthDay++;
			} else {
				dayCell.textContent = dayCount;
				const cellDate = new Date(currentCalendarYear, currentCalendarMonth, dayCount);

				if (cellDate.toDateString() === new Date().toDateString()) {
					dayCell.classList.add('today');
				}

				dayCell.addEventListener('click', function () {
					selectDate(cellDate);
				});

				dayCount++;
			}

			weekRow.appendChild(dayCell);
		}

		calendarDays.appendChild(weekRow);

		if (dayCount > daysInMonth && i >= 3) {
			break;
		}
	}
}

function navigateCalendar(direction) {
	currentCalendarMonth += direction;

	if (currentCalendarMonth < 0) {
		currentCalendarMonth = 11;
		currentCalendarYear--;
	} else if (currentCalendarMonth > 11) {
		currentCalendarMonth = 0;
		currentCalendarYear++;
	}

	generateCalendar();
}

function selectDate(date) {
	currentDate = new Date(date);
	updateCalendar();
	closeCalendar();

	const newUrl = new URL(window.location.href);
	newUrl.searchParams.set('date', date.toISOString().split('T')[0]);
	window.history.pushState({ path: newUrl.href }, '', newUrl.href);
}

function goToSelectedDate() {
	const dateInput = document.getElementById('dateInput');
	if (!dateInput.value) return;

	const selectedDate = new Date(dateInput.value);
	if (isNaN(selectedDate.getTime())) return;

	// Update the calendar view to show the selected month
	currentCalendarMonth = selectedDate.getMonth();
	currentCalendarYear = selectedDate.getFullYear();
	generateCalendar();

	// Select the date
	selectDate(selectedDate);
}