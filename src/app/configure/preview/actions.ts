'use server';

import { BASE_PRICE, PRODUCT_PRICES } from '@/config/product';
import { db } from '@/db';
import { stripe } from '@/lib/stripe';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { Order } from '@prisma/client';

export const createCheckoutSession = async ({
    configId,
}: {
    configId: string;
}) => {
    const configuration = await db.configuration.findUnique({
        where: { id: configId },
    });

    if (!configuration) {
        throw new Error('No such configuration found');
    }

    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
        throw new Error('You need to be logged in');
    }
    // if (!user?.id || !user.email) {
    //     throw new Error('Invalid user data');
    // }

    // const existingUser = await db.user.findFirst({
    //     where: { id: user.id },
    // });

    // if (!existingUser) {
    //     await db.user.create({
    //         data: {
    //             id: user.id,
    //             email: user.email,
    //         },
    //     });
    // }

    const { finish, material } = configuration;

    let price = BASE_PRICE;
    if (finish) price += PRODUCT_PRICES.finish[finish];
    if (material) price += PRODUCT_PRICES.material[material];

    let order: Order | undefined = undefined;

    const existingOrder = await db.order.findFirst({
        where: {
            userId: user.id,
            configurationId: configuration.id,
        },
    });

    console.log(user.id, configuration.id, price / 100);

    if (existingOrder) {
        order = existingOrder;
    } else {
        console.log('creating new order');
        order = await db.order.create({
            data: {
                userId: user.id,
                configurationId: configuration.id,
                amount: price / 100,
            },
        });
    }

    const product = await stripe.products.create({
        name: 'Custom iPhone Case',
        images: [configuration.imageUrl],
        default_price_data: {
            currency: 'USD',
            unit_amount: price,
        },
    });

    const stripeSession = await stripe.checkout.sessions.create({
        success_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/thank-you?orderId=${order.id}`,
        cancel_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/configure/preview?id=${configuration.id}`,
        payment_method_types: ['card'],
        mode: 'payment',
        shipping_address_collection: { allowed_countries: ['DE', 'US'] },
        metadata: {
            userId: user.id,
            orderId: order.id,
        },
        line_items: [{ price: product.default_price as string, quantity: 1 }],
    });

    return { url: stripeSession.url };
};
