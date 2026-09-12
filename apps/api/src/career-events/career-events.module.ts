import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CareerEventsService } from './career-events.service.js';

import {
  CareerEvent,
  CareerEventSchema,
} from './schemas/career-event.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: CareerEvent.name,
        schema: CareerEventSchema,
      },
    ]),
  ],

  providers: [
    CareerEventsService,
  ],

  exports: [
    CareerEventsService,
    MongooseModule,
  ],
})
export class CareerEventsModule {}