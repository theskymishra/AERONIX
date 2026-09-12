
import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module.js';
import { RolesSeederService } from './roles-seeder.service.js';

async function bootstrap() {
  const app =
    await NestFactory.createApplicationContext(AppModule);

  try {
    const rolesSeeder =
      app.get(RolesSeederService);

    const count =
      await rolesSeeder.seedAllOrganizations();

    console.log(
      `Seeded system roles for ${count} organization(s).`,
    );
  } finally {
    await app.close();
  }
}

bootstrap().catch((error) => {
  console.error('Role seeding failed:', error);
  process.exit(1);
});
