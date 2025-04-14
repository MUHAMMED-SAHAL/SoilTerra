import { NextResponse } from 'next/server';
import { getModelInfo } from '@/utils/modelUtils';

export async function GET() {
    try {
        const modelInfo = await getModelInfo();
        return NextResponse.json(modelInfo);
    } catch (error) {
        console.error('Error getting model info:', error);
        return NextResponse.json(
            { error: 'Failed to get model information' },
            { status: 500 }
        );
    }
}