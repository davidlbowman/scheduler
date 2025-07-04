import { NodeSdk } from "@effect/opentelemetry";
import {
	BatchSpanProcessor,
	ConsoleSpanExporter,
} from "@opentelemetry/sdk-trace-base";
import { Effect } from "effect";
import { ConfigService } from "./ConfigService.js";

export class TelemetryService extends Effect.Service<TelemetryService>()(
	"app/TelemetryService",
	{
		effect: Effect.gen(function* () {
			const config = yield* ConfigService;

			return NodeSdk.layer(() => ({
				resource: { serviceName: config.getAppName() },
				spanProcessor: new BatchSpanProcessor(new ConsoleSpanExporter()),
			}));
		}),
		dependencies: [ConfigService.Default],
	},
) {}
