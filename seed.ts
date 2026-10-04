import { PrismaClient } from "@prisma/client";
const prisma=new PrismaClient();
async function main(){
  await prisma.project.upsert({
    where:{id:"demo-project-100f"},
    update:{},
    create:{
      id:"demo-project-100f",
      name:"مشروع الوادي الزراعي",
      description:"مشروع تجريبي لمساحة 100 فدان. البيانات للعرض والتطوير وليست عرضًا استثماريًا.",
      areaFeddan:100, unitPrice:100, totalUnits:100000, availableUnits:100000,
      targetAmount:10000000, status:"FUNDING"
    }
  });
  console.log("seeded");
}
main().finally(()=>prisma.$disconnect());