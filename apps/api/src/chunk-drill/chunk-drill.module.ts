import { Module } from '@nestjs/common';
import { ChunkDrillController } from './chunk-drill.controller';
import { ChunkDrillService } from './chunk-drill.service';

@Module({
  controllers: [ChunkDrillController],
  providers: [ChunkDrillService],
})
export class ChunkDrillModule {}
