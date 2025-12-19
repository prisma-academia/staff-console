import { Helmet } from 'react-helmet-async';

import { PaymentView } from 'src/sections/payment/view';

// ----------------------------------------------------------------------

export default function PaymentPage() {
  return (
    <>
      <Helmet>
        <title> Payments | AB NAIBI Admission </title>
      </Helmet>

      <PaymentView />
    </>
  );
}