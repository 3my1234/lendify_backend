import bcrypt from 'bcryptjs';
import { AppDataSource } from '../config/data-source';
import { User } from '../models/User';

const createSuperAdmin = async () => {
  try {
    await AppDataSource.initialize();
    const userRepository = AppDataSource.getRepository(User);
    
    // Check if super admin already exists
    const existingSuperAdmin = await userRepository.findOne({
      where: { role: 'super_admin' }
    });

    if (existingSuperAdmin) {
      console.log('❌ Super admin already exists');
      return;
    }

    const hashedPassword = await bcrypt.hash(process.env.SUPER_ADMIN_INITIAL_PASSWORD || 'Admin@123', 12);
    
    const superAdmin = userRepository.create({
      username: 'superadmin',
      email: process.env.SUPER_ADMIN_EMAIL || 'admin@lendify.com',
      password: hashedPassword,
      role: 'super_admin',
      is_active: true,
      profile_completed: true,
      investment_balance: 0,
      referral_earnings: 0
    });

    await userRepository.save(superAdmin);
    console.log('✅ Super admin created successfully');
    console.log('Email:', superAdmin.email);
    console.log('Password: Admin@123 (if no environment variable was set)');
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    process.exit(1);
  }
};

createSuperAdmin();
