# @kazibee/google-calendar

Google Calendar tool for kazibee. Create, read, update, and delete calendar events from the sandbox.

## Install

```bash
kazibee install google-calendar github:kazibee/google-calendar
```

Install globally with `-g`:

```bash
kazibee install -g google-calendar github:kazibee/google-calendar
```

Or pin to a specific commit:

```bash
kazibee install google-calendar github:kazibee/google-calendar#COMMIT_SHA
```

## Login

```bash
kazibee google-calendar login
```

Opens your browser to authorize with Google. Credentials are stored automatically.

## API

### Calendars

- `listCalendars()` — list all calendars the user has access to
- `getCalendar(calendarId)` — get calendar metadata

### Events

- `listEvents(calendarId, options?)` — list events with optional filters (auto-paginates)
  - options: `{ timeMin?, timeMax?, query?, maxResults? }`
- `getEvent(calendarId, eventId)` — get a single event
- `createEvent(calendarId, event)` — create an event
- `updateEvent(calendarId, eventId, event)` — full replace of an event
- `patchEvent(calendarId, eventId, patch)` — partial update (only send changed fields)
- `deleteEvent(calendarId, eventId)` — delete an event
- `moveEvent(calendarId, eventId, destinationCalendarId)` — move event to another calendar
- `quickAdd(calendarId, text)` — create event from natural language string

### Recurring Events

- `createEvent` with `recurrence` field (RRULE strings)
- `listInstances(calendarId, eventId, options?)` — list occurrences of a recurring event

### Availability

- `freeBusy(request)` — check busy/free times across multiple calendars

### Google Meet

- Pass `addMeetLink: true` in `createEvent`, `updateEvent`, or `patchEvent` to auto-generate a Meet link

### Reminders

- Pass `reminders` in event input to set custom popup/email reminders

## Usage

```javascript
// List upcoming events
const events = await tools["google-calendar"].listEvents("primary", {
  timeMin: new Date().toISOString(),
  maxResults: 10,
});

// Create a meeting with Google Meet link
await tools["google-calendar"].createEvent("primary", {
  summary: "Team standup",
  start: { dateTime: "2025-01-15T09:00:00-05:00" },
  end: { dateTime: "2025-01-15T09:30:00-05:00" },
  attendees: [{ email: "alice@example.com" }],
  addMeetLink: true,
  reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 10 }] },
});

// Create a recurring weekly event
await tools["google-calendar"].createEvent("primary", {
  summary: "Weekly sync",
  start: { dateTime: "2025-01-13T10:00:00-05:00" },
  end: { dateTime: "2025-01-13T10:30:00-05:00" },
  recurrence: ["RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=12"],
});

// Partial update — just rename an event
await tools["google-calendar"].patchEvent("primary", "EVENT_ID", {
  summary: "Renamed meeting",
});

// Check availability before scheduling
const availability = await tools["google-calendar"].freeBusy({
  timeMin: "2025-01-15T08:00:00-05:00",
  timeMax: "2025-01-15T18:00:00-05:00",
  items: [{ id: "alice@example.com" }, { id: "bob@example.com" }],
});

// Move event to a different calendar
await tools["google-calendar"].moveEvent("primary", "EVENT_ID", "work-calendar-id");

// Quick add from natural language
await tools["google-calendar"].quickAdd("primary", "Lunch with Bob tomorrow at noon");
```
