import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import { EmailService } from "../services/EmailService.js";

describe("EmailService", () => {
	describe("sendBookingConfirmation", () => {
		test("should send booking confirmation email", async () => {
			const program = Effect.gen(function* () {
				const service = yield* EmailService;
				const confirmation = yield* service.sendBookingConfirmation(
					"guest@example.com",
					{
						eventId: "booking-123",
						start: "2025-07-10T09:00:00.000Z",
						end: "2025-07-10T09:30:00.000Z",
						guestName: "John Doe",
					},
				);
				return confirmation;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(EmailService.Default)),
			);

			expect(result.id).toBeTruthy();
			expect(result.id).toContain("email-");
			expect(result.to).toBe("guest@example.com");
			expect(result.subject).toBe(
				"Booking Confirmation - Your meeting is scheduled",
			);
			expect(result.sentAt).toBeTruthy();
			expect(new Date(result.sentAt)).toBeInstanceOf(Date);
		});

		test("should handle missing guest name", async () => {
			const program = Effect.gen(function* () {
				const service = yield* EmailService;
				const confirmation = yield* service.sendBookingConfirmation(
					"guest@example.com",
					{
						eventId: "booking-456",
						start: "2025-07-10T14:00:00.000Z",
						end: "2025-07-10T14:30:00.000Z",
					},
				);
				return confirmation;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(EmailService.Default)),
			);

			expect(result.to).toBe("guest@example.com");
			expect(result.subject).toBe(
				"Booking Confirmation - Your meeting is scheduled",
			);
		});
	});

	describe("sendBookingCancellation", () => {
		test("should send cancellation email", async () => {
			const program = Effect.gen(function* () {
				const service = yield* EmailService;
				const confirmation = yield* service.sendBookingCancellation(
					"guest@example.com",
					{
						eventId: "booking-123",
						start: "2025-07-10T09:00:00.000Z",
						guestName: "John Doe",
					},
				);
				return confirmation;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(EmailService.Default)),
			);

			expect(result.id).toBeTruthy();
			expect(result.id).toContain("email-");
			expect(result.to).toBe("guest@example.com");
			expect(result.subject).toBe("Meeting Cancelled");
			expect(result.sentAt).toBeTruthy();
		});
	});

	describe("sendEmail", () => {
		test("should send generic email", async () => {
			const program = Effect.gen(function* () {
				const service = yield* EmailService;
				const confirmation = yield* service.sendEmail({
					to: "test@example.com",
					subject: "Test Subject",
					body: "Test email body",
					isHtml: false,
				});
				return confirmation;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(EmailService.Default)),
			);

			expect(result.id).toBeTruthy();
			expect(result.id).toContain("email-");
			expect(result.to).toBe("test@example.com");
			expect(result.subject).toBe("Test Subject");
			expect(result.sentAt).toBeTruthy();
		});

		test("should handle HTML emails", async () => {
			const program = Effect.gen(function* () {
				const service = yield* EmailService;
				const confirmation = yield* service.sendEmail({
					to: "test@example.com",
					subject: "HTML Test",
					body: "<h1>Test HTML</h1>",
					isHtml: true,
				});
				return confirmation;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(EmailService.Default)),
			);

			expect(result.to).toBe("test@example.com");
			expect(result.subject).toBe("HTML Test");
		});
	});
});
