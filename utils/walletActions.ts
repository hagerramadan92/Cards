// utils/walletActions.ts
interface DepositRequest {
  amount: number;
  payment_method: string; // 'credit_card' | 'bank_transfer' | etc.
}

interface WithdrawRequest {
  amount: number;
  bank_account_id: string;
}

export async function depositToWallet(data: DepositRequest) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/wallet/deposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Deposit error:', error);
    throw error;
  }
}

export async function withdrawFromWallet(data: WithdrawRequest) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/wallet/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'accept-language': `${navigator.language || 'en-US'}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Withdrawal error:', error);
    throw error;
  }
}