import prisma from '../config/database';

/**
 * Get session pricing for a therapist and therapy type
 * Returns therapist-specific pricing if available, otherwise returns therapy type defaults
 */
export async function getSessionPricing(
    tenantId: string,
    therapistId: string,
    therapyTypeId: string
): Promise<{
    cost: number;
    duration: number;
    isCustomPricing: boolean;
}> {
    // Try to get therapist-specific pricing first
    const therapistPricing = await prisma.therapistPricing.findUnique({
        where: {
            tenantId_therapistId_therapyTypeId: {
                tenantId,
                therapistId,
                therapyTypeId,
            },
        },
    });

    if (therapistPricing && therapistPricing.active) {
        return {
            cost: Number(therapistPricing.sessionCost),
            duration: therapistPricing.sessionDuration,
            isCustomPricing: true,
        };
    }

    // Fall back to therapy type defaults
    const therapyType = await prisma.therapyType.findUnique({
        where: { id: therapyTypeId },
    });

    if (!therapyType) {
        throw new Error('Therapy type not found');
    }

    return {
        cost: Number(therapyType.defaultCost),
        duration: therapyType.defaultDuration,
        isCustomPricing: false,
    };
}

/**
 * Get all pricing for a therapist (for display purposes)
 */
export async function getTherapistPricingList(tenantId: string, therapistId: string) {
    const customPricing = await prisma.therapistPricing.findMany({
        where: {
            tenantId,
            therapistId,
            active: true,
        },
        include: {
            TherapyType: true,
        },
    });

    const allTherapyTypes = await prisma.therapyType.findMany({
        where: {
            tenantId,
            active: true,
        },
    });

    // Combine custom pricing with defaults
    return allTherapyTypes.map((therapyType) => {
        const custom = customPricing.find((p) => p.therapyTypeId === therapyType.id);

        return {
            therapyTypeId: therapyType.id,
            therapyTypeName: therapyType.name,
            cost: custom ? Number(custom.sessionCost) : Number(therapyType.defaultCost),
            duration: custom ? custom.sessionDuration : therapyType.defaultDuration,
            isCustomPricing: !!custom,
        };
    });
}
