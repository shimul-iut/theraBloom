import prisma from '../../config/database';
import {
  CreateRescheduleRequestInput,
  ReviewRescheduleRequestInput,
} from './reschedule-requests.schema';
import { RescheduleStatus } from '@prisma/client';

export class RescheduleRequestsService {
  /**
   * Get reschedule requests with filters
   */
  async getRescheduleRequests(
    tenantId: string,
    filters: {
      therapistId?: string;
      status?: RescheduleStatus;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (filters.therapistId) where.therapistId = filters.therapistId;
    if (filters.status) where.status = filters.status;

    const [requests, total] = await Promise.all([
      prisma.rescheduleRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          Session: {
            include: {
              Patient: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
              TherapyType: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          User_RescheduleRequest_therapistIdToUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          User_RescheduleRequest_reviewedByToUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.rescheduleRequest.count({ where }),
    ]);

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get reschedule request by ID
   */
  async getRescheduleRequestById(tenantId: string, requestId: string) {
    const request = await prisma.rescheduleRequest.findFirst({
      where: {
        id: requestId,
        tenantId,
      },
      include: {
        Session: {
          include: {
            Patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            TherapyType: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        User_RescheduleRequest_therapistIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        User_RescheduleRequest_reviewedByToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!request) {
      throw new Error('Reschedule request not found');
    }

    return request;
  }

  /**
   * Create reschedule request with 48-hour validation
   */
  async createRescheduleRequest(
    tenantId: string,
    therapistId: string,
    input: CreateRescheduleRequestInput
  ) {
    // Get session
    const session = await prisma.session.findFirst({
      where: {
        id: input.sessionId,
        tenantId,
        therapistId,
      },
    });

    if (!session) {
      throw new Error('Session not found or does not belong to this therapist');
    }

    // Check if session is already completed or cancelled
    if (session.status === 'COMPLETED' || session.status === 'CANCELLED') {
      throw new Error(`Cannot reschedule ${session.status.toLowerCase()} session`);
    }

    // Validate 48-hour rule
    const now = new Date();
    const sessionDateTime = new Date(session.scheduledDate);
    const [hours, minutes] = session.startTime.split(':').map(Number);
    sessionDateTime.setHours(hours, minutes, 0, 0);

    const hoursUntilSession = (sessionDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilSession < 48) {
      throw new Error(
        'Reschedule requests must be made at least 48 hours before the scheduled session'
      );
    }

    // Check if there's already a pending request for this session
    const existingRequest = await prisma.rescheduleRequest.findFirst({
      where: {
        sessionId: input.sessionId,
        tenantId,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      throw new Error('There is already a pending reschedule request for this session');
    }

    // Create reschedule request
    const request = await prisma.rescheduleRequest.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        sessionId: input.sessionId,
        therapistId,
        requestedDate: new Date(input.requestedDate),
        requestedTime: input.requestedTime,
        reason: input.reason,
        status: 'PENDING',
        updatedAt: new Date(),
      },
      include: {
        Session: {
          include: {
            Patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            TherapyType: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        User_RescheduleRequest_therapistIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return request;
  }

  /**
   * Approve reschedule request and update session
   */
  async approveRescheduleRequest(
    tenantId: string,
    reviewerId: string,
    requestId: string,
    input: ReviewRescheduleRequestInput
  ) {
    // Get request
    const request = await prisma.rescheduleRequest.findFirst({
      where: {
        id: requestId,
        tenantId,
      },
      include: {
        Session: true,
      },
    });

    if (!request) {
      throw new Error('Reschedule request not found');
    }

    if (request.status !== 'PENDING') {
      throw new Error(`Cannot approve ${request.status.toLowerCase()} request`);
    }

    // Update request status
    const updatedRequest = await prisma.rescheduleRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNotes: input.reviewNotes || null,
      },
      include: {
        Session: {
          include: {
            Patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            TherapyType: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        User_RescheduleRequest_therapistIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        User_RescheduleRequest_reviewedByToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Update session with new date/time
    await prisma.session.update({
      where: { id: request.sessionId },
      data: {
        scheduledDate: request.requestedDate,
        startTime: request.requestedTime,
        // Keep the same duration by calculating end time
        // This is a simplified version - you might want to calculate actual end time
      },
    });

    return updatedRequest;
  }

  /**
   * Reject reschedule request
   */
  async rejectRescheduleRequest(
    tenantId: string,
    reviewerId: string,
    requestId: string,
    input: ReviewRescheduleRequestInput
  ) {
    // Get request
    const request = await prisma.rescheduleRequest.findFirst({
      where: {
        id: requestId,
        tenantId,
      },
    });

    if (!request) {
      throw new Error('Reschedule request not found');
    }

    if (request.status !== 'PENDING') {
      throw new Error(`Cannot reject ${request.status.toLowerCase()} request`);
    }

    // Update request status
    const updatedRequest = await prisma.rescheduleRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNotes: input.reviewNotes || null,
      },
      include: {
        Session: {
          include: {
            Patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            TherapyType: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        User_RescheduleRequest_therapistIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        User_RescheduleRequest_reviewedByToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updatedRequest;
  }

  /**
   * Cancel reschedule request (by therapist)
   */
  async cancelRescheduleRequest(tenantId: string, therapistId: string, requestId: string) {
    // Get request
    const request = await prisma.rescheduleRequest.findFirst({
      where: {
        id: requestId,
        tenantId,
      },
    });

    if (!request) {
      throw new Error('Reschedule request not found');
    }

    // Verify therapist owns this request
    if (request.therapistId !== therapistId) {
      throw new Error('You can only cancel your own reschedule requests');
    }

    if (request.status !== 'PENDING') {
      throw new Error(`Cannot cancel ${request.status.toLowerCase()} request`);
    }

    // Update request status
    const updatedRequest = await prisma.rescheduleRequest.update({
      where: { id: requestId },
      data: {
        status: 'CANCELLED',
      },
      include: {
        Session: {
          include: {
            Patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            TherapyType: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        User_RescheduleRequest_therapistIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updatedRequest;
  }
}

export const rescheduleRequestsService = new RescheduleRequestsService();
