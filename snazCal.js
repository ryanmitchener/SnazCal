// Author:		Ryan Mitchener
// Date:		4/14/2013

// Constructor for SnazCal
var SnazCal = function (options) {
	if (options === undefined) {
		options = {};
	}
	// User set options
	this.firstDay = (options.firstDay !== undefined) ? parseInt(options.firstDay) : 1;
	this.roundedEdges = (options.roundedEdges !== undefined) ? options.roundedEdges : false;
	if (this.firstDay === 0) {
		var firstDay = this.days.pop();
		this.days.unshift(firstDay);
	}
	this.element = (options.element !== undefined) ? options.element : document.body;
	this.bound = (options.bound !== undefined) ? options.bound : true;
	this.onSelect = (options.onSelect !== undefined) ? options.onSelect : null;
	this.format = (options.format !== undefined) ? options.format.toLowerCase() : "yyyy-mm-dd";
    
	// The starting value of the calendar
	this.value = new Date();
	
	// The shown dates
    this.currentYear = this.value.getFullYear();
    this.currentMonth = this.value.getMonth();
	this.currentDate = this.value.getDate();
	
	// The selected dates
    this.selectedYear = this.value.getFullYear();
    this.selectedMonth = this.value.getMonth();
	this.selectedDate = this.value.getDate();
	
	// Build the calendar
	this.construct();
};

SnazCal.prototype.months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
SnazCal.prototype.days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];


// Constructs the calendar
SnazCal.prototype.construct = function() {
	// Create container
	this.cont = document.createElement('div');
	this.cont.classList.add('snaz-cal');
	if (this.bound === true) {
		this.cont.classList.add('snaz-bound');
	}
	
    // Build day name container
    var dayNameCont = document.createElement('div');
    dayNameCont.classList.add('snaz-day-name-cont');
    for (var i=0; i<7; i++) {
        var dayName = document.createElement('div');
        dayName.setAttribute('class', 'snaz-day name');
        dayName.dataset.value = this.days[i].substring(0, 3);
        dayNameCont.appendChild(dayName);
    }
    
	// Create days container
	this.daysCont = document.createElement('div');
	this.daysCont.classList.add('snaz-days-cont');
	
	// Create month container and dropdown
	var currentCont = document.createElement('div');
	currentCont.classList.add('snaz-current-cont');
	var monthCont = document.createElement('div');
	monthCont.tabIndex = 0;
	monthCont.setAttribute('class', 'snaz-current');
	var monthValue = document.createElement('div');
	monthValue.setAttribute('class', 'snaz-current month');
	var monthDD = document.createElement('div');
	monthDD.setAttribute('class', 'snaz-dd month');
	for (var i=0, length=this.months.length; i<length; i++) {
		var month = document.createElement('div');
		month.tabIndex = 0;
		month.classList.add('snaz-dd-entry');
		month.innerHTML = this.months[i];
		month.addEventListener('mousedown', this.HandleDropdownEntryClick.bind(this, month, i));
		month.addEventListener('keydown', this.HandleDropdownEntryClick.bind(this, month, i));
		monthDD.appendChild(month);
	}
	monthCont.appendChild(monthValue);
	monthCont.appendChild(monthDD);	
	

	// Create year container and dropdown
	var yearCont = document.createElement('div');
	yearCont.tabIndex = 0;
	yearCont.setAttribute('class', 'snaz-current');
	var yearValue = document.createElement('div');
	yearValue.setAttribute('class', 'snaz-current year');
	var yearDD = document.createElement('div');
	yearDD.setAttribute('class', 'snaz-dd year');
	for (var i=this.currentYear-5, length=this.currentYear+5; i<length; i++) {
		var year = document.createElement('div');
		year.tabIndex = 0;
		year.classList.add('snaz-dd-entry');
		year.innerHTML = i;
		year.addEventListener('mousedown', this.HandleDropdownEntryClick.bind(this, year, i));
		year.addEventListener('keydown', this.HandleDropdownEntryClick.bind(this, year, i));
		yearDD.appendChild(year);
	}
	yearCont.appendChild(yearValue);
	yearCont.appendChild(yearDD);

	// Create control buttons
	var previous = document.createElement('div');
	previous.tabIndex = 0;
	previous.setAttribute('class', 'snaz-control prev');
	var next = document.createElement('div');
	next.tabIndex = 0;
	next.setAttribute('class', 'snaz-control next');

	// Attach children to container
	currentCont.appendChild(previous);
	currentCont.appendChild(monthCont);
	currentCont.appendChild(yearCont);
	currentCont.appendChild(next);
	this.cont.appendChild(currentCont);
    this.cont.appendChild(dayNameCont);
	this.cont.appendChild(this.daysCont);

	// If not bound, show the calendar
	if (this.bound === false) {
		this.cont.classList.add('snaz-show');
	}
	
	// Position the calendar
	this.position();
	
	// Attach element to DOM
	this.element.parentElement.insertBefore(this.cont, this.element.nextElementSibling);
	this.list();

	// Attach Events to non-loop elements
	monthCont.addEventListener('mousedown', this.HandleDropdownClick.bind(this, monthDD));
	monthCont.addEventListener('keydown', this.HandleDropdownClick.bind(this, monthDD));
	yearCont.addEventListener('mousedown', this.HandleDropdownClick.bind(this, yearDD));
	yearCont.addEventListener('keydown', this.HandleDropdownClick.bind(this, yearDD));
	previous.addEventListener('mousedown', this.control.bind(this, previous));
	previous.addEventListener('keydown', this.control.bind(this, previous));
	next.addEventListener('mousedown', this.control.bind(this, next));
	next.addEventListener('keydown', this.control.bind(this, next));
	
	// If bound, show set event handlers for hiding and showing
	if (this.bound === true) {
		this.cont.addEventListener('mousedown', this.mainClick.bind(this, this.cont));
		document.addEventListener('mousedown', this.mainClick.bind(this, this.cont));

		// Set event handlers to accept key inputs into the input field and also show cal
		if (this.element.tagName === "INPUT") {
			if (this.element.value !== "") {
				this.parseDate();
			}
			this.element.addEventListener('change', this.parseDate.bind(this));
			this.element.addEventListener('focus', this.showCal.bind(this));
			this.element.addEventListener('keydown', this.emulatedBlur.bind(this));
		}
	}
};

