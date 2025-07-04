import { Effect } from "effect";

export class ConfigService extends Effect.Service<ConfigService>()(
	"app/ConfigService",
	{
		sync: () => ({
			getAppName: () => "Scheduler",
			getVersion: () => "1.0.0-prototype",
			getEnvironment: () => "development",
		}),
	},
) {}
