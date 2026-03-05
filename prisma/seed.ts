import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const JOBS_DATA = [
  { title: 'مودريتور', titleEn: 'Moderator', slug: 'moderator', icon: '🛡️', description: 'إدارة المحتوى والمجتمعات الرقمية' },
  { title: 'مصممي سيرة ذاتية', titleEn: 'CV Designer', slug: 'cv-designer', icon: '📄', description: 'تصميم سير ذاتية احترافية' },
  { title: 'مصمم عام', titleEn: 'Graphic Designer', slug: 'graphic-designer', icon: '🎨', description: 'تصميم جرافيك وبصريات إبداعية' },
  { title: 'خياطين', titleEn: 'Tailor', slug: 'tailor', icon: '🧵', description: 'أعمال الخياطة والتفصيل' },
  { title: 'مقص دار', titleEn: 'Fabric Cutter', slug: 'fabric-cutter', icon: '✂️', description: 'قص الأقمشة والباترونات' },
  { title: 'مسوقين بالعمولة', titleEn: 'Affiliate Marketer', slug: 'affiliate-marketer', icon: '📢', description: 'تسويق بالعمولة وجلب عملاء' },
  { title: 'مبرمجين', titleEn: 'Developer', slug: 'developer', icon: '💻', description: 'تطوير مواقع وتطبيقات' },
  { title: 'محاسبين', titleEn: 'Accountant', slug: 'accountant', icon: '📊', description: 'إدارة الحسابات والمالية' },
  { title: 'HR', titleEn: 'HR Specialist', slug: 'hr', icon: '👥', description: 'إدارة الموارد البشرية' },
  { title: 'كاتب محتوى', titleEn: 'Content Writer', slug: 'content-writer', icon: '✍️', description: 'كتابة محتوى إبداعي وتسويقي' },
  { title: 'خدمة عملاء', titleEn: 'Customer Service', slug: 'customer-service', icon: '🎧', description: 'دعم وخدمة العملاء' },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  await prisma.adminUser.upsert({
    where: { email: 'admin@cveeez.online' },
    update: {},
    create: {
      email: 'admin@cveeez.online',
      password: hashedPassword,
      name: 'Admin',
      role: 'SUPER_ADMIN',
    },
  });
  console.log('✅ Admin user created (admin@cveeez.online / admin123)');

  // Create jobs
  for (const jobData of JOBS_DATA) {
    await prisma.job.upsert({
      where: { slug: jobData.slug },
      update: {},
      create: {
        title: jobData.title,
        titleEn: jobData.titleEn,
        slug: jobData.slug,
        icon: jobData.icon,
        description: jobData.description,
        isActive: true,
      },
    });
  }
  console.log(`✅ ${JOBS_DATA.length} jobs created`);

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
