// ============================================================================
// CONSTANTS & STATE
// ============================================================================

// Days of the week with their indices (Sunday = 0 to match Date.getDay())
const daysData = [
  ["Monday", 1],
  ["Tuesday", 2],
  ["Wednesday", 3],
  ["Thursday", 4],
  ["Friday", 5],
  ["Saturday", 6],
  ["Sunday", 0],
];

// Extract day names for iteration
const days = daysData.map(([name]) => name);

// Day mapping for offset calculation (no arithmetic needed)
const dayMap = Object.fromEntries(daysData);

// Month abbreviations
const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// All IANA time zones supported by the browser
const allTimezones = Intl.supportedValuesOf("timeZone");

// Team member data with time zones and schedules
const teamData = {
  "Yuki Tanaka": {
    timezone: "Australia/Sydney",
    schedule: {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [{ start: 8, end: 12 }],
      Sunday: [],
    },
  },
  "Priya Sharma": {
    timezone: "Australia/Adelaide",
    schedule: {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [{ start: 8, end: 12 }],
      Sunday: [],
    },
  },
  "Diego Ramírez": {
    timezone: "America/New_York",
    schedule: {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [{ start: 3, end: 7 }],
      Saturday: [],
      Sunday: [],
    },
  },
};

// Derived from team data
const people = Object.keys(teamData);

// DST data structure for timezone calculations
const dstData = {};

// Global variable for selected display timezone
let displayTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Calculate days between two dates (assuming same year)
function calculateDuration(startDate, endDate) {
  const year = new Date().getFullYear();
  const start = new Date(`${startDate}, ${year}`);
  const end = new Date(`${endDate}, ${year}`);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
  return diffDays;
}

// Interpolate between two colors based on a percentage (0-1)
function interpolateColor(color1, color2, percentage) {
  // Parse hex colors to RGB
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);

  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);

  // Interpolate each channel
  const r = Math.round(r1 + (r2 - r1) * percentage);
  const g = Math.round(g1 + (g2 - g1) * percentage);
  const b = Math.round(b1 + (b2 - b1) * percentage);

  // Convert back to hex
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// Calculate heat map color based on availability percentage
function getHeatMapColor(availableCount, maxCount) {
  if (availableCount === 0) {
    return "#ffffff"; // White for 0 people
  }

  const percentage = availableCount / maxCount;
  // Interpolate from white (#ffffff) to peach-400 (#ff9977)
  return interpolateColor("#ffffff", "#ff9977", percentage);
}

// Check if today's date falls within a date range
function isDateInRange(startDate, endDate) {
  const year = new Date().getFullYear();
  const today = new Date();
  const start = new Date(`${startDate}, ${year}`);
  const end = new Date(`${endDate}, ${year}`);
  return today >= start && today <= end;
}

// Generate segments dynamically
function generateYearBar(ranges) {
  const yearBar = document.getElementById("year-bar");
  yearBar.innerHTML = ""; // Clear existing segments

  let todaySegmentIndex = -1;

  ranges.forEach((range, index) => {
    const duration = calculateDuration(range.start, range.end);

    // Create label wrapper (acts as button)
    const label = document.createElement("label");
    label.className = "segment";
    label.style.flexGrow = duration; // Set width proportional to duration

    // Create hidden radio button
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "year-segment";
    radio.value = index;
    radio.className = "segment-radio";
    radio.id = `segment-${index}`;

    // Check if today falls in this range
    if (isDateInRange(range.start, range.end)) {
      todaySegmentIndex = index;
    }

    label.appendChild(radio);
    label.setAttribute("for", `segment-${index}`);
    label.setAttribute("aria-label", `${range.start} - ${range.end}`);
    yearBar.appendChild(label);
  });

  // Select today's segment by default, or first segment if today isn't in any range
  const defaultIndex = todaySegmentIndex >= 0 ? todaySegmentIndex : 0;
  const defaultRadio = document.getElementById(`segment-${defaultIndex}`);
  if (defaultRadio) {
    defaultRadio.checked = true;
  }

  // Add change handlers for segment selection
  const radios = document.querySelectorAll(".segment-radio");
  radios.forEach((radio) => {
    radio.addEventListener("change", function () {
      const rangeIndex = parseInt(this.value);
      updateTeamTimezones(rangeIndex);
      generateScheduleTable(rangeIndex);
      updateSelectedRangeDisplay(rangeIndex);
    });
  });

  // Generate month timeline
  generateMonthTimeline();

  // Update selected range display
  updateSelectedRangeDisplay(defaultIndex);

  // Add click handlers after generating segments
  addClickHandlers();
}

