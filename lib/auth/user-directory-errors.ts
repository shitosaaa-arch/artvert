export class UserDirectoryConflictError extends Error {
  constructor(email: string) {
    super(`A user with the email ${email} already exists.`);
    this.name = "UserDirectoryConflictError";
  }
}

export class UserDirectoryConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserDirectoryConfigurationError";
  }
}
