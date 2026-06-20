'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

interface PayButtonProps {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PayButton({
  orderId,
  amount,
  customerName,
  customerEmail,
  customerPhone,
}: PayButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handlePay = async () => {
    setLoading(true);
    setError('');

    try {
      const orderRes = await fetch('/api/payments/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency: 'INR', dbOrderId: orderId }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        setError(orderData.error || 'Could not start payment');
        setLoading(false);
        return;
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Srilaya Millets',
        description: `Order #${orderId.slice(0, 8).toUpperCase()}`,
        order_id: orderData.orderId,
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone,
        },
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/payments/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                dbOrderId: orderId,
              }),
            });

            if (verifyRes.ok) {
              router.push(`/orders/${orderId}`);
            } else {
              setError('Payment was received but verification failed. Please contact support with your payment ID: ' + response.razorpay_payment_id);
            }
          } catch {
            setError('Payment was received but we could not confirm it automatically. Please contact support with your payment ID: ' + response.razorpay_payment_id);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          }
        },
        theme: {
          color: '#4F46E5',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      setError('Something went wrong starting payment');
      setLoading(false);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400"
      >
        {loading ? 'Opening payment...' : `Pay ₹${amount.toFixed(2)}`}
      </button>

      {error && (
        <p className="text-red-600 text-sm mt-4">{error}</p>
      )}
    </>
  );
}