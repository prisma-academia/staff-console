import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import NewPaymentWizard from 'src/sections/payment/new-payment-wizard';

// ----------------------------------------------------------------------

export default function PaymentNewPage() {
  return (
    <>
      <Helmet>
        <title>New payment | {config.appName}</title>
      </Helmet>

      <NewPaymentWizard />
    </>
  );
}
