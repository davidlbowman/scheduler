import { HttpApiBuilder } from "@effect/platform";
import { Effect } from "effect";
import { SchedulerApi } from "../api/SchedulerApi.js";
import { EmailService } from "../services/EmailService.js";
import { GoogleCalendarService } from "../services/GoogleCalendarService.js";

export const AvailabilityHandlers = HttpApiBuilder.group(
	SchedulerApi,
	"availability",
	(handlers) =>
		handlers.handle("getSlots", (_req) =>
			Effect.gen(function* () {
				const calendar = yield* GoogleCalendarService;
				// For now, use a hardcoded weekStart until we figure out path params
				const slots = yield* calendar.getAvailableSlots(
					"2025-07-07T00:00:00.000Z",
				);
				return slots;
			}),
		),
);

export const BookingHandlers = HttpApiBuilder.group(
	SchedulerApi,
	"booking",
	(handlers) =>
		handlers.handle("create", ({ payload }) =>
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
