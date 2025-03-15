export const generateReference = (): string => {
    return `ROL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };
  