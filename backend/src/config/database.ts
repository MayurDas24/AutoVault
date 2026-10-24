import { PrismaClient } from '@prisma/client';

// Creating the client does not connect. The server owns connect/disconnect.
export const database = new PrismaClient();
