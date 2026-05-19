import { ZodError } from 'zod';

// Generic Zod validator. Schemas describe { body?, params?, query? }.
// On failure, returns 400 with a structured list of { path, message } errors
// so the client (and humans debugging) can see exactly what was wrong.
export const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            params: req.params,
            query: req.query,
        });
        return next();
    } catch (err) {
        if (err instanceof ZodError) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: err.issues.map((i) => ({
                    path: i.path.join('.'),
                    message: i.message,
                })),
            });
        }
        return next(err);
    }
};
