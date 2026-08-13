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
// README "Test 실행"). Creates and tears down its own throwaway test user
// rather than driving a real Google login.
describe('Study + Progress (e2e)', () => {
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
        email: `study-e2e-${Date.now()}@example.com`,
        displayName: 'Study E2E',
      },
    });
    userId = user.id;
    cookie = `${SESSION_COOKIE_NAME}=${sessionTokenService.sign(user.id)}`;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } });
    await app.close();
  });

  it('GET /api/study/new returns unseen items with no progress', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/study/new?limit=5')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items.length).toBeLessThanOrEqual(5);
    for (const item of res.body.items) expect(item.progress).toBeNull();
  });

  it('review flow: create session -> rate a new card -> progress and due queue update', async () => {
    const newQueue = await request(app.getHttpServer())
      .get('/api/study/new?limit=1')
      .set('Cookie', cookie);
    const learningItemId = newQueue.body.items[0].id;

    const session = await request(app.getHttpServer())
      .post('/api/study/sessions')
      .set('Cookie', cookie)
      .send({ mode: 'new' });
    expect(session.status).toBe(201);
    const sessionId = session.body.id;

    // Rating 3 (Good) on a brand-new card: fixed 2-day interval per CLAUDE.md.
    const review = await request(app.getHttpServer())
      .post('/api/study/reviews')
      .set('Cookie', cookie)
      .send({ sessionId, learningItemId, rating: 3 });

    expect(review.status).toBe(201);
    expect(review.body).toMatchObject({ learningItemId, rating: 3, reps: 1, lapses: 0, intervalDays: 2 });

    // Due in 2 days, so it must not show up in today's due queue.
    const due = await request(app.getHttpServer()).get('/api/study/due').set('Cookie', cookie);
    expect(due.body.items.find((i: { id: number }) => i.id === learningItemId)).toBeUndefined();

    const finish = await request(app.getHttpServer())
      .patch(`/api/study/sessions/${sessionId}/finish`)
      .set('Cookie', cookie);
    expect(finish.status).toBe(200);
    expect(finish.body.reviewedCount).toBe(1);
    expect(finish.body.endedAt).not.toBeNull();
  });

  it('POST /api/study/reviews rejects a session that belongs to another user', async () => {
    const otherUser = await prisma.user.create({
      data: { googleId: `other-${Date.now()}`, email: `other-${Date.now()}@example.com` },
    });
    const otherSession = await prisma.studySession.create({
      data: { userId: otherUser.id, mode: 'new' },
    });

    const res = await request(app.getHttpServer())
      .post('/api/study/reviews')
      .set('Cookie', cookie)
      .send({ sessionId: otherSession.id, learningItemId: 1, rating: 3 });

    expect(res.status).toBe(404);
    await prisma.user.delete({ where: { id: otherUser.id } });
  });

  it('GET /api/progress/summary reflects the review just recorded', async () => {
    const res = await request(app.getHttpServer()).get('/api/progress/summary').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1350);
    expect(res.body.learned).toBeGreaterThanOrEqual(1);
    expect(res.body.today).toBeGreaterThanOrEqual(1);
    const categorySum = res.body.categories.reduce((sum: number, c: { total: number }) => sum + c.total, 0);
    expect(categorySum).toBe(1350);
  });

  it('GET /api/progress/calendar includes today with at least one review', async () => {
    const res = await request(app.getHttpServer()).get('/api/progress/calendar?days=7').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.days).toHaveLength(7);
    const today = res.body.days[res.body.days.length - 1];
    expect(today.count).toBeGreaterThanOrEqual(1);
  });
});
