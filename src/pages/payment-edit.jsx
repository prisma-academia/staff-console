import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import EditPaymentPage from 'src/sections/payment/edit-payment-page';

// ----------------------------------------------------------------------

export default function PaymentEditPage() {
  return (
    <>
      <Helmet>
        <title>Edit payment | {config.appName}</title>
      </Helmet>

      <EditPaymentPage />
    </>
  );
}
