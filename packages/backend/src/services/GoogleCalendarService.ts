import { Effect, Schema } from "effect";

export const CalendarEvent = Schema.Struct({
	id: Schema.String,
	summary: Schema.String,
	description: Schema.optional(Schema.String),
	start: Schema.String,
	end: Schema.String,
	attendees: Schema.optional(Schema.Array(Schema.String)),
});

export const TimeSlot = Schema.Struct({
	start: Schema.String,
	end: Schema.String,
});

export type CalendarEvent = Schema.Schema.Type<typeof CalendarEvent>;
export type TimeSlot = Schema.Schema.Type<typeof TimeSlot>;

export class GoogleCalendarService extends Effect.Service<GoogleCalendarService>()(
	"app/GoogleCalendarService",
	{
		succeed: {
			listEvents: (timeMin: string, timeMax: string) =>
				Effect.gen(function* () {
					yield* Effect.log(
						`Mock: Listing events from ${timeMin} to ${timeMax}`,
					);

					const events: CalendarEvent[] = [];
					const now = new Date();
					const tomorrow = new Date(now);
					tomorrow.setDate(tomorrow.getDate() + 1);

					events.push(
						{
							id: "mock-1",
							summary: "Team Meeting",
							start: new Date(now.getTime() + 3600000).toISOString(), // 1 hour from now
							end: new Date(now.getTime() + 5400000).toISOString(), // 1.5 hours from now
						},
						{
							id: "mock-2",
							summary: "Client Call",
							description: "Quarterly review",
							start: tomorrow.toISOString(),
							end: new Date(tomorrow.getTime() + 3600000).toISOString(),
							attendees: ["client@example.com"],
						},
					);

					return events.filter((event) => {
						const eventStart = new Date(event.start);
						return (
							eventStart >= new Date(timeMin) && eventStart <= new Date(timeMax)
						);
					});
				}),

			createEvent: (event: Omit<CalendarEvent, "id">) =>
				Effect.gen(function* () {
					yield* Effect.log(`Mock: Creating event "${event.summary}"`);

					return {
						...event,
						id: `mock-${Date.now()}`,
					};
				}),

			getBusyTimes: (timeMin: string, timeMax: string) =>
				Effect.gen(function* () {
					yield* Effect.log(
						`Mock: Getting busy times from ${timeMin} to ${timeMax}`,
					);

					const busySlots: TimeSlot[] = [];
					const now = new Date();

					const busyStart = new Date(now.getTime() + 3600000); // 1 hour from now
					const busyEnd = new Date(now.getTime() + 5400000); // 1.5 hours from now

					if (
						busyStart >= new Date(timeMin) &&
						busyStart <= new Date(timeMax)
					) {
						busySlots.push({
							start: busyStart.toISOString(),
							end: busyEnd.toISOString(),
						});
					}

					return busySlots;
				}),

			checkAvailability: (start: string, end: string) =>
				Effect.gen(function* () {
					yield* Effect.log(
						`Mock: Checking availability from ${start} to ${end}`,
					);

					const checkStart = new Date(start);
					const checkEnd = new Date(end);

					const rangeStart = new Date(checkStart.getTime() - 86400000); // 1 day before
					const rangeEnd = new Date(checkEnd.getTime() + 86400000); // 1 day after

					const service = yield* GoogleCalendarService;
					const busyTimes = yield* service.getBusyTimes(
						rangeStart.toISOString(),
						rangeEnd.toISOString(),
					);

					for (const busy of busyTimes) {
						const busyStart = new Date(busy.start);
						const busyEnd = new Date(busy.end);

						if (checkStart < busyEnd && checkEnd > busyStart) {
							return false;
						}
					}

					return true;
				}),
		},
	},
) {}
