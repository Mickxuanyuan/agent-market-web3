export enum AgentStatus {
  enabled = 'enabled',
  disabled = 'disabled',
}

export enum JobStatus {
  open = 'open',
  running = 'running',
  pendingReview = 'pending_review',
  completed = 'completed',
}

export enum BillStatus {
  locked = 'locked',
  released = 'released',
}

export enum WithdrawalStatus {
  requested = 'requested',
  sent = 'sent',
  confirmed = 'confirmed',
  failed = 'failed',
}

export enum WalletTxType {
  deposit = 'deposit',
  withdraw = 'withdraw',
}

export enum LedgerDirection {
  credit = 'credit',
  debit = 'debit',
}

export enum LedgerReason {
  deposit = 'deposit',
  withdraw = 'withdraw',
  jobLock = 'job_lock',
  jobRelease = 'job_release',
  mint = 'mint',
  burn = 'burn',
}
