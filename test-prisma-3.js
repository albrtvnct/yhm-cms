const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const newMember = await prisma.member.create({
      data: {
        churchId: "test",
        nij: "test",
        name: "test",
        phone: null,
        email: null,
        fakeField123: "Hello",
        gender: "Laki-laki",
        birthPlace: "Kediri",
        birthDate: null,
        maritalStatus: null,
        address: null,
        city: null,
        cellGroup: null,
        ministries: null,
        isBaptized: false,
        baptismDate: null,
        status: "AKTIF",
      }
    });
    console.log(newMember);
  } catch(e) {
    console.log("ERROR:\n" + e.message);
  }
}
main();
