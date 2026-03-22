import { db } from '@/db'
import { locations } from '../../../db/schema/location'
import { desc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params

    // ดึงพิกัดล่าสุด 1 อัน โดยเรียงจาก createdAt ล่าสุด
    const latestLocation = await db
      .select()
      .from(locations)
      .where(eq(locations.orderId, orderId))
      .orderBy(desc(locations.createdAt))
      .limit(1)

    if (latestLocation.length === 0) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    return NextResponse.json(latestLocation[0])
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}