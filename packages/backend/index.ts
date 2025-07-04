import { Effect } from "effect"
import { ConfigService } from "./src/services/ConfigService.js"

const program = Effect.gen(function* () {
  const config = yield* ConfigService
  
  yield* Effect.log(`Starting ${config.getAppName()} v${config.getVersion()}`)
  yield* Effect.log(`Environment: ${config.getEnvironment()}`)
  
  return "Application started successfully"
})

const MainLive = ConfigService.Default

Effect.runPromise(
  program.pipe(
    Effect.provide(MainLive),
    Effect.catchAllCause(Effect.logError)
  )
).then(console.log)