// Position the calendar if bound and attached to an element
SnazCal.prototype.position = function () {
	if (this.bound === false) {
		return;
	}
	var top = this.element.clientTop + this.element.offsetTop;
	var parent = this.element;
	while (parent = parent.offsetParent) {
		top += parent.offsetTop;
	}
	var left = this.element.offsetLeft;
	var height = this.element.offsetHeight;
	
	this.cont.style.top = (top + height) + "px";
	this.cont.style.left = left + "px";
}


// Returns the amount of days in a month
SnazCal.prototype.getDays = function (year, month) {
    return new Date(parseInt(year), parseInt(month)+1, 0).getDate();
};


// Returns the day of the first day of the month
SnazCal.prototype.getFirstDay = function (year, month) {
    return new Date(parseInt(year), parseInt(month)).getDay();
};


// Returns the amount of days in the previous month
SnazCal.prototype.getLastMonthDays = function (year, month) {
    if (month == 0) {
        year -= 1;
        month = 11;
    }
    else {
        month -= 1;
    }
    return this.getDays(year, month);
};


// Displays a given month
SnazCal.prototype.list = function (year, month, date) {
    var year = (year === undefined || year === null) ? this.currentYear : year;
    var month = (month === undefined || month === null) ? this.currentMonth : month;
	var date = (date === undefined || date === null) ? this.currentDate : date;
    var daysInMonth = this.getDays(year, month);
    var currentDay = this.getFirstDay(year, month);
    
	// Clear Calendar
	this.daysCont.innerHTML = null;
	
	// Display month and year
	this.cont.getElementsByClassName('snaz-current month')[0].innerHTML = this.months[month];
	this.cont.getElementsByClassName('snaz-current year')[0].innerHTML = year;
	
	// Display weekdays
	var lastMonthDays = this.getLastMonthDays(year, month);
	
	// Empty days
	var emptyDayCount = this.firstDay;
	while (emptyDayCount !== currentDay) {
		var emptyDay = document.createElement('div');
		emptyDay.setAttribute('class', 'snaz-day empty');
		this.daysCont.appendChild(emptyDay);
		emptyDayCount = (emptyDayCount == 6) ? 0 : emptyDayCount+1;
	}
	
	// Days in the Month
    for (var i=1; i<=daysInMonth; i++) {
		var selected = (i === date && month == this.selectedMonth && year == this.selectedYear) ? " selected" : "";
		var fullDay = document.createElement('div');
		fullDay.tabIndex = 0;
		fullDay.setAttribute('class', 'snaz-day full'+selected);
		fullDay.dataset.value = i;
		fullDay.addEventListener('mousedown', this.select.bind(this, fullDay));
		fullDay.addEventListener('keydown', this.select.bind(this, fullDay));
		this.daysCont.appendChild(fullDay);
        currentDay = (currentDay == 6) ? 0 : currentDay+1;
	}
	
	// Empty days
	var numDays = document.getElementsByClassName('snaz-day').length;
	while (numDays%7 !== 0) {
		var emptyDay = document.createElement('div');
		emptyDay.setAttribute('class', 'snaz-day empty');
		this.daysCont.appendChild(emptyDay);
		emptyDay = (emptyDay == 6) ? 0 : emptyDay+1;
		numDays++;
	}
	
	// Rounded corners 
	if (this.roundedEdges === true) {
		var allDays = document.getElementsByClassName('snaz-day');
		var fullDays = document.getElementsByClassName('snaz-day full');
		allDays[(allDays.length-7)].classList.add('snaz-corner-bl');
		fullDays[0].classList.add('snaz-corner-tl');
		fullDays[fullDays.length-1].classList.add('snaz-corner-br');
		allDays[13].classList.add('snaz-corner-tr');
		if (allDays[allDays.length-1].classList.contains('empty')) {
			allDays[allDays.length-8].classList.add('snaz-corner-eb');
		}
		if (allDays[7].classList.contains('empty')) {
			allDays[14].classList.add('snaz-corner-et');
		}
	}
};


