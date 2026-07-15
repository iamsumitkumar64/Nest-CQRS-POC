import { faker } from '@faker-js/faker';
import { dataSource, options } from '../data-source';
import { ProductEntity } from 'src/domain/product/product.entity';
import { UserEntity } from 'src/domain/user/user.entity';
import * as bcrypt from 'bcrypt';

// hardcoded users for all microservices
const users = [
    {
        uuid: 'c0a80101-7b1d-4a9f-8c1a-123456789001',
        email: 'user1@gmail.com',
        username: 'user 1',
        created_at: new Date('2025-01-01T00:00:00.000Z'),
    },
    {
        uuid: 'c0a80102-7b1d-4a9f-8c1a-123456789002',
        email: 'user2@gmail.com',
        username: 'user 2',
        created_at: new Date('2025-01-02T00:00:00.000Z'),
    },
];

async function create() {
    dataSource.setOptions({
        ...options,
    });

    await dataSource.initialize();

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const passwordHash = await bcrypt.hash('password123', 12);

        // use same users across all services
        for (const user of users) {
            await queryRunner.manager.save(UserEntity, {
                uuid: user.uuid,
                email: user.email,
                username: user.username,
                password: passwordHash,
                created_at: user.created_at,
            });
        }

        // seed products and associate them with these users
        for (const _ of Array.from(Array(15).keys())) {
            const randomUserUuid = faker.helpers.arrayElement(users).uuid;

            await queryRunner.manager.save(ProductEntity, {
                name: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                price: Number(faker.commerce.price({ min: 23, max: 100 })),
                image_url: faker.image.url(),
                user_uuid: randomUserUuid,
            });
        }

        await queryRunner.commitTransaction();
        console.info('✅ Seeded successfully');
    } catch (error) {
        await queryRunner.rollbackTransaction();
        console.error('❌ Something went wrong:', error);
    } finally {
        await queryRunner.release();
    }
}

void create();