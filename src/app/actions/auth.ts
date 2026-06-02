"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSession, deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";

export async function registerAction(prevState: any, formData: FormData) {
  const churchName = formData.get("churchName") as string;
  const adminName = formData.get("adminName") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    return { error: "Password tidak cocok" };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "Email sudah terdaftar" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const church = await prisma.church.create({
      data: {
        name: churchName,
        users: {
          create: {
            name: adminName,
            email,
            phone,
            password: hashedPassword,
            role: "ADMIN",
          },
        },
      },
      include: {
        users: true,
      },
    });

    const user = church.users[0];
    await createSession(user.id, church.id, user.role);
  } catch (error: unknown) {
    console.error("Registration error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { error: `Gagal: ${msg}` };
  }

  redirect("/setup");
}

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const slug = formData.get("slug") as string | null;

  try {
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
  await deleteSession();
  redirect("/login");
}
