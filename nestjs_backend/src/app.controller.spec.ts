import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {},
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('api info', () => {
    it('should return API metadata', () => {
      expect(appController.getApiInfo()).toEqual({
        service: 'AgroSinergia API',
        version: '1.0.0',
        status: 'ok',
      });
    });
  });
});
