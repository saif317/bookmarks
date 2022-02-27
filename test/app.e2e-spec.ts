import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import * as pactum from 'pactum';
import { AuthDto } from '../src/auth/dto';
import { EditUserDto } from '../src/user/dto';
import { CreateBookmarkDto, EditBookmarkDto } from '../src/bookmark/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    await app.listen(3000);

    prisma = app.get(PrismaService);
    await prisma.cleanDb();

    pactum.request.setBaseUrl('http://localhost:3000');
  });

  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'saif@gmail.com',
      password: '123',
    };
    describe('Sign-up', () => {
      it('should throw if email is empty', () => {
        return pactum
          .spec()
          .post('/auth/sign-up')
          .withBody({
            password: dto.password,
          })
          .expectStatus(400);
      });

      it('should throw if password is empty', () => {
        return pactum
          .spec()
          .post('/auth/sign-up')
          .withBody({
            password: dto.email,
          })
          .expectStatus(400);
      });

      it('should throw if body is empty', () => {
        return pactum.spec().post('/auth/sign-up').expectStatus(400);
      });

      it('should sign-up', () => {
        return pactum
          .spec()
          .post('/auth/sign-up')
          .withBody(dto)
          .expectStatus(201);
      });
    });

    describe('Sign-in', () => {
      it('should throw if email is empty', () => {
        return pactum
          .spec()
          .post('/auth/sign-in')
          .withBody({
            password: dto.password,
          })
          .expectStatus(400);
      });

      it('should throw if password is empty', () => {
        return pactum
          .spec()
          .post('/auth/sign-in')
          .withBody({
            password: dto.email,
          })
          .expectStatus(400);
      });

      it('should throw if body is empty', () => {
        return pactum.spec().post('/auth/sign-in').expectStatus(400);
      });

      it('should sign-in', () => {
        return pactum
          .spec()
          .post('/auth/sign-in')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAt', 'access_token');
      });
    });
  });

  describe('User', () => {
    describe('Get Me', () => {
      it('should get current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .expectStatus(200);
      });
    });

    describe('Edit User', () => {
      const dto: EditUserDto = {
        firstName: 'Saif',
        lastName: 'Momani',
      };

      it('should edit user', () => {
        return pactum
          .spec()
          .patch('/users')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.lastName);
      });
    });
  });

  describe('Bookmarks', () => {
    describe('Get Empty Bookmarks', () => {
      it('should get bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .expectStatus(200)
          .expectBody([]);
      });
    });

    describe('Create Bookmark', () => {
      const dto: CreateBookmarkDto = {
        title: 'Google.com',
        link: 'https://www.google.com/',
      };

      it('should create a bookmark', () => {
        return pactum
          .spec()
          .post('/bookmarks')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .withBody(dto)
          .expectStatus(201)
          .stores('bookmarkId', 'id');
      });
    });

    describe('Get Bookmarks', () => {
      it('should get all bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .expectStatus(200)
          .expectJsonLength(1);
      });
    });

    describe('Get Bookmark by id', () => {
      it('should get a bookmark', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withQueryParams('id', '$S{bookmarkId}')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .expectStatus(200)
          .expectBodyContains('$S{bookmarkId}');
      });
    });

    describe('Edit Bookmark by id', () => {
      const dto: EditBookmarkDto = {
        description: 'Google Home Page',
      };

      it('should edit a bookmark', () => {
        return pactum
          .spec()
          .patch('/bookmarks')
          .withQueryParams('id', '$S{bookmarkId}')
          .withHeaders({ Authorization: 'Bearer $S{userAt}' })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains('$S{bookmarkId}');
      });
    });

    describe('Delete Bookmark by id', () => {
      it.todo('Delete Bookmark');
    });
  });

  it.todo('should pass');
});