// Add click handlers
function addClickHandlers() {
  // Radio buttons handle selection automatically
  // No additional handlers needed
}

// DST utilities
function getDSTTransitions(timezone, year = new Date().getFullYear()) {
  const transitions = [];

  // Check each day of the year for offset changes
  let previousOffset = null;

  for (let month = 0; month < 12; month++) {
    for (let day = 1; day <= 31; day++) {
      try {
        const date = new Date(year, month, day);
        if (date.getMonth() !== month) break; // Invalid date

        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
          timeZoneName: "shortOffset",
        });

        const parts = formatter.formatToParts(date);
        const offsetPart = parts.find((p) => p.type === "timeZoneName");
        const offset = offsetPart ? offsetPart.value : null;

        if (previousOffset !== null && offset !== previousOffset) {
          transitions.push({
            date: new Date(year, month, day),
            fromOffset: previousOffset,
            toOffset: offset,
          });
        }

        previousOffset = offset;
      } catch (e) {
        // Invalid date, skip
      }
    }
  }

  return transitions;
}

function getCurrentOffset(timezone, date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "shortOffset",
  });
  const parts = formatter.formatToParts(date);
  const offsetPart = parts.find((p) => p.type === "timeZoneName");
  return offsetPart ? offsetPart.value : "Unknown";
}

function observesDST(timezone) {
  const transitions = getDSTTransitions(timezone);
  return transitions.length > 0;
}

// Initialize DST information for all timezones
function initializeDSTInfo() {
  const year = new Date().getFullYear();

  // Get unique timezones
  const timezones = [
    ...new Set(people.map((person) => teamData[person].timezone)),
  ];

  timezones.forEach((timezone) => {
    const transitions = getDSTTransitions(timezone, year);

    dstData[timezone] = {
      observes: transitions.length > 0,
      transitions: transitions,
      currentOffset: getCurrentOffset(timezone),
    };
  });
}

// Call this during initialization
initializeDSTInfo();

// Generate date ranges based on DST transitions
function generateDSTBasedDateRanges() {
  const year = new Date().getFullYear();
  const transitionDates = [];

  // Collect all DST transition dates from all timezones
  Object.keys(dstData).forEach((timezone) => {
    const info = dstData[timezone];
    if (info.transitions && info.transitions.length > 0) {
      info.transitions.forEach((transition) => {
        transitionDates.push(transition.date);
      });
    }
  });

  // Sort dates chronologically and remove duplicates
  const uniqueDates = [...new Set(transitionDates.map((d) => d.getTime()))]
    .sort((a, b) => a - b)
    .map((timestamp) => new Date(timestamp));

  // Build date ranges
  const ranges = [];
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31);

  if (uniqueDates.length === 0) {
    // No DST transitions, return full year
    return [
      {
        start: startOfYear,
        end: endOfYear,
      },
    ];
  }

  // First range: start of year to first transition
  if (uniqueDates[0] > startOfYear) {
    const dayBefore = new Date(uniqueDates[0]);
    dayBefore.setDate(dayBefore.getDate() - 1);
    ranges.push({
      start: startOfYear,
      end: dayBefore,
    });
  }

  // Middle ranges: between transitions
  for (let i = 0; i < uniqueDates.length; i++) {
    const start = uniqueDates[i];
    const end =
      i < uniqueDates.length - 1
        ? new Date(uniqueDates[i + 1].getTime() - 24 * 60 * 60 * 1000) // Day before next transition
        : endOfYear;

    ranges.push({
      start: start,
      end: end,
    });
  }

  return ranges;
}

