import {
	HttpApi,
	HttpApiBuilder,
	HttpApiEndpoint,
	HttpApiGroup,
} from "@effect/platform";
import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer, Schema } from "effect";
import { ConfigService } from "./services/ConfigService.js";
import { EmailService } from "./services/EmailService.js";
import { GoogleCalendarService } from "./services/GoogleCalendarService.js";

// Schemas
const AvailableSlot = Schema.Struct({
	start: Schema.String,
	end: Schema.String,
});

const BookingRequest = Schema.Struct({
	start: Schema.String,
	guestEmail: Schema.String,
	guestName: Schema.optional(Schema.String),
	summary: Schema.optional(Schema.String),
});

const BookingResponse = Schema.Struct({
	id: Schema.String,
	start: Schema.String,
	end: Schema.String,
	guestEmail: Schema.String,
});

const WeekStartPath = Schema.Struct({
	weekStart: Schema.String,
});

// API Endpoints
const getSlots = HttpApiEndpoint.get("getSlots", "/availability/:weekStart")
	.setPath(WeekStartPath)
	.addSuccess(Schema.Array(AvailableSlot));

const createBooking = HttpApiEndpoint.post("createBooking", "/booking")
	.setPayload(BookingRequest)
	.addSuccess(BookingResponse);

// API Groups
const availability = HttpApiGroup.make("Availability").add(getSlots);
const booking = HttpApiGroup.make("Booking").add(createBooking);

// Complete API
const SchedulerApi = HttpApi.make("SchedulerApi")
	.add(availability)
	.add(booking);

// Handlers
const AvailabilityHandlers = HttpApiBuilder.group(
	SchedulerApi,
	"Availability",
	(handlers) =>
		handlers.handle("getSlots", ({ path }) =>
			Effect.gen(function* () {
				const calendar = yield* GoogleCalendarService;
				const slots = yield* calendar.getAvailableSlots(path.weekStart);
				return slots;
			}),
		),
);

const BookingHandlers = HttpApiBuilder.group(
	SchedulerApi,
	"Booking",
	(handlers) =>
		handlers.handle("createBooking", ({ payload }) =>
			Effect.gen(function* () {
				const calendar = yield* GoogleCalendarService;
				const email = yield* EmailService;

				// Book the slot
				const booking = yield* calendar.bookSlot(payload);

				// Send confirmation email
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
			}),
		),
);

// Service Layer
const ServicesLive = Layer.mergeAll(
	ConfigService.Default,
	GoogleCalendarService.Default,
	EmailService.Default,
);

// API Layer
const ApiLive = HttpApiBuilder.api(SchedulerApi).pipe(
	Layer.provide(Layer.mergeAll(AvailabilityHandlers, BookingHandlers)),
	Layer.provide(ServicesLive),
);

// Server Layer
const ServerLive = HttpApiBuilder.serve().pipe(
	Layer.provide(ApiLive),
	Layer.provide(BunHttpServer.layer({ port: 3000 })),
);

// Launch the server
Layer.launch(ServerLive).pipe(BunRuntime.runMain);
