import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import { ConfigService } from "../services/ConfigService.js";

describe("ConfigService", () => {
	test("should return app configuration", async () => {
		const program = Effect.gen(function* () {
			const config = yield* ConfigService;
			return {
				appName: config.getAppName(),
				version: config.getVersion(),
				environment: config.getEnvironment(),
			};
		});

		const result = await Effect.runPromise(
			program.pipe(Effect.provide(ConfigService.Default)),
		);

		expect(result.appName).toBe("Scheduler");
		expect(result.version).toBe("1.0.0-prototype");
		expect(result.environment).toBe("development");
	});

	test("should provide consistent values across multiple calls", async () => {
		const program = Effect.gen(function* () {
			const config = yield* ConfigService;
			const firstCall = config.getAppName();
			const secondCall = config.getAppName();
			return { firstCall, secondCall };
		});

		const result = await Effect.runPromise(
			program.pipe(Effect.provide(ConfigService.Default)),
		);

		expect(result.firstCall).toBe(result.secondCall);
		expect(result.firstCall).toBe("Scheduler");
	});

	test("should be accessible multiple times in same program", async () => {
		const program = Effect.gen(function* () {
			const config1 = yield* ConfigService;
			const config2 = yield* ConfigService;
			return {
				name1: config1.getAppName(),
				name2: config2.getAppName(),
				version1: config1.getVersion(),
				version2: config2.getVersion(),
			};
		});

		const result = await Effect.runPromise(
			program.pipe(Effect.provide(ConfigService.Default)),
		);

		expect(result.name1).toBe(result.name2);
		expect(result.version1).toBe(result.version2);
		expect(result.name1).toBe("Scheduler");
		expect(result.version1).toBe("1.0.0-prototype");
	});
});
