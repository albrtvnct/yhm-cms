import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Menghapus data jemaat...');
  await prisma.member.deleteMany();
  await prisma.family.deleteMany();
  
  console.log('Menghapus data keuangan...');
  await prisma.financeTransaction.deleteMany();
  await prisma.financeDivision.deleteMany();
  await prisma.financeRecord.deleteMany();

  console.log('Semua data dummy berhasil dihapus!');
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
