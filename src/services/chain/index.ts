import { config } from '../../config/index.js';
import { SimulatedAdapter } from './simulated.adapter.js';
import { SorobanAdapter } from './soroban.adapter.js';
import type { ChainAdapter } from './types.js';

let adapterInstance: ChainAdapter | null = null;

export function getChainAdapter(): ChainAdapter {
  if (adapterInstance) {
    return adapterInstance;
  }

  const selectedAdapter = process.env.SOROBAN_ADAPTER || config.sorobanAdapter || 'simulated';

  if (selectedAdapter === 'soroban') {
    adapterInstance = new SorobanAdapter();
  } else {
    adapterInstance = new SimulatedAdapter();
  }

  return adapterInstance;
}

export function resetChainAdapter(): void {
  adapterInstance = null;
}

export { SimulatedAdapter } from './simulated.adapter.js';
export { SorobanAdapter } from './soroban.adapter.js';
export type {
  ChainAdapter,
  AnchorEventInput,
  AnchorResult,
  ReleaseEscrowInput,
  EscrowResult,
  ChainEventCursor,
  ChainTxReceipt,
  ChainErrorCode,
} from './types.js';
