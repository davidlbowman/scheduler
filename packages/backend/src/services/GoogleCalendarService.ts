import { Effect, Schema } from "effect";

export const AvailableSlot = Schema.Struct({
	start: Schema.String,
	end: Schema.String,
});

export const BookingRequest = Schema.Struct({
	start: Schema.String,
	guestEmail: Schema.String,
	guestName: Schema.optional(Schema.String),
	summary: Schema.optional(Schema.String),
});

export const BookingResponse = Schema.Struct({
	id: Schema.String,
	start: Schema.String,
	end: Schema.String,
	guestEmail: Schema.String,
});

export type AvailableSlot = Schema.Schema.Type<typeof AvailableSlot>;
export type BookingRequest = Schema.Schema.Type<typeof BookingRequest>;
export type BookingResponse = Schema.Schema.Type<typeof BookingResponse>;

export class GoogleCalendarService extends Effect.Service<GoogleCalendarService>()(
	"app/GoogleCalendarService",
	{
		succeed: {
			getAvailableSlots: (weekStart: string) =>
				Effect.gen(function* () {
					yield* Effect.log(
						`Mock: Getting available slots for week starting ${weekStart}`,
					);

					const week = new Date(weekStart);
					const nextMonday = new Date(week);
					nextMonday.setDate(
						nextMonday.getDate() + ((1 - nextMonday.getDay() + 7) % 7),
					);

					return [
						{
							start: new Date(
								nextMonday.getTime() + 9 * 60 * 60 * 1000,
							).toISOString(),
							end: new Date(
								nextMonday.getTime() + 9.5 * 60 * 60 * 1000,
							).toISOString(),
						},
						{
							start: new Date(
								nextMonday.getTime() + 10 * 60 * 60 * 1000,
							).toISOString(),
							end: new Date(
								nextMonday.getTime() + 10.5 * 60 * 60 * 1000,
							).toISOString(),
						},
						{
							start: new Date(
								nextMonday.getTime() +
									24 * 60 * 60 * 1000 +
									14 * 60 * 60 * 1000,
							).toISOString(),
							end: new Date(
								nextMonday.getTime() +
									24 * 60 * 60 * 1000 +
									14.5 * 60 * 60 * 1000,
							).toISOString(),
						},
						{
							start: new Date(
								nextMonday.getTime() +
									48 * 60 * 60 * 1000 +
									11 * 60 * 60 * 1000,
							).toISOString(),
							end: new Date(
								nextMonday.getTime() +
									48 * 60 * 60 * 1000 +
									11.5 * 60 * 60 * 1000,
							).toISOString(),
						},
					];
				}).pipe(
					Effect.withSpan("GoogleCalendarService.getAvailableSlots", {
						attributes: {
							"service.name": "GoogleCalendarService",
							"operation.name": "getAvailableSlots",
							"operation.type": "query",
							"calendar.weekStart": weekStart,
						},
					}),
				),

			bookSlot: (request: BookingRequest): Effect.Effect<BookingResponse> =>
				Effect.gen(function* () {
					yield* Effect.log(
						`Mock: Booking slot at ${request.start} for ${request.guestEmail}`,
					);

					const slotStart = new Date(request.start);
					const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000);

					return {
						id: `booking-${Date.now()}`,
						start: request.start,
						end: slotEnd.toISOString(),
						guestEmail: request.guestEmail,
					};
				}).pipe(
					Effect.withSpan("GoogleCalendarService.bookSlot", {
						attributes: {
							"service.name": "GoogleCalendarService",
							"operation.name": "bookSlot",
							"operation.type": "mutation",
							"booking.start": request.start,
							"booking.guestEmail": request.guestEmail,
							"booking.guestName": request.guestName || "unknown",
							"booking.duration": "30",
						},
					}),
				),

			checkAvailability: (start: string) =>
				Effect.gen(function* () {
					yield* Effect.log(`Mock: Checking availability at ${start}`);

					const slotStart = new Date(start);
					return slotStart > new Date();
				}).pipe(
					Effect.withSpan("GoogleCalendarService.checkAvailability", {
						attributes: {
							"service.name": "GoogleCalendarService",
							"operation.name": "checkAvailability",
							"operation.type": "query",
							"availability.start": start,
						},
					}),
				),
		},
	},
) {}
