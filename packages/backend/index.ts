import { Effect, Layer } from "effect";
import { ConfigService } from "./src/services/ConfigService.js";
import { TelemetryService } from "./src/services/TelemetryService.js";

// Simple program that tests our basic services work
const program = Effect.gen(function* () {
	const config = yield* ConfigService;

	yield* Effect.log(`${config.getAppName()} v${config.getVersion()}`);
	yield* Effect.log(`Environment: ${config.getEnvironment()}`);
	yield* Effect.log("All services loaded successfully!");

	return "Application started successfully";
}).pipe(
	Effect.withSpan("app-startup", {
		attributes: {
			"app.operation": "startup",
		},
	}),
);

const MainLive = Layer.mergeAll(
	ConfigService.Default,
	TelemetryService.Default,
);

// Get the telemetry layer and provide it to the main program
Effect.gen(function* () {
	const telemetryLayer = yield* TelemetryService;
	const result = yield* program.pipe(Effect.provide(telemetryLayer));
	return result;
})
	.pipe(
		Effect.provide(MainLive),
		Effect.catchAllCause(Effect.logError),
		Effect.runPromise,
	)
	.then(console.log);
