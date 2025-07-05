import { Effect, Schema } from "effect";

export const EmailRequest = Schema.Struct({
	to: Schema.String,
	subject: Schema.String,
	body: Schema.String,
	isHtml: Schema.optional(Schema.Boolean),
});

export const EmailConfirmation = Schema.Struct({
	id: Schema.String,
	to: Schema.String,
	subject: Schema.String,
	sentAt: Schema.String,
});

export const BookingConfirmation = Schema.Struct({
	eventId: Schema.String,
	start: Schema.String,
	end: Schema.String,
	guestName: Schema.optional(Schema.String),
});

export type EmailRequest = Schema.Schema.Type<typeof EmailRequest>;
export type EmailConfirmation = Schema.Schema.Type<typeof EmailConfirmation>;
export type BookingConfirmation = Schema.Schema.Type<
	typeof BookingConfirmation
>;

export class EmailService extends Effect.Service<EmailService>()(
	"app/EmailService",
	{
		succeed: {
			sendBookingConfirmation: (
				guestEmail: string,
				bookingDetails: {
					eventId: string;
					start: string;
					end: string;
					guestName?: string;
				},
			) =>
				Effect.gen(function* () {
					yield* Effect.log(
						`Mock: Sending booking confirmation to ${guestEmail} for event ${bookingDetails.eventId}`,
					);

					return {
						id: `email-${Date.now()}`,
						to: guestEmail,
						subject: "Booking Confirmation - Your meeting is scheduled",
						sentAt: new Date().toISOString(),
					};
				}).pipe(
					Effect.withSpan("EmailService.sendBookingConfirmation", {
						attributes: {
							"service.name": "EmailService",
							"operation.name": "sendBookingConfirmation",
							"operation.type": "notification",
							"email.to": guestEmail,
							"email.type": "booking_confirmation",
							"booking.eventId": bookingDetails.eventId,
							"booking.guestName": bookingDetails.guestName || "unknown",
						},
					}),
				),

			sendBookingCancellation: (
				guestEmail: string,
				bookingDetails: {
					eventId: string;
					start: string;
					guestName?: string;
				},
			) =>
				Effect.gen(function* () {
					yield* Effect.log(
						`Mock: Sending cancellation notice to ${guestEmail} for event ${bookingDetails.eventId}`,
					);

					return {
						id: `email-${Date.now()}`,
						to: guestEmail,
						subject: "Meeting Cancelled",
						sentAt: new Date().toISOString(),
					};
				}).pipe(
					Effect.withSpan("EmailService.sendBookingCancellation", {
						attributes: {
							"service.name": "EmailService",
							"operation.name": "sendBookingCancellation",
							"operation.type": "notification",
							"email.to": guestEmail,
							"email.type": "booking_cancellation",
							"booking.eventId": bookingDetails.eventId,
							"booking.guestName": bookingDetails.guestName || "unknown",
						},
					}),
				),

			sendEmail: (request: EmailRequest) =>
				Effect.gen(function* () {
					yield* Effect.log(
						`Mock: Sending email to ${request.to} with subject "${request.subject}"`,
					);

					return {
						id: `email-${Date.now()}`,
						to: request.to,
						subject: request.subject,
						sentAt: new Date().toISOString(),
					};
				}).pipe(
					Effect.withSpan("EmailService.sendEmail", {
						attributes: {
							"service.name": "EmailService",
							"operation.name": "sendEmail",
							"operation.type": "notification",
							"email.to": request.to,
							"email.subject": request.subject,
							"email.type": "generic",
							"email.format": request.isHtml ? "html" : "text",
						},
					}),
				),
		},
	},
) {}
