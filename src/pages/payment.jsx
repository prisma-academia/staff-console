import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { PaymentView } from 'src/sections/payment/view';

// ----------------------------------------------------------------------

export default function PaymentPage() {
  return (
    <>
      <Helmet>
        <title>Payments | {config.appName}</title>
      </Helmet>

      <PaymentView />
    </>
  );
}