// Format date to "Mon Day" format (e.g., "Jan 1", "Mar 10")
function formatDateForYearBar(date) {
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

// Generate DST-based date ranges
const dstDateRanges = generateDSTBasedDateRanges();

// Convert to format expected by year bar component
const dateRanges = dstDateRanges.map((range) => ({
  start: formatDateForYearBar(range.start),
  end: formatDateForYearBar(range.end),
}));

// Validate IANA time zone
function isValidTimezone(tz) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch (e) {
    return false;
  }
}

// Update team member highlighting based on selected timezone
function updateTeamMemberHighlight() {
  const teamMembers = document.querySelectorAll(".team-member");

  teamMembers.forEach((memberDiv) => {
    const person = memberDiv.dataset.person;
    const personTimezone = teamData[person].timezone;

    if (personTimezone === displayTimezone) {
      memberDiv.classList.add("selected");
    } else {
      memberDiv.classList.remove("selected");
    }
  });
}

// Generate team members list
function generateTeamList() {
  const teamList = document.getElementById("team-list");

  // Show helpful message if no team members
  if (people.length === 0) {
    const emptyMessage = document.createElement("div");
    emptyMessage.className = "team-list-empty";
    emptyMessage.innerHTML = `
      <div class="empty-icon">☕</div>
      <div class="empty-text">Add some people and their time zones to get started</div>
    `;
    teamList.appendChild(emptyMessage);
    return;
  }

  people.forEach((person) => {
    const memberDiv = document.createElement("div");
    memberDiv.className = "team-member";
    memberDiv.dataset.person = person;

    const nameSpan = document.createElement("span");
    nameSpan.className = "team-member-name";
    nameSpan.textContent = person;

    const timezoneInfo = document.createElement("span");
    timezoneInfo.className = "team-member-timezone";
    timezoneInfo.dataset.timezone = teamData[person].timezone;

    memberDiv.appendChild(nameSpan);
    memberDiv.appendChild(timezoneInfo);

    // Add click handler to fill timezone input
    memberDiv.addEventListener("click", function () {
      const timezone = teamData[person].timezone;
      const timezoneInput = document.getElementById("timezone-input");

      timezoneInput.value = timezone;
      // Trigger change event to update schedule
      timezoneInput.dispatchEvent(new Event("change"));
    });

    // Add cursor pointer style
    memberDiv.style.cursor = "pointer";

    teamList.appendChild(memberDiv);
  });

  // Initialize with current date
  updateTeamTimezones();

  // Initialize highlighting
  updateTeamMemberHighlight();
}

// Update team member timezone displays for selected date range
function updateTeamTimezones(dateRangeIndex = null) {
  // Get selected date range
  if (dateRangeIndex === null) {
    const selectedRadio = document.querySelector(".segment-radio:checked");
    dateRangeIndex = selectedRadio ? parseInt(selectedRadio.value) : 0;
  }

  const selectedRange = dstDateRanges[dateRangeIndex];
  if (!selectedRange) return;

  // Use middle of date range for offset calculation
  const midDate = new Date(
    (selectedRange.start.getTime() + selectedRange.end.getTime()) / 2,
  );

  // Update each team member's timezone display
  people.forEach((person) => {
    const tz = teamData[person].timezone;
    const timezoneSpan = document.querySelector(
      `.team-member[data-person="${person}"] .team-member-timezone`,
    );

    if (timezoneSpan) {
      const offset = getCurrentOffset(tz, midDate);
      const dstInfo = dstData[tz];
      const dstIndicator = dstInfo && dstInfo.observes ? " (DST)" : "";

      timezoneSpan.textContent = `${tz} ${offset}${dstIndicator}`;
    }
  });
}

// Helper function to create a date at a specific time in a given timezone
function createDateInTimezone(baseDate, hour, minute, timeZone) {
  const str = baseDate.toLocaleString("en-US", { timeZone });
  const result = new Date(str);
  const offset = new Date(
    result.getTime() + hour * 60 * 60 * 1000 + minute * 60 * 1000,
  );
  // console.log(offset, timezone, str, result)
  return offset;
}

