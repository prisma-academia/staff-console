import React from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';

import { Grid, Container, Typography } from '@mui/material';

import config from 'src/config';
import { AnalyticsApi } from 'src/api';

import AppWidgetSummary from '../app-widget-summary';
import AppCurrentVisits from '../app-current-visits';

export default function DashboardView() {
  const { data, loading } = useSuspenseQuery({
    queryKey: ['analytics'],
    queryFn: AnalyticsApi.getAnalytics,
  });

  // useEffect(() => {
  //   console.log({data})
  // }, [data])

  const { users, programs, payments, demographics, loginTrends } = data;

  if (loading) {
    return (
      <Typography variant="h4" sx={{ mb: 5 }}>
        Loading .....
      </Typography>
    );
  }
  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 5 }}>
        Dashboard Overview
      </Typography>

      <Grid container spacing={3}>
        {/* Total Admissions */}
        <Grid item xs={12} sm={6} md={3}>
          <AppWidgetSummary
            title="Total Admissions"
            total={users.totalUsers}
            color="success"
            icon={<img alt="admissions-icon" src={config.utils.buildImageUrl(config.assets.icons.dashboard, 'ic_documents.svg')} />}
          />
        </Grid>

        {/* Total Programs */}
        <Grid item xs={12} sm={6} md={3}>
          <AppWidgetSummary
            title="Total Programs"
            total={programs.totalPrograms}
            color="info"
            icon={<img alt="programs-icon" src={config.utils.buildImageUrl(config.assets.icons.dashboard, 'ic_documents.svg')} />}
          />
        </Grid>

        {/* Total Payments */}
        <Grid item xs={12} sm={6} md={3}>
          <AppWidgetSummary
            title="Total Payments"
            total={payments.totalPayments}
            color="primary"
            icon={<img alt="payments-icon" src="/assets/icons/dashboard/ic_documents.svg" />}
          />
        </Grid>

        {/* Total Revenue */}
        <Grid item xs={12} sm={6} md={3}>
          <AppWidgetSummary
            title="Total Revenue"
            total={`₦${payments.totalRevenue.toLocaleString()}`}
            color="warning"
            icon={<img alt="revenue-icon" src="/assets/icons/dashboard/ic_documents.svg" />}
          />
        </Grid>

        {/* Age Distribution */}
        <Grid item xs={12} sm={6} md={3}>
          <AppWidgetSummary
            title="10-20 Age Group"
            total={demographics.ageDistribution.find((age) => age._id === 10)?.count || 0}
            color="info"
            icon={<img alt="age-icon" src="/assets/icons/dashboard/ic_documents.svg" />}
          />
        </Grid>

        {/* Pending Payments */}
        <Grid item xs={12} sm={6} md={3}>
          <AppWidgetSummary
            title="Pending Payments"
            total={payments.paymentStatus.find((status) => status._id === 'Pending')?.count || 0}
            color="danger"
            icon={<img alt="pending-icon" src="/assets/icons/dashboard/ic_documents.svg" />}
          />
        </Grid>

        {/* Login Trends */}
        <Grid item xs={12} sm={6} md={3}>
          <AppWidgetSummary
            title="Daily Logins"
            total={loginTrends.daily.reduce((sum, login) => sum + login.count, 0)}
            color="success"
            icon={<img alt="login-icon" src="/assets/icons/dashboard/ic_documents.svg" />}
          />
        </Grid>

        <Grid xs={12} md={6} lg={4}>
          <AppCurrentVisits
            title="Programme Enrollment"
            chart={{
              series: data.programs.programEnrollment.map((program) => ({
                label: program.programName,
                value: program.count,
              })),
            }}
          />
        </Grid>

        <Grid xs={12} md={6} lg={4}>
          <AppCurrentVisits
            title="Gender Distribution per Programme"
            chart={{
              series: data.programs.programGenderDistribution.map((item) => ({
                label: `${item.programName} (${item.gender})`,
                value: item.count,
              })),
            }}
          />
        </Grid>

        <Grid xs={12} md={6} lg={4}>
          <AppCurrentVisits
            title="Gender Distribution"
            chart={{
              series: data.users.genderDistribution.map((item) => ({
                label: item._id,
                value: item.count,
              })),
            }}
          />
        </Grid>
      </Grid>
    </Container>
  );
}
