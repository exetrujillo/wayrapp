/**
 * Script to create the first admin user
 * Run with: node scripts/create-admin.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
require('dotenv').config();

const prisma = new PrismaClient();

async function createAdminUser() {
    try {
        console.log('Creating admin user...');

        const email = 'admin@wayrapp.com';
        const password = process.env.ADMIN_NEXT_USER_PASS || 'AdminPass123!';
        const username = 'admin';

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            console.log('Admin user already exists!');
            console.log(`Email: ${existingUser.email}`);
            console.log(`Username: ${existingUser.username}`);
            return;
        }

        // Hash password
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create admin user
        const adminUser = await prisma.user.create({
            data: {
                email,
                password_hash: hashedPassword,
                username,
                role: 'admin',
                is_active: true,
                country_code: 'US',
                registration_date: new Date(),
            }
        });

        console.log('✅ Admin user created successfully!');
        console.log(`📧 Email: ${adminUser.email}`);
        console.log(`👤 Username: ${adminUser.username}`);
        console.log(`🔑 Password: ${password}`);
        console.log(`🆔 User ID: ${adminUser.id}`);
        console.log(`👑 Role: ${adminUser.role}`);

        console.log('\n🚀 You can now login using:');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);

    } catch (error) {
        console.error('❌ Error creating admin user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdminUser();