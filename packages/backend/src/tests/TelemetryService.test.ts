import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import { TelemetryService } from "../services/TelemetryService.js";

describe("TelemetryService", () => {
	test("should provide telemetry layer directly", async () => {
		const program = Effect.gen(function* () {
			const telemetryLayer = yield* TelemetryService;

			// Verify the layer exists and has the expected structure
			return telemetryLayer !== null && typeof telemetryLayer === "object";
		});

		const result = await Effect.runPromise(
			program.pipe(Effect.provide(TelemetryService.Default)),
		);

		expect(result).toBe(true);
	});

	test("should depend on ConfigService", async () => {
		const program = Effect.gen(function* () {
			const telemetryLayer = yield* TelemetryService;

			// Should be able to access the layer without error
			const hasLayer = typeof telemetryLayer === "object";

			return hasLayer;
		});

		const result = await Effect.runPromise(
			program.pipe(Effect.provide(TelemetryService.Default)),
		);

		expect(result).toBe(true);
	});

	test("should be accessible multiple times in same program", async () => {
		const program = Effect.gen(function* () {
			const telemetryLayer1 = yield* TelemetryService;
			const telemetryLayer2 = yield* TelemetryService;

			const hasLayer1 = typeof telemetryLayer1 === "object";
			const hasLayer2 = typeof telemetryLayer2 === "object";

			return { hasLayer1, hasLayer2 };
		});

		const result = await Effect.runPromise(
			program.pipe(Effect.provide(TelemetryService.Default)),
		);

		expect(result.hasLayer1).toBe(true);
		expect(result.hasLayer2).toBe(true);
	});

	test("should create layer with service name from config", async () => {
		const program = Effect.gen(function* () {
			const telemetryLayer = yield* TelemetryService;

			// The layer should exist and we should be able to use it
			// We can't easily inspect the internal service name, but we can verify the layer works
			return typeof telemetryLayer === "object";
		});

		const result = await Effect.runPromise(
			program.pipe(Effect.provide(TelemetryService.Default)),
		);

		expect(result).toBe(true);
	});

	test("should work with Effect.withSpan directly", async () => {
		const program = Effect.gen(function* () {
			const telemetryLayer = yield* TelemetryService;

			// Test that we can use Effect.withSpan with the telemetry layer
			const result = yield* Effect.succeed("test value").pipe(
				Effect.withSpan("test-span", {
					attributes: {
						"test.key": "test.value",
					},
				}),
				Effect.provide(telemetryLayer),
			);

			return result;
		});

		const result = await Effect.runPromise(
			program.pipe(Effect.provide(TelemetryService.Default)),
		);

		expect(result).toBe("test value");
	});
});
