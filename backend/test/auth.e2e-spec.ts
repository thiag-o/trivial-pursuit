import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-for-e2e';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/login should return a JWT token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ nickname: 'TestPlayer' })
      .expect(201);

    expect(res.body).toHaveProperty('access_token');
    expect(typeof res.body.access_token).toBe('string');
  });

  it('POST /auth/login should reject empty nickname', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ nickname: '' })
      .expect(400);
  });

  it('POST /auth/login should reject whitespace-only nickname', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ nickname: '   ' })
      .expect(400);
  });

  it('protected route should return 401 without token', async () => {
    await request(app.getHttpServer())
      .post('/game/start')
      .send({ opponents: 1 })
      .expect(401);
  });

  it('protected route should accept valid JWT', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ nickname: 'AuthedPlayer' })
      .expect(201);

    const token = loginRes.body.access_token;

    const gameRes = await request(app.getHttpServer())
      .post('/game/start')
      .set('Authorization', `Bearer ${token}`)
      .send({ opponents: 1 })
      .expect(201);

    expect(gameRes.body).toHaveProperty('gameId');
    expect(gameRes.body.players).toHaveLength(2);
  });
});
