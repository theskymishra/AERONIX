
import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module.js';
import { RolesService } from './roles.service.js';

async function bootstrap() {
  const app =
    await NestFactory.createApplicationContext(
      AppModule,
    );

  try {
    const email =
      process.env.TEST_USER_EMAIL
        ?.trim()
        .toLowerCase();

    if (!email) {
      throw new Error(
        'TEST_USER_EMAIL environment variable is required',
      );
    }

    const rolesService =
      app.get(RolesService);

    await rolesService.assignRoleByEmail(
      email,
      'SUPER_ADMIN',
    );

    console.log(
      `Assigned SUPER_ADMIN role to ${email}.`,
    );
  } finally {
    await app.close();
  }
}

bootstrap().catch((error) => {
  console.error(
    'User role assignment failed:',
    error,
  );
  process.exit(1);
});

