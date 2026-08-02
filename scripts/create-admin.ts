import dotenv from "dotenv";

import { hash } from "bcryptjs";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";

import { getUserDirectory } from "../lib/auth/user-directory-factory";
import { UserRole } from "../lib/auth/roles";
import { UserDirectoryConflictError } from "../lib/auth/user-directory-errors";

dotenv.config({ path: ".env.local" });

function isStrongPassword(password: string) {
  return password.length >= 12 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
}

async function ask(question: string) {
  const prompt = createInterface({ input: stdin, output: stdout });
  try {
    return (await prompt.question(question)).trim();
  } finally {
    prompt.close();
  }
}

function askForPassword() {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    return Promise.reject(new Error("This command requires an interactive terminal to protect the password."));
  }

  return new Promise<string>((resolve, reject) => {
    let password = "";
    stdout.write("Password (12+ chars, upper, lower, number, symbol): ");
    stdin.setRawMode(true);
    stdin.resume();

    const cleanUp = () => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdout.write("\n");
    };
    const onData = (chunk: Buffer) => {
      for (const character of chunk.toString("utf8")) {
        if (character === "\r" || character === "\n") {
          cleanUp();
          resolve(password);
          return;
        }
        if (character === "\u0003") {
          cleanUp();
          reject(new Error("Cancelled."));
          return;
        }
        if (character === "\b" || character === "\u007f") {
          password = password.slice(0, -1);
          continue;
        }
        password += character;
      }
    };
    stdin.on("data", onData);
  });
}

async function createAdmin() {
  const name = await ask("Name: ");
  const email = (await ask("Email: ")).toLowerCase();
  const password = await askForPassword();

  if (name.length < 2) throw new Error("Name must contain at least two characters.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
  if (!isStrongPassword(password)) throw new Error("Password does not meet the strength requirements.");

  await getUserDirectory().createUser({
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash: await hash(password, 12),
    role: UserRole.SUPER_ADMIN,
    active: true,
  });
  console.log(`Created Super Admin for ${email}.`);
}

createAdmin().catch((error: unknown) => {
  if (error instanceof UserDirectoryConflictError) {
    console.error("A user with this email already exists.");
  } else {
    console.error(error instanceof Error ? error.message : "Unable to create the admin user.");
  }
  process.exitCode = 1;
});
