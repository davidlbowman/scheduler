import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import { GoogleCalendarService } from "../services/GoogleCalendarService.js";

describe("GoogleCalendarService", () => {
	describe("listEvents", () => {
		test("should return events within time range", async () => {
			const program = Effect.gen(function* () {
				const service = yield* GoogleCalendarService;
				const now = new Date();
				const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

				const events = yield* service.listEvents(
					now.toISOString(),
					weekFromNow.toISOString(),
				);
				return events;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(GoogleCalendarService.Default)),
			);

			expect(result.length).toBeGreaterThan(0);
			expect(result[0]).toHaveProperty("id");
			expect(result[0]).toHaveProperty("summary");
			expect(result[0]).toHaveProperty("start");
			expect(result[0]).toHaveProperty("end");
		});

		test("should filter out events outside time range", async () => {
			const program = Effect.gen(function* () {
				const service = yield* GoogleCalendarService;
				// Query for past events (should return empty)
				const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
				const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

				const events = yield* service.listEvents(
					lastWeek.toISOString(),
					yesterday.toISOString(),
				);
				return events;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(GoogleCalendarService.Default)),
			);

			expect(result).toHaveLength(0);
		});
	});

	describe("createEvent", () => {
		test("should create a new event with generated ID", async () => {
			const program = Effect.gen(function* () {
				const service = yield* GoogleCalendarService;
				const start = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
				const end = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours from now

				const newEvent = {
					summary: "Test Meeting",
					description: "A test meeting",
					start: start.toISOString(),
					end: end.toISOString(),
					attendees: ["test@example.com"],
				};

				const created = yield* service.createEvent(newEvent);
				return created;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(GoogleCalendarService.Default)),
			);

			expect(result.id).toBeTruthy();
			expect(result.id).toContain("mock-");
			expect(result.summary).toBe("Test Meeting");
			expect(result.description).toBe("A test meeting");
			expect(result.attendees).toEqual(["test@example.com"]);
		});
	});

	describe("getBusyTimes", () => {
		test("should return busy time slots", async () => {
			const program = Effect.gen(function* () {
				const service = yield* GoogleCalendarService;
				const now = new Date();
				const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

				const busyTimes = yield* service.getBusyTimes(
					now.toISOString(),
					tomorrow.toISOString(),
				);
				return busyTimes;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(GoogleCalendarService.Default)),
			);

			expect(result.length).toBeGreaterThan(0);
			expect(result[0]).toHaveProperty("start");
			expect(result[0]).toHaveProperty("end");
		});

		test("should return empty array for past time ranges", async () => {
			const program = Effect.gen(function* () {
				const service = yield* GoogleCalendarService;
				const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
				const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

				const busyTimes = yield* service.getBusyTimes(
					lastWeek.toISOString(),
					yesterday.toISOString(),
				);
				return busyTimes;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(GoogleCalendarService.Default)),
			);

			expect(result).toHaveLength(0);
		});
	});

	describe("checkAvailability", () => {
		test("should return true for available time slots", async () => {
			const program = Effect.gen(function* () {
				const service = yield* GoogleCalendarService;
				// Check 5 hours from now (should be available)
				const start = new Date(Date.now() + 5 * 60 * 60 * 1000);
				const end = new Date(Date.now() + 6 * 60 * 60 * 1000);

				const available = yield* service.checkAvailability(
					start.toISOString(),
					end.toISOString(),
				);
				return available;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(GoogleCalendarService.Default)),
			);

			expect(result).toBe(true);
		});

		test("should return false for conflicting time slots", async () => {
			const program = Effect.gen(function* () {
				const service = yield* GoogleCalendarService;
				// Check a time that overlaps with the mock busy time (1-1.5 hours from now)
				const start = new Date(Date.now() + 0.5 * 60 * 60 * 1000); // 30 min from now
				const end = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now

				const available = yield* service.checkAvailability(
					start.toISOString(),
					end.toISOString(),
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
