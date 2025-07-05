import { HttpApiBuilder } from "@effect/platform";
import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { Layer } from "effect";
import { ConfigService } from "@/services/ConfigService.js";
import { EmailService } from "@/services/EmailService.js";
import { GoogleCalendarService } from "@/services/GoogleCalendarService.js";
import { HttpApiService } from "@/services/HttpApiService.js";

const ServicesLive = Layer.mergeAll(
	ConfigService.Default,
	GoogleCalendarService.Default,
	EmailService.Default,
);

const ApiLive = HttpApiService.pipe(Layer.provide(ServicesLive));

const ServerLive = HttpApiBuilder.serve().pipe(
	Layer.provide(ApiLive),
	Layer.provide(BunHttpServer.layer({ port: 3000 })),
);

Layer.launch(ServerLive).pipe(BunRuntime.runMain);
