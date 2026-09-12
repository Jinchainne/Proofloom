import { createClient } from 'genlayer-js';
import { testnetBradbury } from 'genlayer-js/chains';

export async function readBounty(address: `0x${string}`, bountyId: number) {
  const client = createClient({ chain: testnetBradbury });
  return client.readContract({ address, functionName: 'get_bounty', args: [bountyId] });
}

export async function createBounty(provider: EIP1193Provider, address: `0x${string}`, account: `0x${string}`, claim: string, evidenceUrl: string) {
  const client = createClient({ chain: testnetBradbury, account, provider });
  await client.connect('testnetBradbury');
  const write = { address, functionName: 'create_bounty', args: [claim, evidenceUrl] } as const;
  const estimate = await client.estimateTransactionFeesForWrite(write);
  const hash = await client.writeContract({ ...write, fees: { distribution: estimate.distribution, feeValue: estimate.feeValue } });
  return client.waitForFinalization({ hash });
}

export interface EIP1193Provider { request(args: { method: string; params?: unknown[] }): Promise<unknown>; }
