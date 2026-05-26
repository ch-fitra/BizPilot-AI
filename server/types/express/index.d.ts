declare namespace Express {
  export interface Request {
    user?: any;
    businessId?: string | null;
  }
}
