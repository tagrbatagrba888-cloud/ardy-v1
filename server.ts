import express from "express";
import cors from "cors";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();
const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret";

function tokenFor(userId: string) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "7d" });
}
async function auth(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const h = req.headers.authorization || "";
    const t = h.startsWith("Bearer ") ? h.slice(7) : "";
    const p = jwt.verify(t, JWT_SECRET) as {sub:string};
    const user = await prisma.user.findUnique({ where: { id: p.sub } });
    if (!user) return res.status(401).json({error:"Unauthorized"});
    (req as any).user = user;
    next();
  } catch { res.status(401).json({error:"Unauthorized"}); }
}

app.get("/health", (_req,res)=>res.json({ok:true, service:"ardy-api", version:"1.0.0"}));

app.post("/auth/demo-login", async (req,res)=>{
  const body = z.object({phone:z.string().min(8), name:z.string().optional()}).parse(req.body);
  let user = await prisma.user.findUnique({where:{phone:body.phone}});
  if (!user) user = await prisma.user.create({data:{phone:body.phone,name:body.name,status:"ACTIVE"}});
  res.json({token:tokenFor(user.id), user});
});

app.get("/me", auth, async (req,res)=>res.json({user:(req as any).user}));

app.get("/projects", async (_req,res)=>{
  const projects = await prisma.project.findMany({where:{status:{in:["PUBLISHED","FUNDING","ACTIVE"]}},orderBy:{createdAt:"desc"}});
  res.json(projects);
});

app.get("/projects/:id", async (req,res)=>{
  const p = await prisma.project.findUnique({where:{id:req.params.id},include:{documents:true}});
  if (!p) return res.status(404).json({error:"Project not found"});
  res.json(p);
});

app.get("/portfolio", auth, async (req,res)=>{
  const items = await prisma.investment.findMany({where:{userId:(req as any).user.id},include:{project:true},orderBy:{createdAt:"desc"}});
  const total = items.filter(x=>x.status==="CONFIRMED").reduce((s,x)=>s+Number(x.amount),0);
  res.json({totalInvested:total, investments:items});
});

app.post("/investments", auth, async (req,res)=>{
  const body = z.object({projectId:z.string(),units:z.number().int().positive()}).parse(req.body);
  const user = (req as any).user;
  if (user.kycStatus !== "VERIFIED") return res.status(403).json({error:"KYC_REQUIRED"});
  const result = await prisma.$transaction(async tx=>{
    const p = await tx.project.findUnique({where:{id:body.projectId}});
    if (!p || p.status!=="FUNDING") throw new Error("PROJECT_NOT_AVAILABLE");
    if (body.units > p.availableUnits) throw new Error("INSUFFICIENT_UNITS");
    const amount = Number(p.unitPrice) * body.units;
    const inv = await tx.investment.create({
      data:{userId:user.id,projectId:p.id,units:body.units,unitPrice:p.unitPrice,amount,status:"PENDING"}
    });
    await tx.project.update({where:{id:p.id},data:{availableUnits:{decrement:body.units}}});
    return inv;
  });
  res.status(201).json(result);
});

app.get("/documents", auth, async (_req,res)=>{
  const docs = await prisma.document.findMany({orderBy:{createdAt:"desc"}});
  res.json(docs);
});

app.post("/admin/projects", async (req,res)=>{
  // V1 demo endpoint; production must be protected by admin RBAC + MFA.
  const body = z.object({
    name:z.string().min(2), description:z.string().min(2),
    areaFeddan:z.number().positive(), unitPrice:z.number().positive(),
    totalUnits:z.number().int().positive(), targetAmount:z.number().positive()
  }).parse(req.body);
  const p = await prisma.project.create({data:{
    name:body.name,description:body.description,areaFeddan:body.areaFeddan,
    unitPrice:body.unitPrice,totalUnits:body.totalUnits,availableUnits:body.totalUnits,
    targetAmount:body.targetAmount,status:"DRAFT"
  }});
  res.status(201).json(p);
});

app.use((err:any,_req:any,res:any,_next:any)=>{
  console.error(err);
  res.status(400).json({error:err?.message || "Bad request"});
});

app.listen(PORT, ()=>console.log(`ARDY API listening on :${PORT}`));
