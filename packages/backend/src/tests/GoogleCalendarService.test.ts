import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import { GoogleCalendarService } from "../services/GoogleCalendarService.js";

describe("GoogleCalendarService", () => {
	describe("getAvailableSlots", () => {
		test("should return available 30-minute slots for the week", async () => {
			const program = Effect.gen(function* () {
				const service = yield* GoogleCalendarService;
				const nextMonday = getNextMonday();
				const slots = yield* service.getAvailableSlots(
					nextMonday.toISOString(),
				);
				return slots;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(GoogleCalendarService.Default)),
			);

			expect(result.length).toBeGreaterThan(0);
			expect(result[0]).toHaveProperty("start");
			expect(result[0]).toHaveProperty("end");

			// Each slot should be exactly 30 minutes
			for (const slot of result.slice(0, 5)) {
				// Check first 5 slots
				const start = new Date(slot.start);
				const end = new Date(slot.end);
				const duration = end.getTime() - start.getTime();
				expect(duration).toBe(30 * 60 * 1000); // 30 minutes in milliseconds
			}
		});

		test("should return mock slots based on week start", async () => {
			const program = Effect.gen(function* () {
				const service = yield* GoogleCalendarService;
				const someWeek = new Date("2025-08-01"); // Future week
				const slots = yield* service.getAvailableSlots(someWeek.toISOString());
				return slots;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(GoogleCalendarService.Default)),
			);

			// Should return 4 mock slots regardless of input week
			expect(result).toHaveLength(4);
			expect(result[0]).toHaveProperty("start");
			expect(result[0]).toHaveProperty("end");
		});

		test("should return consistent mock slots", async () => {
			const program = Effect.gen(function* () {
				const service = yield* GoogleCalendarService;
				const nextMonday = getNextMonday();
				const slots = yield* service.getAvailableSlots(
					nextMonday.toISOString(),
				);
				return slots;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(GoogleCalendarService.Default)),
			);

			// Should return exactly 4 mock slots
			expect(result).toHaveLength(4);

			// First slot should be Monday 9 AM
			expect(result[0]).toBeDefined();
			if (result[0]) {
				const firstSlot = new Date(result[0].start);
				expect(firstSlot.getHours()).toBe(9);
				expect(firstSlot.getMinutes()).toBe(0);
			}
		});
	});

	describe("bookSlot", () => {
		test("should create a booking confirmation", async () => {
			const program = Effect.gen(function* () {
				const service = yield* GoogleCalendarService;
				const nextMonday = getNextMonday();
				nextMonday.setHours(9, 0, 0, 0); // 9 AM slot

				const booking = yield* service.bookSlot({
					start: nextMonday.toISOString(),
					guestEmail: "guest@example.com",
					guestName: "John Doe",
					summary: "Product Demo",
				});
				return booking;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(GoogleCalendarService.Default)),
			);

			expect(result.id).toBeTruthy();
			expect(result.id).toContain("booking-");
			expect(result.guestEmail).toBe("guest@example.com");
			expect(result.start).toBeTruthy();
			expect(result.end).toBeTruthy();

			// Should be exactly 30 minutes duration
			const start = new Date(result.start);
			const end = new Date(result.end);
			const duration = end.getTime() - start.getTime();
			expect(duration).toBe(30 * 60 * 1000);
		});
	});

	describe("checkAvailability", () => {
		test("should return true for available slots", async () => {
			const program = Effect.gen(function* () {
				const service = yield* GoogleCalendarService;
				const nextMonday = getNextMonday();
				nextMonday.setHours(9, 0, 0, 0); // 9 AM should be available

				const available = yield* service.checkAvailability(
					nextMonday.toISOString(),
				);
				return available;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(GoogleCalendarService.Default)),
			);

			expect(result).toBe(true);
		});

		test("should return false for past times", async () => {
			const program = Effect.gen(function* () {
				const service = yield* GoogleCalendarService;
				const yesterday = new Date();
				yesterday.setDate(yesterday.getDate() - 1);

				const available = yield* service.checkAvailability(
					yesterday.toISOString(),
				);
				return available;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(GoogleCalendarService.Default)),
			);

			expect(result).toBe(false);
		});
	});
});

// Helper functions
function getNextMonday(): Date {
	const today = new Date();
	const dayOfWeek = today.getDay();
	const daysToMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek; // If Sunday, next Monday is 1 day, else 8 - current day
	const nextMonday = new Date(today);
	nextMonday.setDate(today.getDate() + daysToMonday);
	nextMonday.setHours(0, 0, 0, 0);
	return nextMonday;
}

function _getThisWeekStart(): Date {
	const today = new Date();
	const dayOfWeek = today.getDay();
	const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday, go back 6 days, else go to Monday
	const thisWeekStart = new Date(today);
	thisWeekStart.setDate(today.getDate() + daysToMonday);
	thisWeekStart.setHours(0, 0, 0, 0);
	return thisWeekStart;
}
