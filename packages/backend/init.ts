#!/usr/bin/env bun
import { Command } from "@effect/cli";
import {
	FileSystem,
	Path,
	Command as PlatformCommand,
	Terminal,
} from "@effect/platform";
import { BunContext, BunRuntime, BunTerminal } from "@effect/platform-bun";
import { Console, Effect, Layer, Schema } from "effect";

// Schema for environment variable update parameters
const UpdateEnvParams = Schema.Struct({
	envContent: Schema.optionalWith(Schema.String, {
		default: () => "# Environment variables for Scheduler\n",
	}),
	key: Schema.NonEmptyString.pipe(Schema.pattern(/^[A-Z_][A-Z0-9_]*$/)),
	value: Schema.String,
});

// Effect-based helper to update a single env variable
const updateEnvVar = (params: {
	envContent: string;
	key: string;
	value: string;
}) =>
	Effect.gen(function* () {
		// Validate input parameters
		const validParams = yield* Schema.decodeUnknown(UpdateEnvParams)(params);

		// Create regex pattern for the key
		const keyPattern = `^${validParams.key}=.*$`;
		const regex = new RegExp(keyPattern, "m");

		// Check if key exists and replace, otherwise append
		const hasMatch = validParams.envContent.match(regex);

		return hasMatch
			? validParams.envContent.replace(
					regex,
					`${validParams.key}=${validParams.value}`,
				)
			: `${validParams.envContent}\n${validParams.key}=${validParams.value}`;
	});

// Main initialization program - Effect best practices
const initProgram = Effect.gen(function* () {
	// Get all required services at the top
	const terminal = yield* Terminal.Terminal;
	const fs = yield* FileSystem.FileSystem;
	const path = yield* Path.Path;

	// Display setup instructions
	yield* Console.log("🚀 Scheduler Setup Assistant");
	yield* Console.log("============================");
	yield* Console.log("");
	yield* Console.log(
		"Welcome to the Scheduler setup! This tool will help you configure",
	);
	yield* Console.log(
		"your environment variables for Google Calendar integration.",
	);
	yield* Console.log("");
	yield* Console.log("📋 First, let's set up Google Calendar API access:");
	yield* Console.log("");
	yield* Console.log("🔗 Step 1: Create Google Cloud Project");
	yield* Console.log("1. Go to: https://console.cloud.google.com/");
	yield* Console.log("2. Create a new project or select existing one");
	yield* Console.log("");
	yield* Console.log("🔑 Step 2: Enable Google Calendar API");
	yield* Console.log("1. Go to: https://console.cloud.google.com/apis/library");
	yield* Console.log("2. Search for 'Google Calendar API'");
	yield* Console.log("3. Click 'Enable'");
	yield* Console.log("");
	yield* Console.log("🛡  Step 3: Create OAuth 2.0 Credentials");
	yield* Console.log(
		"1. Go to: https://console.cloud.google.com/apis/credentials",
	);
	yield* Console.log("2. Click 'Create Credentials' > 'OAuth client ID'");
	yield* Console.log("3. Application type: 'Web application'");
	yield* Console.log(
		"4. Authorized redirect URIs: http://localhost:3000/auth/callback",
	);
	yield* Console.log("5. Copy the Client ID and Client Secret");
	yield* Console.log("");

	// Interactive input collection - update .env after each input
	yield* Console.log("📝 Now let's configure your environment:");
	yield* Console.log("💡 Press Enter to use defaults for quick testing");
	yield* Console.log("");

	// Read initial .env content (debug path resolution)
	const envPath = path.resolve(".env");
	yield* Console.log(`Looking for .env at: ${envPath}`);
	let envContent = yield* fs
		.readFileString(envPath)
		.pipe(
			Effect.catchTag("SystemError", () =>
				Effect.succeed("# Environment variables for Scheduler\n"),
			),
		);

	// Google Client ID
	yield* terminal.display("Google Client ID (default: mock_client_id): ");
	const googleClientId = yield* terminal.readLine;
	const finalGoogleClientId =
		googleClientId || "mock_client_id_for_development";
	envContent = yield* updateEnvVar({
		envContent,
		key: "GOOGLE_CLIENT_ID",
		value: finalGoogleClientId,
	});
	yield* fs.writeFileString(envPath, envContent);

	// Google Client Secret
	yield* terminal.display("Google Client Secret (default: mock_secret): ");
	const googleClientSecret = yield* terminal.readLine;
	const finalGoogleClientSecret =
		googleClientSecret || "mock_secret_for_development";
	envContent = yield* updateEnvVar({
		envContent,
		key: "GOOGLE_CLIENT_SECRET",
		value: finalGoogleClientSecret,
	});
	yield* fs.writeFileString(envPath, envContent);

	// App Name
	yield* terminal.display("App name (default: Scheduler): ");
	const appName = yield* terminal.readLine;
	const finalAppName = appName || "Scheduler";
	envContent = yield* updateEnvVar({
		envContent,
		key: "APP_NAME",
		value: finalAppName,
	});
	yield* fs.writeFileString(envPath, envContent);

	// Port
	yield* terminal.display("Port (default: 3000): ");
	const port = yield* terminal.readLine;
	const finalPort = port || "3000";
	envContent = yield* updateEnvVar({
		envContent,
		key: "PORT",
		value: finalPort,
	});
	yield* fs.writeFileString(envPath, envContent);

	// Generate secure JWT secret using base64 (after all interactive input)
	yield* Console.log("🔐 Generating secure JWT secret...");
	const generateBase64Command = PlatformCommand.make(
		"openssl",
		"rand",
		"-base64",
		"32",
	);
	const jwtSecret = yield* PlatformCommand.string(generateBase64Command).pipe(
		Effect.map((s) => s.trim()), // Remove any trailing newline
	);
	yield* Console.log(
		`🔐 Generated secure JWT secret: ${jwtSecret.slice(0, 8)}...`,
	);
	envContent = yield* updateEnvVar({
		envContent,
		key: "JWT_SECRET",
		value: jwtSecret,
	});

	// Update remaining static values
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

	// Final write
	yield* fs.writeFileString(envPath, envContent);

	// Success message
	yield* Console.log("");
	yield* Console.log("✅ Configuration complete!");
	yield* Console.log("🚀 Run 'bun dev' to start your scheduler application!");
	yield* Console.log("");
	yield* Console.log("📖 Your Google Calendar integration is now configured.");
	yield* Console.log(
		"   Visit http://localhost:3000 to start using your scheduler!",
	);
});

// Create the CLI command
const command = Command.make("init", {}, () => initProgram);

// Set up the CLI application
const cli = Command.run(command, {
	name: "Scheduler Setup Assistant",
	version: "v1.0.0",
});

// Run the CLI application
BunRuntime.runMain(
	cli(process.argv).pipe(
		Effect.provide(Layer.mergeAll(BunContext.layer, BunTerminal.layer)),
		Effect.catchAllCause(Effect.logError),
	),
);
