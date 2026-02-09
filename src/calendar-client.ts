import { calendar as createCalendar, type calendar_v3 } from '@googleapis/calendar';
import type { OAuth2Client } from 'google-auth-library';

type CalendarAPI = calendar_v3.Calendar;

export interface CalendarInfo {
  id: string;
  summary: string;
  description: string;
  timeZone: string;
  primary: boolean;
}

export interface EventInfo {
  id: string;
  summary: string;
  description: string;
  location: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  attendees: { email: string; displayName?: string; responseStatus?: string }[];
  status: string;
  htmlLink: string;
}

export interface EventInput {
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  attendees?: { email: string }[];
  timeZone?: string;
}

export interface ListEventsOptions {
  timeMin?: string;
  timeMax?: string;
  query?: string;
  maxResults?: number;
}

export function createCalendarClient(auth: OAuth2Client) {
  const cal = createCalendar({ version: 'v3', auth });

  return {
    listCalendars: () => listCalendars(cal),
    getCalendar: (calendarId: string) => getCalendar(cal, calendarId),
    listEvents: (calendarId: string, options?: ListEventsOptions) =>
      listEvents(cal, calendarId, options),
    getEvent: (calendarId: string, eventId: string) => getEvent(cal, calendarId, eventId),
    createEvent: (calendarId: string, event: EventInput) => createEvent(cal, calendarId, event),
    updateEvent: (calendarId: string, eventId: string, event: EventInput) =>
      updateEvent(cal, calendarId, eventId, event),
    deleteEvent: (calendarId: string, eventId: string) => deleteEvent(cal, calendarId, eventId),
    quickAdd: (calendarId: string, text: string) => quickAdd(cal, calendarId, text),
  };
}

// -- Calendar operations --

async function listCalendars(cal: CalendarAPI): Promise<CalendarInfo[]> {
  const res = await cal.calendarList.list();
  return (res.data.items ?? []).map(mapCalendar);
}

async function getCalendar(cal: CalendarAPI, calendarId: string): Promise<CalendarInfo> {
  const res = await cal.calendarList.get({ calendarId });
  return mapCalendar(res.data);
}

// -- Event operations --

async function listEvents(
  cal: CalendarAPI,
  calendarId: string,
  options?: ListEventsOptions,
): Promise<EventInfo[]> {
  const res = await cal.events.list({
    calendarId,
    timeMin: options?.timeMin,
    timeMax: options?.timeMax,
    q: options?.query,
    maxResults: options?.maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });
  return (res.data.items ?? []).map(mapEvent);
}

async function getEvent(
  cal: CalendarAPI,
  calendarId: string,
  eventId: string,
): Promise<EventInfo> {
  const res = await cal.events.get({ calendarId, eventId });
  return mapEvent(res.data);
}

async function createEvent(
  cal: CalendarAPI,
  calendarId: string,
  event: EventInput,
): Promise<EventInfo> {
  const res = await cal.events.insert({
    calendarId,
    requestBody: buildEventBody(event),
  });
  return mapEvent(res.data);
}

async function updateEvent(
  cal: CalendarAPI,
  calendarId: string,
  eventId: string,
  event: EventInput,
): Promise<EventInfo> {
  const res = await cal.events.update({
    calendarId,
    eventId,
    requestBody: buildEventBody(event),
  });
  return mapEvent(res.data);
}

async function deleteEvent(
  cal: CalendarAPI,
  calendarId: string,
  eventId: string,
): Promise<void> {
  await cal.events.delete({ calendarId, eventId });
}

async function quickAdd(
  cal: CalendarAPI,
  calendarId: string,
  text: string,
): Promise<EventInfo> {
  const res = await cal.events.quickAdd({ calendarId, text });
  return mapEvent(res.data);
}

// -- Helpers --

function buildEventBody(event: EventInput): calendar_v3.Schema$Event {
  const body: calendar_v3.Schema$Event = {
    summary: event.summary,
    description: event.description,
    location: event.location,
    start: event.timeZone
      ? { ...event.start, timeZone: event.timeZone }
      : event.start,
    end: event.timeZone
      ? { ...event.end, timeZone: event.timeZone }
      : event.end,
  };
  if (event.attendees) {
    body.attendees = event.attendees.map((a) => ({ email: a.email }));
  }
  return body;
}

// -- Mappers --

function mapCalendar(data: calendar_v3.Schema$CalendarListEntry): CalendarInfo {
  return {
    id: data.id ?? '',
    summary: data.summary ?? '',
    description: data.description ?? '',
    timeZone: data.timeZone ?? '',
    primary: data.primary ?? false,
  };
}

function mapEvent(data: calendar_v3.Schema$Event): EventInfo {
  return {
    id: data.id ?? '',
    summary: data.summary ?? '',
    description: data.description ?? '',
    location: data.location ?? '',
    start: {
      dateTime: data.start?.dateTime ?? undefined,
      date: data.start?.date ?? undefined,
    },
    end: {
      dateTime: data.end?.dateTime ?? undefined,
      date: data.end?.date ?? undefined,
    },
    attendees: (data.attendees ?? []).map((a) => ({
      email: a.email ?? '',
      displayName: a.displayName ?? undefined,
      responseStatus: a.responseStatus ?? undefined,
    })),
    status: data.status ?? '',
    htmlLink: data.htmlLink ?? '',
  };
}
