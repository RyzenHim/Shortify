import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { Role } from '../common/enums/role.enum';

describe('AuthService', () => {
  let service: AuthService;
  const user = {
    id: '507f1f77bcf86cd799439011',
    name: 'Jane Doe',
    email: 'jane@example.com',
    role: Role.User,
    provider: 'local',
    isActive: true,
  };
  const usersServiceMock = {
    create: jest.fn().mockResolvedValue(user),
    setRefreshToken: jest.fn().mockResolvedValue(undefined),
    toSafeUser: jest.fn().mockReturnValue(user),
  };
  const jwtServiceMock = {
    signAsync: jest
      .fn()
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('registers a user and returns tokens', async () => {
    jwtServiceMock.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    await expect(
      service.register({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
      }),
    ).resolves.toEqual({
      user,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });
});
