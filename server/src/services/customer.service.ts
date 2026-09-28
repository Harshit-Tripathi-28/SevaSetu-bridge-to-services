import { getPrismaClient } from '../config/database.js';
import type {
  CustomerProfile,
  UpdateCustomerProfileRequest,
  Address,
  CreateAddressRequest,
  UpdateAddressRequest,
  AddressLabel,
} from '@sevasetu/shared';

export class CustomerService {
  private static get prisma() {
    const client = getPrismaClient();
    if (!client) throw new Error('Database client not initialized');
    return client;
  }

  /**
   * Retrieves profile of authenticated user.
   */
  static async getProfile(userId: string): Promise<CustomerProfile | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: {
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        },
      },
    });

    if (!user) return null;

    const defaultAddress = user.addresses.find((a) => a.isDefault) || user.addresses[0] || null;

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      addressesCount: user.addresses.length,
      defaultAddress: defaultAddress
        ? {
            id: defaultAddress.id,
            userId: defaultAddress.userId,
            label: defaultAddress.label as AddressLabel,
            flatNumber: defaultAddress.flatNumber,
            streetArea: defaultAddress.streetArea,
            city: defaultAddress.city,
            state: defaultAddress.state || 'Uttar Pradesh',
            postalCode: defaultAddress.postalCode,
            landmark: defaultAddress.landmark,
            isDefault: defaultAddress.isDefault,
            createdAt: defaultAddress.createdAt.toISOString(),
            updatedAt: defaultAddress.updatedAt.toISOString(),
          }
        : null,
    };
  }

  /**
   * Updates authenticated user's safe profile attributes.
   * Prevents modifying role, status, email, or password through this endpoint.
   */
  static async updateProfile(
    userId: string,
    data: UpdateCustomerProfileRequest
  ): Promise<CustomerProfile> {
    const updateData: { fullName?: string | null; phone?: string | null } = {};

    if (data.fullName !== undefined) {
      updateData.fullName = data.fullName.trim() || null;
    }

    if (data.phone !== undefined) {
      updateData.phone = data.phone.trim() || null;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    const updated = await this.getProfile(userId);
    if (!updated) throw new Error('Failed to retrieve updated profile');
    return updated;
  }

  /**
   * Retrieves all saved addresses for a customer.
   */
  static async getAddresses(userId: string): Promise<Address[]> {
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return addresses.map((a) => ({
      id: a.id,
      userId: a.userId,
      label: a.label as AddressLabel,
      flatNumber: a.flatNumber,
      streetArea: a.streetArea,
      city: a.city,
      state: a.state || 'Uttar Pradesh',
      postalCode: a.postalCode,
      landmark: a.landmark,
      isDefault: a.isDefault,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));
  }

  /**
   * Creates a new saved address for the customer.
   * If marked as default or if this is the user's first address, safely makes it primary.
   */
  static async createAddress(userId: string, data: CreateAddressRequest): Promise<Address> {
    const existingCount = await this.prisma.address.count({ where: { userId } });
    const shouldBeDefault = data.isDefault || existingCount === 0;

    return await this.prisma.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      const created = await tx.address.create({
        data: {
          userId,
          label: data.label || 'HOME',
          flatNumber: data.flatNumber.trim(),
          streetArea: data.streetArea.trim(),
          city: data.city.trim(),
          state: data.state?.trim() || 'Uttar Pradesh',
          postalCode: data.postalCode.trim(),
          landmark: data.landmark?.trim() || null,
          isDefault: shouldBeDefault,
        },
      });

      return {
        id: created.id,
        userId: created.userId,
        label: created.label as AddressLabel,
        flatNumber: created.flatNumber,
        streetArea: created.streetArea,
        city: created.city,
        state: created.state || 'Uttar Pradesh',
        postalCode: created.postalCode,
        landmark: created.landmark,
        isDefault: created.isDefault,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };
    });
  }

  /**
   * Updates an existing address owned by the customer.
   */
  static async updateAddress(
    userId: string,
    addressId: string,
    data: UpdateAddressRequest
  ): Promise<Address> {
    const existing = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existing) {
      throw new Error('Address not found or unauthorized');
    }

    return await this.prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      const updated = await tx.address.update({
        where: { id: addressId },
        data: {
          label: data.label !== undefined ? data.label : undefined,
          flatNumber: data.flatNumber !== undefined ? data.flatNumber.trim() : undefined,
          streetArea: data.streetArea !== undefined ? data.streetArea.trim() : undefined,
          city: data.city !== undefined ? data.city.trim() : undefined,
          state: data.state !== undefined ? data.state.trim() : undefined,
          postalCode: data.postalCode !== undefined ? data.postalCode.trim() : undefined,
          landmark: data.landmark !== undefined ? (data.landmark.trim() || null) : undefined,
          isDefault: data.isDefault !== undefined ? data.isDefault : undefined,
        },
      });

      return {
        id: updated.id,
        userId: updated.userId,
        label: updated.label as AddressLabel,
        flatNumber: updated.flatNumber,
        streetArea: updated.streetArea,
        city: updated.city,
        state: updated.state || 'Uttar Pradesh',
        postalCode: updated.postalCode,
        landmark: updated.landmark,
        isDefault: updated.isDefault,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    });
  }

  /**
   * Sets a specific address as primary default.
   */
  static async setDefaultAddress(userId: string, addressId: string): Promise<Address> {
    const existing = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existing) {
      throw new Error('Address not found or unauthorized');
    }

    return await this.prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });

      const updated = await tx.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      });

      return {
        id: updated.id,
        userId: updated.userId,
        label: updated.label as AddressLabel,
        flatNumber: updated.flatNumber,
        streetArea: updated.streetArea,
        city: updated.city,
        state: updated.state || 'Uttar Pradesh',
        postalCode: updated.postalCode,
        landmark: updated.landmark,
        isDefault: updated.isDefault,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    });
  }

  /**
   * Deletes an address owned by the customer.
   * If the default address was deleted and other addresses remain, promotes the latest one.
   */
  static async deleteAddress(userId: string, addressId: string): Promise<void> {
    const existing = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existing) {
      throw new Error('Address not found or unauthorized');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.address.delete({
        where: { id: addressId },
      });

      if (existing.isDefault) {
        const remaining = await tx.address.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });

        if (remaining) {
          await tx.address.update({
            where: { id: remaining.id },
            data: { isDefault: true },
          });
        }
      }
    });
  }
}
