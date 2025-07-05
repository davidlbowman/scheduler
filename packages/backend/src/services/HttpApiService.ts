import {
	HttpApi,
	HttpApiBuilder,
	HttpApiEndpoint,
	HttpApiGroup,
} from "@effect/platform";
import { Effect, Layer, Schema } from "effect";
import { EmailService } from "@/services/EmailService.js";
import {
	AvailableSlot,
	BookingRequest,
	BookingResponse,
	GoogleCalendarService,
} from "@/services/GoogleCalendarService.js";

export const GetSlotsParams = Schema.Struct({
	weekStart: Schema.String,
});

export type GetSlotsParams = Schema.Schema.Type<typeof GetSlotsParams>;

const getSlots = HttpApiEndpoint.get("getSlots", "/availability/:weekStart")
	.setPath(GetSlotsParams)
	.addSuccess(Schema.Array(AvailableSlot));

const createBooking = HttpApiEndpoint.post("createBooking", "/booking")
	.setPayload(BookingRequest)
	.addSuccess(BookingResponse);

const availability = HttpApiGroup.make("availability").add(getSlots);
const booking = HttpApiGroup.make("booking").add(createBooking);

export const SchedulerApi = HttpApi.make("SchedulerApi")
	.add(availability)
	.add(booking);

const AvailabilityHandlers = HttpApiBuilder.group(
	SchedulerApi,
	"availability",
	(handlers) =>
		handlers.handle("getSlots", ({ path }) =>
			Effect.gen(function* () {
				const calendar = yield* GoogleCalendarService;
				const slots = yield* calendar.getAvailableSlots(path.weekStart);
				return slots;
			}).pipe(
				Effect.withSpan("HttpApiService.getSlots", {
					attributes: {
						"http.method": "GET",
						"http.route": "/availability/:weekStart",
						"operation.name": "getSlots",
						"operation.type": "http_handler",
					},
				}),
			),
		),
);

const BookingHandlers = HttpApiBuilder.group(
	SchedulerApi,
	"booking",
	(handlers) =>
		handlers.handle("createBooking", ({ payload }) =>
			Effect.gen(function* () {
				const calendar = yield* GoogleCalendarService;
				const email = yield* EmailService;

				const booking = yield* calendar.bookSlot(payload);

				yield* email.sendBookingConfirmation(payload.guestEmail, {
					eventId: booking.id,
					start: booking.start,
					end: booking.end,
					guestName: payload.guestName,
				});

				return {
					id: booking.id,
					start: booking.start,
					end: booking.end,
					guestEmail: booking.guestEmail,
				};
			}).pipe(
				Effect.withSpan("HttpApiService.createBooking", {
					attributes: {
						"http.method": "POST",
						"http.route": "/booking",
						"operation.name": "createBooking",
						"operation.type": "http_handler",
					},
				}),
			),
		),
);

export const HttpApiService = HttpApiBuilder.api(SchedulerApi).pipe(
	Layer.provide(Layer.mergeAll(AvailabilityHandlers, BookingHandlers)),
);
