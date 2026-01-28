// Countdown to 20 August 2026, 9:00 AM Singapore time (UTC+8)
const targetTime = new Date("2026-08-20T01:00:00Z"); // 9 AM SGT = 1 AM UTC

const elements = {
  days: document.getElementById("days"),
  hours: document.getElementById("hours"),
  minutes: document.getElementById("minutes"),
  seconds: document.getElementById("seconds"),
  message: document.getElementById("message"),
};

const blocks = {
  days: elements.days?.closest(".time-block"),
  hours: elements.hours?.closest(".time-block"),
  minutes: elements.minutes?.closest(".time-block"),
  seconds: elements.seconds?.closest(".time-block"),
};

function pad(num) {
  return String(num).padStart(2, "0");
}

function pulseBlock(block) {
  if (!block) return;
  block.classList.add("time-block--pulse");
  setTimeout(() => block.classList.remove("time-block--pulse"), 300);
}

function updateCountdown() {
  const now = new Date();
  const diffMs = targetTime - now;

  if (diffMs <= 0) {
    elements.days.textContent = "00";
    elements.hours.textContent = "00";
    elements.minutes.textContent = "00";
    elements.seconds.textContent = "00";
    elements.message.textContent =
      "The special day is here! Thank you for waiting with me. ♡";
    return;
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const hours = totalHours % 24;
  const days = Math.floor(totalHours / 24);

  const prevValues = {
    seconds: elements.seconds.textContent,
    minutes: elements.minutes.textContent,
    hours: elements.hours.textContent,
    days: elements.days.textContent,
  };

  elements.days.textContent = pad(days);
  elements.hours.textContent = pad(hours);
  elements.minutes.textContent = pad(minutes);
  elements.seconds.textContent = pad(seconds);

  // Cute little pulse when the value changes
  if (prevValues.seconds !== pad(seconds)) pulseBlock(blocks.seconds);
  if (prevValues.minutes !== pad(minutes)) pulseBlock(blocks.minutes);
  if (prevValues.hours !== pad(hours)) pulseBlock(blocks.hours);
  if (prevValues.days !== pad(days)) pulseBlock(blocks.days);

  elements.message.textContent = `Only ${days} day${
    days === 1 ? "" : "s"
  } left with ${pad(hours)}:${pad(minutes)}:${pad(seconds)} to go.`;
}

updateCountdown();
setInterval(updateCountdown, 1000);

