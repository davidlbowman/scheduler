import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema } from "effect";

// Request/Response schemas
export const GetSlotsParams = Schema.Struct({
	weekStart: Schema.String,
});

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

export type GetSlotsParams = Schema.Schema.Type<typeof GetSlotsParams>;
export type AvailableSlot = Schema.Schema.Type<typeof AvailableSlot>;
export type BookingRequest = Schema.Schema.Type<typeof BookingRequest>;
export type BookingResponse = Schema.Schema.Type<typeof BookingResponse>;

// API Definition
export const SchedulerApi = HttpApi.make("SchedulerApi")
	.add(
		HttpApiGroup.make("availability").add(
			HttpApiEndpoint.get("getSlots", "/availability/:weekStart").addSuccess(
				Schema.Array(AvailableSlot),
			),
		),
	)
	.add(
		HttpApiGroup.make("booking").add(
			HttpApiEndpoint.post("create", "/booking")
				.setPayload(BookingRequest)
				.addSuccess(BookingResponse),
		),
	);