// Displays the previous or next month in the calendar
SnazCal.prototype.control = function (element, e) {
	if (e.type === "keydown" && e.keyCode !== 13) {
		return;
	}
	if (element.classList.contains('next')) {
		this.currentMonth = (this.currentMonth === 11) ? 0 : this.currentMonth+1;
		if (this.currentMonth === 0) {
			this.currentYear += 1;
		}
	}
	else {
		this.currentMonth = (this.currentMonth === 0) ? 11 : this.currentMonth-1;
		if (this.currentMonth === 11) {
			this.currentYear -= 1;
		}	
	}
	// Preventing the default allows the user to click without the color change showing
	e.preventDefault();
	e.stopPropagation();
	this.list();
};


// Selects a particular day
SnazCal.prototype.select = function (element, e) {
	if (e.type === "keydown" && e.keyCode !== 13) {
		return;
	}
	this.selectedYear = this.currentYear;
	this.selectedMonth = this.currentMonth;
	this.selectedDate = parseInt(element.dataset.value);
	this.currentDate = parseInt(element.dataset.value);
	this.value = new Date(this.selectedYear, this.selectedMonth, this.selectedDate);
	
	var selected = this.daysCont.getElementsByClassName('snaz-day full selected')[0];
	if (selected !== undefined) {
		selected.classList.remove('selected');
	}
	element.classList.add('selected');
	
	if (this.bound === true) {
		if (this.element.tagName === "INPUT") {
			this.element.value = this.formatValue();
			var event = new Event("change");
			this.element.dispatchEvent(event);
		}
		else {
			this.element.innerHTML = this.value.toDateString();
		}
		if (this.element.classList.contains('snaz-error')) {
			this.element.classList.remove('snaz-error');
		}
	}
	if (this.onSelect !== null) {
		this.onSelect();
	}
	if (this.bound === true) {
		this.hideCal();
	}
};


