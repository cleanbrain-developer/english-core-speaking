import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { ChunkDrillService } from './chunk-drill.service';
import { DrillSetQueryDto } from './dto/drill-set-query.dto';
import { CompleteDrillDto } from './dto/complete-drill.dto';

@Controller('chunk-drill')
export class ChunkDrillController {
  constructor(private readonly chunkDrillService: ChunkDrillService) {}

  @Get('set')
  getSet(@CurrentUser() user: AuthenticatedUser, @Query() query: DrillSetQueryDto) {
    return this.chunkDrillService.getDrillSet(user.id, query.size ?? 20);
  }

  @Post('complete')
  complete(@CurrentUser() user: AuthenticatedUser, @Body() dto: CompleteDrillDto) {
    return this.chunkDrillService.completeDrill(user.id, dto.chunkItemIds);
  }

  @Get('summary')
  getSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.chunkDrillService.getSummary(user.id);
  }
}
