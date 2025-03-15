import { LessThan } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { BlacklistedToken } from '../models/BlacklistedToken';

const blacklistedTokenRepository = AppDataSource.getRepository(BlacklistedToken);

export const cleanupExpiredTokens = async () => {
    try {
        const result = await blacklistedTokenRepository.delete({
            expiresAt: LessThan(new Date())
        });
        console.log(`🧹 Cleaned up ${result.affected || 0} expired tokens`);
    } catch (error) {
        console.error('Token cleanup failed:', error);
    }
};
