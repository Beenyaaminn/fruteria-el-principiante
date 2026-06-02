"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import { LoginSchema, type FormState } from "@/lib/definitions";

export async function login(state: FormState, formData: FormData): Promise<FormState> {
  // 1. Validar campos
  const validated = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validated.data;

  // 2. Buscar usuario
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.active) {
    return { message: "Credenciales inválidas o usuario inactivo" };
  }

  // 3. Verificar contraseña
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return { message: "Credenciales inválidas" };
  }

  // 4. Crear sesión
  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  // 5. Redirigir al dashboard
  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
