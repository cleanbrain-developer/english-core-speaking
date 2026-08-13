import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

// Requires a reachable PostgreSQL (DATABASE_URL) and Google OAuth env vars
// (dummy values are fine — no live call to Google happens in this test).
// See README "Test 실행" for how to provision the local Postgres first.
describe('AppModule (e2e)', () => {
  let app: INestApplication;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health is public and reports database connectivity', async () => {
    const res = await request(app.getHttpServer()).get('/api/health');
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('info');
  });

  it('GET /api/learning-items rejects unauthenticated requests', async () => {
    const res = await request(app.getHttpServer()).get('/api/learning-items');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /api/auth/me rejects unauthenticated requests', async () => {
    const res = await request(app.getHttpServer()).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/google issues a redirect to Google\'s consent screen', async () => {
    const res = await request(app.getHttpServer()).get('/api/auth/google');
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('accounts.google.com');
  });
});
