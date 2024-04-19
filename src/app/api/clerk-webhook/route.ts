import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, email_addresses, first_name, image_url } = body?.data;
        const email = email_addresses[0]?.email_address;

        const user = await db.user.upsert({
            where: { clerkId: id },
            update: {
                email,
                name: first_name,
                profileImage: image_url
            },
            create: {
                clerkId: id,
                email,
                name: first_name || '',
                profileImage: image_url || ''
            }
        });

        return NextResponse.json({ user }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: 'Error', error }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ message: 'OK' });
}
