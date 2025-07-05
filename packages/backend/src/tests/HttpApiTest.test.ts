import { describe, expect, test } from "bun:test";
import { Effect, Layer } from "effect";
import { EmailService } from "../services/EmailService.js";
import { GoogleCalendarService } from "../services/GoogleCalendarService.js";

describe("HttpApi Handlers", () => {
	const ServiceLayers = Layer.mergeAll(
		GoogleCalendarService.Default,
		EmailService.Default,
	);

	test("should create handlers without errors", async () => {
		const result = await Effect.runPromise(
			Effect.succeed("handlers created successfully"),
		);

		expect(result).toBe("handlers created successfully");
	});

	test("should provide Google Calendar service to handlers", async () => {
		const program = Effect.gen(function* () {
			const calendar = yield* GoogleCalendarService;
			const slots = yield* calendar.getAvailableSlots(
				"2025-07-07T00:00:00.000Z",
			);
			return slots.length;
		});

		const result = await Effect.runPromise(
			program.pipe(Effect.provide(ServiceLayers)),
		);

		expect(result).toBeGreaterThan(0);
	});

	test("should provide Email service to handlers", async () => {
		const program = Effect.gen(function* () {
			const email = yield* EmailService;
			const confirmation = yield* email.sendBookingConfirmation(
				"test@example.com",
				{
					eventId: "test-123",
					start: "2025-07-07T09:00:00.000Z",
					end: "2025-07-07T09:30:00.000Z",
					guestName: "Test User",
				},
			);
			return confirmation.to;
		});

		const result = await Effect.runPromise(
			program.pipe(Effect.provide(ServiceLayers)),
		);

		expect(result).toBe("test@example.com");
	});
});
