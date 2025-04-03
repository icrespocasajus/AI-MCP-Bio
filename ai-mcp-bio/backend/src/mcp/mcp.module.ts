import { Module } from '@nestjs/common';
import { MpcController } from './mcp.controller';
import { MpcService } from './mcp.service';

@Module({
  controllers: [MpcController],
  providers: [MpcService],
  exports: [MpcService],
})
export class MpcModule {} 