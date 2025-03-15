import { ValidationRule } from './validate';

export const registerValidation: ValidationRule[] = [
  {
    field: 'username',
    rules: [
      {
        validate: (value: string): boolean => value?.length >= 3,
        message: 'Username must be at least 3 characters long'
      }
    ]
  },
  {
    field: 'email',
    rules: [
      {
        validate: (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: 'Please enter a valid email'
      }
    ]
  },
  {
    field: 'password',
    rules: [
      {
        validate: (value: string): boolean => value?.length >= 6,
        message: 'Password must be at least 6 characters long'
      }
    ]
  }
];

export const loginValidation: ValidationRule[] = [
  {
    field: 'email',
    rules: [
      {
        validate: (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: 'Please enter a valid email'
      }
    ]
  },
  {
    field: 'password',
    rules: [
      {
        validate: (value: string): boolean => Boolean(value),
        message: 'Password is required'
      }
    ]
  }
];

export const validatePaymentInit: ValidationRule[] = [
  {
    field: 'amount',
    rules: [
      {
        validate: (value: string): boolean => [70, 100, 1000].includes(Number(value)),
        message: 'Amount must be either 70, 100, or 1000 Lendi'
      }
    ]
  },
  {
    field: 'cryptoType',
    rules: [
      {
        validate: (value: string): boolean => ['BTC', 'ETH', 'SOL'].includes(value.toUpperCase()),
        message: 'Invalid cryptocurrency selected'
      }
    ]
  }
];



export const validateInvestment: ValidationRule[] = [
  {
    field: 'amount',
    rules: [
      {
        validate: (value: string): boolean => [10, 100, 1000].includes(Number(value)),
        message: 'Investment amount must be either $10, $100, or $1000'
      }
    ]
  },
  {
    field: 'duration',
    rules: [
      {
        validate: (value: string): boolean => [30, 60, 90, 180].includes(Number(value)),
        message: 'Duration must be 30, 60, 90, or 180 days'
      }
    ]
  }
];

