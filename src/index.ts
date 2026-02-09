import { createAuthClient, type Env } from './auth';
import { createCalendarClient } from './calendar-client';

export type { Env } from './auth';
export type { CalendarInfo, EventInfo, EventInput, ListEventsOptions } from './calendar-client';

export default function main(env: Env) {
  const auth = createAuthClient(env);
  return createCalendarClient(auth);
}
