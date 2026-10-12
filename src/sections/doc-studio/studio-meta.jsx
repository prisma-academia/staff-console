import PropTypes from 'prop-types';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export const CHANNEL_META = {
  print: { label: 'Document', plural: 'Documents', icon: 'mdi:file-document-outline', color: 'primary', blurb: 'PDFs people download and print' },
  web: { label: 'Public page', plural: 'Public pages', icon: 'mdi:web', color: 'info', blurb: 'What the QR codes open' },
  email: { label: 'Email', plural: 'Emails', icon: 'mdi:email-outline', color: 'secondary', blurb: 'Sent automatically' },
  sms: { label: 'SMS', plural: 'Text messages', icon: 'mdi:message-text-outline', color: 'success', blurb: 'Texted to phones' },
};

export const CHANNEL_ORDER = ['print', 'web', 'email', 'sms'];

const STATUS = {
  default: { label: 'Using default', color: 'default', icon: 'mdi:package-variant-closed' },
  draft: { label: 'Draft — not live', color: 'warning', icon: 'mdi:pencil-outline' },
  published: { label: 'Published', color: 'success', icon: 'mdi:check-circle-outline' },
  changes: { label: 'Unpublished changes', color: 'warning', icon: 'mdi:pencil-circle-outline' },
};

export function StatusChip({ status, version }) {
  const meta = STATUS[status] || STATUS.default;
  let { label } = meta;
  if (status === 'published' && version) label = `Live · v${version}`;
  if (status === 'changes' && version) label = `v${version} + changes`;
  return (
    <Label color={meta.color} startIcon={<Iconify icon={meta.icon} />} sx={{ flexShrink: 0 }}>
      {label}
    </Label>
  );
}

StatusChip.propTypes = { status: PropTypes.string, version: PropTypes.number };
