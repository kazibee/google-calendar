import { calendar as createCalendar, type calendar_v3 } from '@googleapis/calendar';
import type { OAuth2Client } from 'google-auth-library';

type CalendarAPI = calendar_v3.Calendar;

export enum EventColor {
  Lavender = '1',
  Sage = '2',
  Grape = '3',
  Flamingo = '4',
  Banana = '5',
  Tangerine = '6',
  Peacock = '7',
  Graphite = '8',
  Blueberry = '9',
  Basil = '10',
  Tomato = '11',
}

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
  recurrence: string[];
  status: string;
  colorId: string;
  hangoutLink: string;
  htmlLink: string;
  reminders: { useDefault: boolean; overrides?: { method: string; minutes: number }[] };
}

export interface EventInput {
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  attendees?: { email: string }[];
  timeZone?: string;
  recurrence?: string[];
  colorId?: EventColor | string;
  reminders?: { useDefault: boolean; overrides?: { method: 'email' | 'popup'; minutes: number }[] };
  addMeetLink?: boolean;
}

export interface EventPatch {
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: { email: string }[];
  timeZone?: string;
  recurrence?: string[];
  colorId?: EventColor | string;
  reminders?: { useDefault: boolean; overrides?: { method: 'email' | 'popup'; minutes: number }[] };
  addMeetLink?: boolean;
}

export interface ListEventsOptions {
  timeMin?: string;
  timeMax?: string;
  query?: string;
  maxResults?: number;
}

export interface FreeBusyRequest {
  timeMin: string;
  timeMax: string;
  items: { id: string }[];
  timeZone?: string;
}

export interface FreeBusyResult {
  calendars: Record<string, { busy: { start: string; end: string }[]; errors?: string[] }>;
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
    patchEvent: (calendarId: string, eventId: string, patch: EventPatch) =>
      patchEvent(cal, calendarId, eventId, patch),
    deleteEvent: (calendarId: string, eventId: string) => deleteEvent(cal, calendarId, eventId),
    moveEvent: (calendarId: string, eventId: string, destinationCalendarId: string) =>
      moveEvent(cal, calendarId, eventId, destinationCalendarId),
    quickAdd: (calendarId: string, text: string) => quickAdd(cal, calendarId, text),
    listInstances: (calendarId: string, eventId: string, options?: ListEventsOptions) =>
      listInstances(cal, calendarId, eventId, options),
    freeBusy: (request: FreeBusyRequest) => freeBusy(cal, request),
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
  const allEvents: EventInfo[] = [];
  let pageToken: string | undefined;

  do {
    const res = await cal.events.list({
      calendarId,
      timeMin: options?.timeMin,
      timeMax: options?.timeMax,
      q: options?.query,
      maxResults: options?.maxResults,
      singleEvents: true,
      orderBy: 'startTime',
      pageToken,
    });
    allEvents.push(...(res.data.items ?? []).map(mapEvent));
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken && (!options?.maxResults || allEvents.length < options.maxResults));

  return options?.maxResults ? allEvents.slice(0, options.maxResults) : allEvents;
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
  const params: { calendarId: string; requestBody: calendar_v3.Schema$Event; conferenceDataVersion?: number } = {
    calendarId,
    requestBody: buildEventBody(event),
  };
  if (event.addMeetLink) {
    params.conferenceDataVersion = 1;
  }
  const res = await cal.events.insert(params);
  return mapEvent(res.data);
}

async function updateEvent(
  cal: CalendarAPI,
  calendarId: string,
  eventId: string,
  event: EventInput,
): Promise<EventInfo> {
  const params: { calendarId: string; eventId: string; requestBody: calendar_v3.Schema$Event; conferenceDataVersion?: number } = {
    calendarId,
    eventId,
    requestBody: buildEventBody(event),
  };
  if (event.addMeetLink) {
    params.conferenceDataVersion = 1;
  }
  const res = await cal.events.update(params);
  return mapEvent(res.data);
}

async function patchEvent(
  cal: CalendarAPI,
  calendarId: string,
  eventId: string,
  patch: EventPatch,
): Promise<EventInfo> {
  const body = buildPatchBody(patch);
  const params: { calendarId: string; eventId: string; requestBody: calendar_v3.Schema$Event; conferenceDataVersion?: number } = {
    calendarId,
    eventId,
    requestBody: body,
  };
  if (patch.addMeetLink) {
    params.conferenceDataVersion = 1;
  }
  const res = await cal.events.patch(params);
  return mapEvent(res.data);
}

