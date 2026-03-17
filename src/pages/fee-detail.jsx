import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import config from 'src/config';
import { FeeApi } from 'src/api';

import Iconify from 'src/components/iconify';

import FeeDetailsContent from 'src/sections/fee/fee-details-content';

export default function FeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['fee', id],
    queryFn: () => FeeApi.getFeeById(id),
    enabled: !!id,
  });

  const feeDetails = data?.data ?? data;

  return (
    <>
      <Helmet>
        <title>Fee Details | {config.appName}</title>
      </Helmet>
      <Container maxWidth="xl">
        <Box sx={{ pb: 5, pt: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Button
              startIcon={<Iconify icon="eva:arrow-back-fill" />}
              onClick={() => navigate('/fee')}
            >
              Back
            </Button>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Fee Details
            </Typography>
          </Box>
          <FeeDetailsContent feeDetails={feeDetails} isLoading={isLoading} />
        </Box>
      </Container>
    </>
  );
}
