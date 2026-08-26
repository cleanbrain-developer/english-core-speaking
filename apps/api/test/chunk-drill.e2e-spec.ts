import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { PrismaService } from '../src/prisma/prisma.service';
import { SessionTokenService } from '../src/auth/session-token.service';
import { SESSION_COOKIE_NAME } from '../src/auth/guards/session-auth.guard';

// Requires a reachable PostgreSQL with the seed already imported (see
// README "Test 실행"). Creates and tears down its own throwaway test user.
describe('Chunk Drill (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cookie: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    prisma = app.get(PrismaService);
    const sessionTokenService = app.get(SessionTokenService);

    const user = await prisma.user.create({
      data: {
        googleId: `test-google-id-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        email: `chunk-drill-e2e-${Date.now()}@example.com`,
        displayName: 'Chunk Drill E2E',
      },
    });
    userId = user.id;
    cookie = `${SESSION_COOKIE_NAME}=${sessionTokenService.sign(user.id)}`;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } });
    await app.close();
  });

  it('GET /api/chunk-drill/set returns never-practiced items first, ranked', async () => {
    const res = await request(app.getHttpServer()).get('/api/chunk-drill/set?size=5').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(5);
    for (const item of res.body.items) expect(item.practiceCount).toBe(0);
    const ranks = res.body.items.map((i: { rank: number }) => i.rank);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });

  it('POST /api/chunk-drill/complete increments practiceCount and drops items from the front of the next set', async () => {
    const before = await request(app.getHttpServer()).get('/api/chunk-drill/set?size=3').set('Cookie', cookie);
    const practicedIds = before.body.items.map((i: { id: number }) => i.id);

    const complete = await request(app.getHttpServer())
      .post('/api/chunk-drill/complete')
      .set('Cookie', cookie)
      .send({ chunkItemIds: practicedIds });
    expect(complete.status).toBe(201);
    expect(complete.body.practicedCount).toBe(3);

    const after = await request(app.getHttpServer()).get('/api/chunk-drill/set?size=3').set('Cookie', cookie);
    const afterIds = after.body.items.map((i: { id: number }) => i.id);
    for (const id of practicedIds) expect(afterIds).not.toContain(id);
  });

  it('GET /api/chunk-drill/summary reflects practiced items', async () => {
    const res = await request(app.getHttpServer()).get('/api/chunk-drill/summary').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(100);
    expect(res.body.practicedAtLeastOnce).toBeGreaterThanOrEqual(3);
    expect(res.body.practicedToday).toBeGreaterThanOrEqual(3);
  });
});
