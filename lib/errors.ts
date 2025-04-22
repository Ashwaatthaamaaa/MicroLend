export class LoanError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'LoanError'
  }
}

export class ValidationError extends LoanError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class ContractError extends LoanError {
  constructor(message: string, details?: any) {
    super(message, 'CONTRACT_ERROR', details)
    this.name = 'ContractError'
  }
}

export class NotFoundError extends LoanError {
  constructor(message: string) {
    super(message, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
} 