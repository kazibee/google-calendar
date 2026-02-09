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

- `listEvents(calendarId, options?)` — list events with optional filters
  - options: `{ timeMin?, timeMax?, query?, maxResults? }`
- `getEvent(calendarId, eventId)` — get a single event
- `createEvent(calendarId, event)` — create an event
- `updateEvent(calendarId, eventId, event)` — update an event
- `deleteEvent(calendarId, eventId)` — delete an event
- `quickAdd(calendarId, text)` — create event from natural language string

## Usage

```javascript
// List all calendars
const calendars = await tools["google-calendar"].listCalendars();

// List upcoming events
const events = await tools["google-calendar"].listEvents("primary", {
  timeMin: new Date().toISOString(),
  maxResults: 10,
});

// Create a timed event
await tools["google-calendar"].createEvent("primary", {
  summary: "Team standup",
  start: { dateTime: "2025-01-15T09:00:00-05:00" },
  end: { dateTime: "2025-01-15T09:30:00-05:00" },
  attendees: [{ email: "alice@example.com" }],
});

// Create an all-day event
await tools["google-calendar"].createEvent("primary", {
  summary: "Company retreat",
  start: { date: "2025-02-01" },
  end: { date: "2025-02-03" },
});

// Quick add from natural language
await tools["google-calendar"].quickAdd("primary", "Lunch with Bob tomorrow at noon");

// Update an event
await tools["google-calendar"].updateEvent("primary", "EVENT_ID", {
  summary: "Updated meeting title",
  start: { dateTime: "2025-01-15T10:00:00-05:00" },
  end: { dateTime: "2025-01-15T10:30:00-05:00" },
});

// Delete an event
await tools["google-calendar"].deleteEvent("primary", "EVENT_ID");
```