async function deleteEvent(
  cal: CalendarAPI,
  calendarId: string,
  eventId: string,
): Promise<void> {
  await cal.events.delete({ calendarId, eventId });
}

async function moveEvent(
  cal: CalendarAPI,
  calendarId: string,
  eventId: string,
  destinationCalendarId: string,
): Promise<EventInfo> {
  const res = await cal.events.move({ calendarId, eventId, destination: destinationCalendarId });
  return mapEvent(res.data);
}

async function quickAdd(
  cal: CalendarAPI,
  calendarId: string,
  text: string,
): Promise<EventInfo> {
  const res = await cal.events.quickAdd({ calendarId, text });
  return mapEvent(res.data);
}

async function listInstances(
  cal: CalendarAPI,
  calendarId: string,
  eventId: string,
  options?: ListEventsOptions,
): Promise<EventInfo[]> {
  const allEvents: EventInfo[] = [];
  let pageToken: string | undefined;

  do {
    const res = await cal.events.instances({
      calendarId,
      eventId,
      timeMin: options?.timeMin,
      timeMax: options?.timeMax,
      maxResults: options?.maxResults,
      pageToken,
    });
    allEvents.push(...(res.data.items ?? []).map(mapEvent));
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken && (!options?.maxResults || allEvents.length < options.maxResults));

  return options?.maxResults ? allEvents.slice(0, options.maxResults) : allEvents;
}

async function freeBusy(cal: CalendarAPI, request: FreeBusyRequest): Promise<FreeBusyResult> {
  const res = await cal.freebusy.query({
    requestBody: {
      timeMin: request.timeMin,
      timeMax: request.timeMax,
      timeZone: request.timeZone,
      items: request.items,
    },
  });

  const calendars: FreeBusyResult['calendars'] = {};
  const raw = res.data.calendars ?? {};
  for (const [id, cal] of Object.entries(raw)) {
    calendars[id] = {
      busy: (cal.busy ?? []).map((b) => ({
        start: b.start ?? '',
        end: b.end ?? '',
      })),
      errors: cal.errors?.map((e) => e.reason ?? '') ?? undefined,
    };
  }
  return { calendars };
}

// -- Helpers --

function buildEventBody(event: EventInput): calendar_v3.Schema$Event {
  const body: calendar_v3.Schema$Event = {
    summary: event.summary,
    description: event.description,
    location: event.location,
    colorId: event.colorId,
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
  if (event.recurrence) {
    body.recurrence = event.recurrence;
  }
  if (event.reminders) {
    body.reminders = event.reminders;
  }
  if (event.addMeetLink) {
    body.conferenceData = {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    };
  }
  return body;
}

function buildPatchBody(patch: EventPatch): calendar_v3.Schema$Event {
  const body: calendar_v3.Schema$Event = {};
  if (patch.summary !== undefined) body.summary = patch.summary;
  if (patch.description !== undefined) body.description = patch.description;
  if (patch.location !== undefined) body.location = patch.location;
  if (patch.colorId !== undefined) body.colorId = patch.colorId;
  if (patch.start !== undefined) {
    body.start = patch.timeZone ? { ...patch.start, timeZone: patch.timeZone } : patch.start;
  }
  if (patch.end !== undefined) {
    body.end = patch.timeZone ? { ...patch.end, timeZone: patch.timeZone } : patch.end;
  }
  if (patch.attendees !== undefined) {
    body.attendees = patch.attendees.map((a) => ({ email: a.email }));
  }
  if (patch.recurrence !== undefined) {
    body.recurrence = patch.recurrence;
  }
  if (patch.reminders !== undefined) {
    body.reminders = patch.reminders;
  }
  if (patch.addMeetLink) {
    body.conferenceData = {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    };
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
    recurrence: data.recurrence ?? [],
    status: data.status ?? '',
    colorId: data.colorId ?? '',
    hangoutLink: data.hangoutLink ?? '',
    htmlLink: data.htmlLink ?? '',
    reminders: {
      useDefault: data.reminders?.useDefault ?? true,
      overrides: data.reminders?.overrides?.map((o) => ({
        method: o.method ?? '',
        minutes: o.minutes ?? 0,
      })),
    },
  };
}