// Helper function to check if a person is available at a specific date/time
function isAvailable(person, dateTime) {
  const personTimezone = teamData[person].timezone;

  // Convert the datetime to the person's timezone
  const personFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: personTimezone,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    weekday: "long",
  });

  const personParts = personFormatter.formatToParts(dateTime);
  const personDay = personParts.find((p) => p.type === "weekday").value;
  const personHour = parseInt(personParts.find((p) => p.type === "hour").value);
  const personMinute = parseInt(
    personParts.find((p) => p.type === "minute").value,
  );
  const personTimeSlot = personHour + personMinute / 60;

  // Check against their schedule for their local day
  const personSchedule = teamData[person].schedule[personDay];
  if (!personSchedule || personSchedule.length === 0) {
    return false;
  }

  return personSchedule.some((slot) => {
    return personTimeSlot >= slot.start && personTimeSlot < slot.end;
  });
}

// Generate weekly schedule table
function generateScheduleTable(selectedRangeIndex = 0) {
  const table = document.getElementById("schedule-table");
  table.innerHTML = ""; // Clear existing table

  // Get the selected date range and calculate midDate
  const selectedRange = dstDateRanges[selectedRangeIndex];
  if (!selectedRange) return;

  const midDate = new Date(
    (selectedRange.start.getTime() + selectedRange.end.getTime()) / 2,
  );

  // Create header row
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  // Empty cell for time column
  const timeHeader = document.createElement("th");
  timeHeader.textContent = "Time";
  headerRow.appendChild(timeHeader);

  // Day headers
  days.forEach((day) => {
    const th = document.createElement("th");
    th.textContent = day.slice(0, 3);
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create body with time slots
  const tbody = document.createElement("tbody");

  // Generate 48 half-hour slots (24 hours * 2)
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const row = document.createElement("tr");

      // Time cell
      const timeCell = document.createElement("td");
      timeCell.className = "time-cell";

      // Format time as 12-hour with AM/PM
      const displayHour = hour; // === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const displayMinute = minute === 0 ? "00" : minute;
      timeCell.textContent = `${displayHour}:${displayMinute}`;

      row.appendChild(timeCell);

      // Day cells with availability-based person labels
      days.forEach((day) => {
        const cell = document.createElement("td");
        cell.className = "schedule-cell";

        // Calculate the date offset for this day of week
        const targetDay = dayMap[day];
        const midDay = midDate.getDay();
        const daysToAdd = (targetDay - midDay + 7) % 7;

        const baseDate = new Date(midDate);
        baseDate.setDate(baseDate.getDate() + daysToAdd);

        // Create date at specific time in the display timezone
        const slotDate = createDateInTimezone(
          baseDate,
          hour,
          minute,
          displayTimezone,
        );

        // Check which people are available at this time slot
        const availablePeople = people.filter((person) => {
          if (person == "Priya Sharma" && hour == 8 && minute == 0) {
            console.log({ baseDate, hour, minute, slotDate });
          }
          return isAvailable(person, slotDate);
        });

        // Add available people to the cell
        availablePeople.forEach((person) => {
          const personLabel = document.createElement("div");
          personLabel.className = "person-label";
          personLabel.textContent = person;
          cell.appendChild(personLabel);
        });

        // Apply heat map color based on percentage of available people
        const heatColor = getHeatMapColor(
          availablePeople.length,
          people.length,
        );

        cell.style.backgroundColor = heatColor;

        // Keep heat-0 class for empty row detection
        if (availablePeople.length === 0) {
          cell.classList.add("heat-0");
        }

        row.appendChild(cell);
      });

      tbody.appendChild(row);
    }
  }

  table.appendChild(tbody);

  // Collapse empty rows
  const rows = tbody.querySelectorAll("tr");
  rows.forEach((row) => {
    const scheduleCells = row.querySelectorAll(".schedule-cell");
    const isEmpty = Array.from(scheduleCells).every((cell) =>
      cell.classList.contains("heat-0"),
    );

    if (isEmpty) {
      row.classList.add("collapsed-row");
      const timeCell = row.querySelector(".time-cell");
      if (timeCell) {
        timeCell.classList.add("collapsed-time");
      }
    }
  });
}

