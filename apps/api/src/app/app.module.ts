import { Module } from '@nestjs/common';
import { ConductorModule } from '@app-speed/api-conductor-lib';

@Module({
  imports: [ConductorModule],
})
export class AppModule {}
