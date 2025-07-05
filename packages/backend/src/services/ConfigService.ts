import { Config, Effect } from "effect";

export class ConfigService extends Effect.Service<ConfigService>()(
	"app/ConfigService",
	{
		effect: Effect.gen(function* () {
			// Type-safe environment variable loading with fallback defaults
			const googleClientId = yield* Config.string("GOOGLE_CLIENT_ID").pipe(
				Config.withDefault("mock_client_id_for_development"),
			);
			const googleClientSecret = yield* Config.redacted(
				"GOOGLE_CLIENT_SECRET",
			).pipe(Config.withDefault("mock_secret_for_development"));
			const googleRedirectUri = yield* Config.string(
				"GOOGLE_REDIRECT_URI",
			).pipe(Config.withDefault("http://localhost:3000/auth/callback"));
			const port = yield* Config.integer("PORT").pipe(Config.withDefault(3000));
			const nodeEnv = yield* Config.string("NODE_ENV").pipe(
				Config.withDefault("development"),
			);
			const databaseUrl = yield* Config.string("DATABASE_URL").pipe(
				Config.withDefault("sqlite://./data/scheduler.db"),
			);
			const jwtSecret = yield* Config.redacted("JWT_SECRET").pipe(
				Config.withDefault(
					"development_jwt_secret_minimum_32_chars_long_for_security",
				),
			);
			const appName = yield* Config.string("APP_NAME").pipe(
				Config.withDefault("Scheduler"),
			);
			const appVersion = yield* Config.string("APP_VERSION").pipe(
				Config.withDefault("1.0.0-prototype"),
			);

			return {
				getAppName: () => appName,
				getVersion: () => appVersion,
				getEnvironment: () => nodeEnv,
				getGoogleClientId: () => googleClientId,
				getGoogleClientSecret: () => googleClientSecret,
				getGoogleRedirectUri: () => googleRedirectUri,
				getPort: () => port,
				getDatabaseUrl: () => databaseUrl,
				getJwtSecret: () => jwtSecret,
			} as const;
		}),
	},
) {}
