import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env['DATABASE_URL'] ?? 'postgresql://postgres:postgres@localhost:5432/postgres';
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const CATEGORIES = [
  { name: 'Kỹ sư Phần mềm & IT', slug: 'ky-su-phan-mem', iconKey: 'code' },
  { name: 'Trí tuệ Nhân tạo & Data', slug: 'tri-tue-nhan-tao', iconKey: 'brain' },
  { name: 'Kinh doanh / Bán hàng (Sales)', slug: 'sales-ban-hang', iconKey: 'shopping-cart' },
  { name: 'Marketing / Truyền thông', slug: 'marketing', iconKey: 'megaphone' },
  { name: 'Nhân sự (HR)', slug: 'nhan-su', iconKey: 'users' },
  { name: 'Kế toán / Kiểm toán', slug: 'ke-toan-kiem-toan', iconKey: 'calculator' },
  { name: 'Hành chính / Văn phòng', slug: 'hanh-chinh-van-phong', iconKey: 'briefcase' },
  { name: 'Ngân hàng / Tài chính', slug: 'ngan-hang-tai-chinh', iconKey: 'landmark' },
  { name: 'Xây dựng / Kiến trúc', slug: 'xay-dung-kien-truc', iconKey: 'building' },
  { name: 'Bất động sản', slug: 'bat-dong-san', iconKey: 'home' },
  { name: 'Y tế / Chăm sóc sức khỏe', slug: 'y-te-suc-khoe', iconKey: 'heart' },
  { name: 'Cơ khí / Kỹ thuật / Ô tô', slug: 'co-khi-ky-thuat', iconKey: 'settings' },
  { name: 'Điện / Điện tử / Điện lạnh', slug: 'dien-dien-tu', iconKey: 'zap' },
  { name: 'Giáo dục / Đào tạo', slug: 'giao-duc-dao-tao', iconKey: 'book' },
  { name: 'Du lịch / Nhà hàng / Khách sạn', slug: 'du-lich-nhhks', iconKey: 'coffee' },
  { name: 'Logistics / Xuất nhập khẩu', slug: 'logistics-xnk', iconKey: 'truck' },
  { name: 'Thiết kế / Đồ họa / Mỹ thuật', slug: 'thiet-ke-do-hoa', iconKey: 'palette' },
  { name: 'Nông / Lâm / Ngư nghiệp', slug: 'nong-lam-ngu-nghiep', iconKey: 'leaf' },
  { name: 'Luật / Pháp lý', slug: 'luat-phap-ly', iconKey: 'gavel' },
  { name: 'Thực phẩm / Đồ uống (F&B)', slug: 'thuc-pham-do-uong', iconKey: 'pizza' }
];

async function main() {
  console.log('Seeding Comprehensive Job Categories...');
  
  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i];
    await prisma.jobCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, iconKey: cat.iconKey, sortOrder: i + 1 },
      create: {
        name: cat.name,
        slug: cat.slug,
        iconKey: cat.iconKey,
        sortOrder: i + 1,
      }
    });
  }

  const newCount = await prisma.jobCategory.count();
  console.log(`Successfully seeded ${newCount} Job Categories.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
