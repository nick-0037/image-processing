import createError from "http-errors";

export class UnauthorizedError extends createError.Unauthorized {
	constructor(message = "Authentication failed: Invalid credentials") {
		super(message);
		this.name = "UnauthorizedError";
	}
}

export class ConflictError extends createError.Conflict {
	constructor(message = "Resource already exists: Duplicate entry") {
		super(message);
		this.name = "ConflictError";
	}
}

export class NotFoundError extends createError.NotFound {
	constructor(message = "The request resource was not found") {
		super(message);
		this.name = "NotFoundError";
	}
}
