import { Command } from "@effect/cli";
import {
	FileSystem,
	Path,
	Command as PlatformCommand,
	Terminal,
} from "@effect/platform";
import { BunContext, BunRuntime, BunTerminal } from "@effect/platform-bun";
import { Console, Effect, Layer, Schema } from "effect";

const UpdateEnvParams = Schema.Struct({
	envContent: Schema.optionalWith(Schema.String, {
		default: () => "# Environment variables for Scheduler\n",
	}),
	key: Schema.NonEmptyString.pipe(Schema.pattern(/^[A-Z_][A-Z0-9_]*$/)),
	value: Schema.String,
});

const updateEnvVar = (params: {
	envContent: string;
	key: string;
	value: string;
}) =>
	Effect.gen(function* () {
		const validParams = yield* Schema.decodeUnknown(UpdateEnvParams)(params);
		const keyPattern = `^${validParams.key}=.*$`;
		const regex = new RegExp(keyPattern, "m");
		const hasMatch = validParams.envContent.match(regex);

		return hasMatch
			? validParams.envContent.replace(
					regex,
					`${validParams.key}=${validParams.value}`,
				)
			: `${validParams.envContent}\n${validParams.key}=${validParams.value}`;
	});

const initProgram = Effect.gen(function* () {
	const terminal = yield* Terminal.Terminal;
	const fs = yield* FileSystem.FileSystem;
	const path = yield* Path.Path;

	yield* Console.log("");
	yield* Console.log("🚀 Scheduler Setup Assistant");
	yield* Console.log("============================");
	yield* Console.log("");
	yield* Console.log(
		"Setting up Google Calendar integration for your scheduler.",
	);
	yield* Console.log("");

	yield* Console.log("📋 Google Cloud Setup Required:");
	yield* Console.log("");
	yield* Console.log("🔗 1. Create Project: https://console.cloud.google.com/");
	yield* Console.log(
		"🔑 2. Enable API: Search 'Google Calendar API' and enable",
	);
	yield* Console.log("🛡  3. Create OAuth Credentials:");
	yield* Console.log("   • Go to: console.cloud.google.com/apis/credentials");
	yield* Console.log("   • Create OAuth client ID (Web application)");
	yield* Console.log("   • Redirect URI: http://localhost:3000/auth/callback");
	yield* Console.log("");

	yield* Console.log("📝 Configuration (press Enter for defaults):");
	yield* Console.log("");

	const envPath = path.resolve(".env");
	let envContent = yield* fs
		.readFileString(envPath)
		.pipe(
			Effect.catchTag("SystemError", () =>
				Effect.succeed("# Environment variables for Scheduler\n"),
			),
		);

	yield* terminal.display("Google Client ID (mock_client_id): ");
	const googleClientIdInput = yield* terminal.readLine;
	const clientId = googleClientIdInput || "mock_client_id_for_development";
	envContent = yield* updateEnvVar({
		envContent,
		key: "GOOGLE_CLIENT_ID",
		value: clientId,
	});
	yield* fs.writeFileString(envPath, envContent);

	yield* terminal.display("Google Client Secret (mock_secret): ");
	const googleClientSecretInput = yield* terminal.readLine;
	const clientSecret = googleClientSecretInput || "mock_secret_for_development";
	envContent = yield* updateEnvVar({
		envContent,
		key: "GOOGLE_CLIENT_SECRET",
		value: clientSecret,
	});
	yield* fs.writeFileString(envPath, envContent);

	yield* terminal.display("App name (Scheduler): ");
	const appNameInput = yield* terminal.readLine;
	const appName = appNameInput || "Scheduler";
	envContent = yield* updateEnvVar({
		envContent,
		key: "APP_NAME",
		value: appName,
	});
	yield* fs.writeFileString(envPath, envContent);

	yield* terminal.display("Port (3000): ");
	const portInput = yield* terminal.readLine;
	const port = portInput || "3000";
	envContent = yield* updateEnvVar({
		envContent,
		key: "PORT",
		value: port,
	});
	yield* fs.writeFileString(envPath, envContent);

	yield* Console.log("");
	yield* Console.log("🔐 Generating secure JWT secret...");
	const jwtCommand = PlatformCommand.make("openssl", "rand", "-base64", "32");
	const jwtSecret = yield* PlatformCommand.string(jwtCommand).pipe(
		Effect.map((s) => s.trim()),
	);

	envContent = yield* updateEnvVar({
		envContent,
		key: "JWT_SECRET",
		value: jwtSecret,
	});

	envContent = yield* updateEnvVar({
		envContent,
		key: "GOOGLE_REDIRECT_URI",
		value: "http://localhost:3000/auth/callback",
	});
	envContent = yield* updateEnvVar({
		envContent,
		key: "NODE_ENV",
		value: "development",
	});
	envContent = yield* updateEnvVar({
		envContent,
		key: "DATABASE_URL",
		value: "sqlite://./data/scheduler.db",
	});
	envContent = yield* updateEnvVar({
		envContent,
		key: "APP_VERSION",
		value: "1.0.0-prototype",
	});

	yield* fs.writeFileString(envPath, envContent);

	yield* Console.log("");
	yield* Console.log("✅ Setup complete!");
	yield* Console.log("");
	yield* Console.log("🚀 Next steps:");
	yield* Console.log("   bun dev              # Start the application");
	yield* Console.log("   http://localhost:3000 # Open in browser");
	yield* Console.log("");
});

const command = Command.make("init", {}, () => initProgram);

const cli = Command.run(command, {
	name: "Scheduler Setup Assistant",
	version: "v1.0.0",
});

BunRuntime.runMain(
	cli(process.argv).pipe(
		Effect.provide(Layer.mergeAll(BunContext.layer, BunTerminal.layer)),
		Effect.catchAllCause(Effect.logError),
	),
);
