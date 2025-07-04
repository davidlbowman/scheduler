import { Effect, Layer } from "effect";
import { ConfigService } from "./src/services/ConfigService.js";
import { TelemetryService } from "./src/services/TelemetryService.js";

const program = Effect.gen(function* () {
	const config = yield* ConfigService;

	const result = yield* Effect.gen(function* () {
		yield* Effect.annotateCurrentSpan("appName", config.getAppName());
		yield* Effect.annotateCurrentSpan("version", config.getVersion());
		yield* Effect.annotateCurrentSpan("environment", config.getEnvironment());

		yield* Effect.log(
			`Starting ${config.getAppName()} v${config.getVersion()}`,
		);
		yield* Effect.log(`Environment: ${config.getEnvironment()}`);

		return "Application started successfully";
	}).pipe(
		Effect.withSpan("app-startup", {
			attributes: {
				"app.operation": "startup",
				"app.name": config.getAppName(),
				"app.version": config.getVersion(),
				"app.environment": config.getEnvironment(),
			},
		}),
	);

	return result;
});

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
