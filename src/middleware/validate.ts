import { Request, Response, NextFunction } from 'express';

export interface ValidationRule {
  field: string;
  rules: Array<{
    validate: (value: string) => boolean;
    message: string;
  }>;
}

export const validate = (rules: ValidationRule[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      for (const rule of rules) {
        const value = req.body[rule.field];
        for (const validation of rule.rules) {
          if (!validation.validate(value)) {
            res.status(400).json({ error: validation.message });
            return;
          }
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
