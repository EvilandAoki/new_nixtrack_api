import { Request, Response, NextFunction } from 'express';

type ValidationSchema = {
  [key: string]: {
    required?: boolean;
    type?: 'string' | 'number' | 'email';
    minLength?: number;
  };
};

export function validate(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      if (rules.required && (value === undefined || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }

      if (value !== undefined && value !== '') {
        if (rules.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push(`${field} must be a valid email`);
          }
        }

        if (rules.type === 'string' && typeof value !== 'string') {
          errors.push(`${field} must be a string`);
        }

        if (rules.type === 'number' && typeof value !== 'number') {
          errors.push(`${field} must be a number`);
        }

        if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters`);
        }
      }
    }

    if (errors.length > 0) {
      res.status(400).json({ message: 'Validation failed', errors });
      return;
    }

    next();
  };
}
