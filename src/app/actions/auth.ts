"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSession, deleteSession, getSession } from "@/lib/session";
import { redirect } from "next/navigation";



export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const slug = formData.get("slug") as string | null;

  try {
    // Auto-seed Super Admin if using the requested credentials
    if (email === "admin@yeshhealmecms.com") {
      let saChurch = await prisma.church.findUnique({
        where: { slug: "super-admin" }
      });
      if (!saChurch) {
        saChurch = await prisma.church.create({
          data: {
            name: "Yesh Heal Me CMS Admin Hub",
            slug: "super-admin",
            maxMembers: -1,
            maxWorkers: -1,
            maxUsers: -1,
          }
        });
      }

      let saUser = await prisma.user.findUnique({
        where: { email }
      });
      if (!saUser) {
        const hashedPassword = await bcrypt.hash("gotorevival", 10);
        await prisma.user.create({
          data: {
            name: "Super Admin",
            email: "admin@yeshhealmecms.com",
            password: hashedPassword,
            role: "SUPER_ADMIN",
            churchId: saChurch.id
          }
        });
      }
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { church: true }
    });

    if (!user) {
      return { error: "Email atau password salah" };
    }

    if (slug && user.church.slug !== slug) {
      return { error: "Akun ini tidak terdaftar pada portal gereja ini." };
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return { error: "Email atau password salah" };
    }

    await createSession(user.id, user.churchId, user.role);
  } catch (error: unknown) {
    console.error("Login error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { error: `Gagal: ${msg}` };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  let slug = "";
  try {
    const session = await getSession();
    if (session && session.churchId) {
      const church = await prisma.church.findUnique({
        where: { id: session.churchId }
      });
      if (church && church.slug) {
        slug = church.slug;
      }
    }
  } catch (error) {
    console.error("Logout resolution error:", error);
  }

  await deleteSession();

  if (slug) {
    redirect(`/portal/${slug}/login`);
  } else {
    redirect("/");
  }
}

export async function resolveChurchPortalAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Email wajib diisi" };
  }

  let slug = "";
  try {
    // Auto-seed Super Admin if resolving for admin@yeshhealmecms.com
    if (email === "admin@yeshhealmecms.com") {
      let saChurch = await prisma.church.findUnique({
        where: { slug: "super-admin" }
      });
      if (!saChurch) {
        saChurch = await prisma.church.create({
          data: {
            name: "Yesh Heal Me CMS Admin Hub",
            slug: "super-admin",
            maxMembers: -1,
            maxWorkers: -1,
            maxUsers: -1,
          }
        });
      }

      let saUser = await prisma.user.findUnique({
        where: { email }
      });
      if (!saUser) {
        const hashedPassword = await bcrypt.hash("gotorevival", 10);
        await prisma.user.create({
          data: {
            name: "Super Admin",
            email: "admin@yeshhealmecms.com",
            password: hashedPassword,
            role: "SUPER_ADMIN",
            churchId: saChurch.id
          }
        });
      }
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { church: true }
    });

    if (!user) {
      return { error: "Email admin tidak terdaftar di gereja manapun." };
    }

    if (!user.church || !user.church.slug) {
      return { error: "Gereja untuk akun ini tidak memiliki slug portal yang valid." };
    }

    slug = user.church.slug;
  } catch (error: unknown) {
    console.error("Resolve portal error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { error: `Gagal mencari portal: ${msg}` };
  }

  redirect(`/portal/${slug}/login?email=${encodeURIComponent(email)}`);
}

