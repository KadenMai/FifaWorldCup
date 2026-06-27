import { syncWeatherToR2 } from '../../../functions/lib/weatherSync';

export default {
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    const edition = env.DEFAULT_EDITION?.trim() || '2026';
    ctx.waitUntil(
      syncWeatherToR2(env, edition).then((result) => {
        console.log(`Weather cron ${edition}:`, JSON.stringify(result));
      }),
    );
  },
};
