import { HttpApiBuilder } from "@effect/platform";
import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { Layer } from "effect";
import { ConfigService } from "@/services/ConfigService.js";
import { EmailService } from "@/services/EmailService.js";
import { GoogleCalendarService } from "@/services/GoogleCalendarService.js";
import { HttpApiService } from "@/services/HttpApiService.js";

// Service Layer
const ServicesLive = Layer.mergeAll(
	ConfigService.Default,
	GoogleCalendarService.Default,
	EmailService.Default,
);

// API Layer
const ApiLive = HttpApiService.pipe(Layer.provide(ServicesLive));

// Server Layer
const ServerLive = HttpApiBuilder.serve().pipe(
	Layer.provide(ApiLive),
	Layer.provide(BunHttpServer.layer({ port: 3000 })),
);

// Launch the server
Layer.launch(ServerLive).pipe(BunRuntime.runMain);
