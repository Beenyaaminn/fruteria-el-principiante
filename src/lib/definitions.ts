import * as z from "zod";

export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, { error: "El email es obligatorio" })
    .email({ error: "Email inválido" })
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(1, { error: "La contraseña es obligatoria" })
    .min(6, { error: "Mínimo 6 caracteres" }),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export type FormState = {
  errors?: {
    email?: string[];
    password?: string[];
  };
  message?: string;
} | undefined;
