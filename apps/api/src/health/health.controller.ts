import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../auth/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Unauthenticated readiness signal (platform-foundation).
 *
 * Reports unhealthy with 503 rather than throwing, so the acceptance suite can
 * poll it while the platform is still coming up, and can assert the unhealthy
 * case without the request failing at the transport level.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async check(@Res() response: Response): Promise<void> {
    const databaseReachable = await this.prisma.isReachable();
    const status = databaseReachable ? 'healthy' : 'unhealthy';

    response
      .status(databaseReachable ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE)
      .json({ status, database: databaseReachable ? 'reachable' : 'unreachable' });
  }
}
