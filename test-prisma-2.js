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
        job: "Pelajar",
        gender: "Laki-laki",
        birthPlace: "Kediri",
        birthDate: "invalid-date", // Intentional error!
        maritalStatus: null,
        address: null,
        city: null,
        cellGroup: null,
        ministries: null,
        isBaptized: false,
        baptismDate: null,
        familyId: null,
        familyRelation: null,
        status: "AKTIF",
        joinDate: new Date(),
        attendanceRatio: 1.0,
        absentWeeks: 0
      }
    });
    console.log(newMember);
  } catch(e) {
    console.log("ERROR:\n" + e.message);
  }
}
main();
