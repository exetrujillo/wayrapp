// src/shared/test/testFactory.ts
import { PrismaClient, Role } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { UserFactory } from './userFactory';

const prisma = new PrismaClient();

const uniqueId = (prefix: string) => `${prefix}-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5)}`;

export const TestFactory = {
    async createUser(options: { role?: Role; email?: string } = {}) {
        const { role = 'student', email } = options;
        
        const userData = role === 'admin' 
            ? UserFactory.buildAdmin({ email: email || uniqueId('admin') + '@example.com' })
            : role === 'content_creator'
            ? UserFactory.buildContentCreator({ email: email || uniqueId('creator') + '@example.com' })
            : UserFactory.build({ email: email || uniqueId('student') + '@example.com' });

        const user = await prisma.user.create({
            data: userData
        });

        const authToken = this.createAuthToken(user);

        return { user, authToken };
    },

    async createFullContentHierarchy() {
        // Crear toda la jerarquía en una transacción para evitar condiciones de carrera
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: uniqueId('testuser') + '@example.com',
                    role: 'content_creator',
                },
            });

            const course = await tx.course.create({
                data: { id: uniqueId('course'), sourceLanguage: 'en', targetLanguage: 'es', name: 'Factory Course' },
            });

            const level = await tx.level.create({
                data: { id: uniqueId('level'), courseId: course.id, code: 'A1', name: 'Factory Level', order: 1 },
            });

            const section = await tx.section.create({
                data: { id: uniqueId('section'), levelId: level.id, name: 'Factory Section', order: 1 },
            });

            const module = await tx.module.create({
                data: { id: uniqueId('module'), sectionId: section.id, moduleType: 'basic_lesson', name: 'Factory Module', order: 1 },
            });

            return { user, course, level, section, module };
        });

        const authToken = this.createAuthToken(result.user);

        return { ...result, authToken };
    },

    createAuthToken(user: any): string {
        return jwt.sign(
            { 
                sub: user.id, 
                role: user.role, 
                email: user.email, 
                iat: Math.floor(Date.now() / 1000), 
                exp: Math.floor(Date.now() / 1000) + 3600 
            },
            process.env['JWT_SECRET']!
        );
    },

    async cleanupDatabase() {
        // Usar transacción para asegurar que la limpieza sea atómica
        await prisma.$transaction(async (tx) => {
            await tx.lessonCompletion.deleteMany();
            await tx.userProgress.deleteMany();
            await tx.lessonExercise.deleteMany();
            await tx.exercise.deleteMany();
            await tx.lesson.deleteMany();
            await tx.module.deleteMany();
            await tx.section.deleteMany();
            await tx.level.deleteMany();
            await tx.course.deleteMany();
            await tx.follow.deleteMany();
            await tx.revokedToken.deleteMany();
            await tx.user.deleteMany();
        });
    },

    prisma,
};