import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // First, get the administrators group
    const adminGroup = await prisma.group.findFirst({
      where: { name: 'Allenatori' }
    });

    if (!adminGroup) {
      console.error('Admin group not found');
      return;
    }

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        firstName: 'Admin',
        lastName: 'User',
        groupId: adminGroup.id,
        username: 'admin',
        password: 'admin', // In production, this should be hashed
        email: 'admin@test.com',
        phone: '+39123456789',
        matricola: 'ADMIN001',
        expirationDate: new Date('2025-12-31T23:59:59.000Z'),
        status: 'active'
      },
      include: { group: true }
    });

    console.log('Admin user created successfully:', adminUser);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