// Generate month timeline below year bar
function generateMonthTimeline() {
  const timeline = document.getElementById("year-bar-timeline");
  const year = new Date().getFullYear();
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59);
  const yearDuration = yearEnd - yearStart;

  months.forEach((month, index) => {
    const monthDiv = document.createElement("div");
    monthDiv.className = "month-marker";

    // Calculate midpoint of month span
    const monthStart = new Date(year, index, 1);
    const monthEnd = new Date(year, index + 1, 0, 23, 59, 59); // Last day of month

    const monthStartOffset = monthStart - yearStart;
    const monthEndOffset = monthEnd - yearStart;
    const monthMidpoint = (monthStartOffset + monthEndOffset) / 2;

    const position = (monthMidpoint / yearDuration) * 100;

    monthDiv.style.left = `${position}%`;
    monthDiv.textContent = month;

    timeline.appendChild(monthDiv);
  });
}

// Update selected range display
function updateSelectedRangeDisplay(rangeIndex) {
  const display = document.getElementById("selected-range-display");
  const range = dateRanges[rangeIndex];

  if (range) {
    display.textContent = `${range.start} - ${range.end}`;
  }
}

// Initialize time zone selector
function initializeTimezoneSelector() {
  const timezoneInput = document.getElementById("timezone-input");
  const timezoneList = document.getElementById("timezone-list");
  const timezoneError = document.getElementById("timezone-error");

  // Populate datalist with time zones
  allTimezones.forEach((tz) => {
    const option = document.createElement("option");
    option.value = tz;
    timezoneList.appendChild(option);
  });

  // Set default to browser's time zone
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  timezoneInput.value = browserTimezone;

  // Validate on input change and update schedule
  timezoneInput.addEventListener("change", function () {
    const value = this.value.trim();
    if (value && !isValidTimezone(value)) {
      timezoneError.textContent = "Invalid time zone";
      this.classList.add("invalid");
    } else {
      timezoneError.textContent = "";
      this.classList.remove("invalid");

      // Update display timezone and regenerate schedule
      if (value && isValidTimezone(value)) {
        displayTimezone = value;

        // Get current selected segment
        const selectedRadio = document.querySelector(".segment-radio:checked");
        const rangeIndex = selectedRadio ? parseInt(selectedRadio.value) : 0;

        // Regenerate schedule with new timezone
        generateScheduleTable(rangeIndex);

        // Update team member highlighting
        updateTeamMemberHighlight();
      }
    }
  });

  // Clear error on input
  timezoneInput.addEventListener("input", function () {
    if (timezoneError.textContent) {
      timezoneError.textContent = "";
      this.classList.remove("invalid");
    }
  });

  // Auto-fill first match on Enter key
  timezoneInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = this.value.trim().toLowerCase();

      if (value) {
        // Find first matching time zone
        const match = allTimezones.find((tz) =>
          tz.toLowerCase().includes(value),
        );

        if (match) {
          this.value = match;
          // Trigger change event for validation
          this.dispatchEvent(new Event("change"));
        }
      }
    }
  });

  // Clear button functionality
  const clearButton = document.getElementById("timezone-clear");

  function updateClearButtonVisibility() {
    if (timezoneInput.value.trim()) {
      clearButton.style.display = "block";
    } else {
      clearButton.style.display = "none";
    }
  }

  clearButton.addEventListener("click", function () {
    timezoneInput.value = "";
    timezoneError.textContent = "";
    timezoneInput.classList.remove("invalid");
    updateClearButtonVisibility();
    timezoneInput.focus();
  });

  timezoneInput.addEventListener("input", updateClearButtonVisibility);

  // Initial visibility check
  updateClearButtonVisibility();
}

// Initialize the page
initializeTimezoneSelector();
generateTeamList();
generateYearBar(dateRanges);

// Generate schedule with default (today's) segment
const defaultSegment = document.querySelector(".segment-radio:checked");
const defaultIndex = defaultSegment ? parseInt(defaultSegment.value) : 0;
generateScheduleTable(defaultIndex);

// Hide loading indicator and show content
const loadingIndicator = document.getElementById("loading-indicator");
const container = document.getElementById("container");
if (loadingIndicator) {
  loadingIndicator.classList.add("hidden");
}
if (container) {
  container.classList.add("loaded");
}