// Parses date text and selects given date
SnazCal.prototype.parseDate = function () {
	var tempDate = Date.parse(this.element.value.replace(/-/gi, "/"));
	if (tempDate) {
		var date = new Date(tempDate);
		// Prevents onSelect from firing twice do to the this.element onchange event handler
		if (date.toDateString() === this.value.toDateString()) {
			return;
		}
		this.selectedYear = date.getFullYear();
		this.selectedMonth = date.getMonth();
		this.selectedDate = date.getDate();
		
		this.currentYear = date.getFullYear();
		this.currentMonth = date.getMonth();
		this.currentDate = date.getDate();
		this.value = new Date(this.selectedYear, this.selectedMonth, this.selectedDate);
		
		this.list();
		this.element.value = this.formatValue();
		if (this.element.classList.contains('snaz-error')) {
			this.element.classList.remove('snaz-error');
		}
		if (this.onSelect !== null) {
			this.onSelect();
		}
	}
	else {
		this.element.classList.add('snaz-error');
	}
};

// Hides the calendar on keyboard input
SnazCal.prototype.emulatedBlur = function (e) {
	e.stopPropagation();
	if (e.keyCode !== 13) {
		return;
	}
	if (!this.isVisible()) {
		this.showCal();
		return;
	}
	var tempDate = Date.parse(this.element.value);
	if (!tempDate) {
		return;
	}
	var date = new Date(tempDate);
	if (this.selectedYear == date.getFullYear() && this.selectedMonth == date.getMonth() && this.selectedDate == date.getDate()) {
		this.hideCal();
	}
};


// Handles a click on a dropdown list
SnazCal.prototype.HandleDropdownClick = function (element, e) {
	if (e.type === "keydown" && e.keyCode !== 13) {
		return;
	}
	if (e.target.classList.contains('snaz-current') && element.classList.contains('snaz-show')) {
		element.classList.remove('snaz-show');
		e.stopPropagation();
		return;
	}
	this.hideDropdowns();
	if (!element.classList.contains('snaz-show')) {
		element.classList.add('snaz-show');
	}
	e.preventDefault();
	e.stopPropagation();
};


// Handles a click on a dropdown entry
SnazCal.prototype.HandleDropdownEntryClick = function (element, index, e) {
	if (e.type === "keydown" && e.keyCode !== 13) {
		return;
	}
	if (element.parentElement.classList.contains('month')) {
		this.list(null, index);
		this.currentMonth = index;
	}
	else if (element.parentElement.classList.contains('year')) {
		this.list(index);
		this.currentYear = index;
	}
	e.preventDefault();
	e.stopPropagation();
	this.hideDropdowns();
};


// Hides dropdowns
SnazCal.prototype.hideDropdowns = function () {
	var dropdowns = this.cont.getElementsByClassName('snaz-dd');
	for (var i=0, length=dropdowns.length; i<length; i++) {
		dropdowns[i].classList.remove('snaz-show');
	}
};


// Show and hide the calendar
SnazCal.prototype.showCal = function () {
	this.position();
	this.cont.classList.add('snaz-show');
};
SnazCal.prototype.hideCal = function () {
	this.cont.classList.remove('snaz-show');
	if (this.currentYear !== this.selectedYear || this.currentMonth !== this.selectedMonth) {
		this.list(this.selectedYear, this.selectedMonth);
	}
};


// Returns true if the calendar is visible
SnazCal.prototype.isVisible = function () {
	if (this.cont.classList.contains('snaz-show')) {
		return true;
	}
	return false;
}


// Main SnazCal click event
SnazCal.prototype.mainClick = function (element, e) {
	e.stopPropagation();
	// Hide dropdowns while they are being shown
	this.hideDropdowns();
	if (e.target === document.body || e.target === document.getElementsByTagName('html')[0]) {
		this.hideCal();
	}
};


// SnazCal Value Formatter
SnazCal.prototype.formatValue = function() {
	if (this.format === "datestring") {
		return this.value.toDateString();
	}
	var date = this.format;
	if (this.format.indexOf("yyyy") !== -1) {
		date = date.replace("yyyy", this.value.getFullYear());
	} else {
		date = date.replace("yy", this.value.getFullYear().toString().substring(2));
	}
	var month = ((this.value.getMonth()+1) < 10) ? "0"+(this.value.getMonth()+1) : this.value.getMonth()+1;
	date = date.replace("mm", month);
	var day = (this.value.getDate() < 10) ? "0"+this.value.getDate() : this.value.getDate();
	date = date.replace("dd", day);

	return date;
}