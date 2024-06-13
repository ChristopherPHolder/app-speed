import { OptimizeBundleExecutorSchema } from './schema';

export default async function runExecutor(options: OptimizeBundleExecutorSchema) {
  console.log('Executor ran for OptimizeBundle', options);
  return {
    success: true,
  };
}
