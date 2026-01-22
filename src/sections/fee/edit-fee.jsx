import * as Yup from 'yup';
import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Add, Delete } from '@mui/icons-material';
import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Grid,
  Fade,
  Modal,
  Stack,
  Table,
  Paper,
  Alert,
  Select,
  Button,
  Divider,
  Tooltip,
  Backdrop,
  useTheme,
  MenuItem,
  TableRow,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  InputLabel,
  IconButton,
  FormControl,
  useMediaQuery,
  FormHelperText,
  TableContainer,
} from '@mui/material';

import { FeeApi, StudentApi, programApi, classLevelApi } from 'src/api';

import CustomSelect from 'src/components/select';

const FEE_TYPE = [
  { name: 'Tuition', _id: 'Tuition' },
  { name: 'Hostel', _id: 'Hostel' },
  { name: 'Laboratory', _id: 'Laboratory' },
  { name: 'Others', _id: 'Others' },
];

const SEMESTER_OPTIONS = [
  { name: 'First Semester', _id: 'First Semester' },
  { name: 'Second Semester', _id: 'Second Semester' },
];

const GATEWAY_OPTIONS = [
  { name: 'Paystack', _id: 'Paystack' },
  { name: 'Flutterwave', _id: 'Flutterwave' },
  { name: 'Paypal', _id: 'Paypal' },
  { name: 'Stripe', _id: 'Stripe' },
];

const EditFee = ({ open, setOpen, fee }) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { data: programOptions } = useQuery({
    queryKey: ['programs'],
    queryFn: programApi.getPrograms,
  });

  const { data: classLevelOptions } = useQuery({
    queryKey: ['classlevel'],
    queryFn: classLevelApi.getClassLevels,
  });

  const { data: studentOptions } = useQuery({
    queryKey: ['students'],
    queryFn: () => StudentApi.getStudents(),
  });

  const formattedStudentOptions = useMemo(() => {
    if (!studentOptions) {
      return [];
    }

    return studentOptions.map((student) => {
      const identifier = student?._id || student?.id;
      const regNumber = student?.regNumber || student?.registrationNumber;
      const fullName =
        [student?.firstName, student?.lastName].filter(Boolean).join(' ') ||
        student?.email ||
        identifier;
      const displayName = regNumber ? `${fullName} (${regNumber})` : fullName;

      return {
        _id: identifier,
        name: displayName,
        regNumber,
      };
    });
  }, [studentOptions]);

  const initialValues = useMemo(
    () => ({
      name: fee?.name || '',
      description: fee?.description || '',
      amount: fee?.amount ?? '',
      dueDate: fee?.dueDate ? fee.dueDate.slice(0, 10) : '',
      programs: (fee?.programs || []).map((program) => program?._id || program?.id || program),
      classLevels: (fee?.classLevels || []).map(
        (level) => level?._id || level?.id || level
      ),
      feeType: fee?.feeType || '',
      status: fee?.status || '',
      semester: fee?.semester || '',
      gateway: (() => {
        if (Array.isArray(fee?.gateway)) {
          return fee.gateway;
        }
        if (fee?.gateway) {
          return [fee.gateway];
        }
        return ['Paystack'];
      })(),
      items: fee?.items || [],
      currentItem: { name: '', quantity: '', price: '' },
      students: (fee?.students || fee?.studentIds || []).map((student) =>
        typeof student === 'string' ? student : student?._id || student?.id
      ),
      users: (fee?.users || []).map((user) =>
        typeof user === 'string' ? user : user?._id || user?.id
      ),
    }),
    [fee]
  );

  // Check if fee has completed payments (restriction check)
  const hasCompletedPayments = useMemo(() => {
    if (!fee) return false;
    const paymentMade = fee?.payment?.made || 0;
    const completedPayments = fee?.payment?.completedPayments || [];
    return paymentMade > 0 || completedPayments.length > 0;
  }, [fee]);

  const validationSchema = Yup.object({
    name: Yup.string().required('Fee name is required'),
    description: Yup.string(),
    amount: Yup.number().nullable(),
    items: Yup.array().of(
      Yup.object().shape({
        name: Yup.string().required('Item name is required'),
        quantity: Yup.number().required('Quantity is required').min(0.01, 'Quantity must be greater than 0'),
        price: Yup.number().required('Price is required').min(0, 'Price must be non-negative'),
      })
    ),
    dueDate: Yup.date().required('Due date is required'),
    programs: Yup.array().required('Program(s) are required'),
    classLevels: Yup.array().required('Class level(s) are required'),
    feeType: Yup.string().required('Fee type is required'),
    status: Yup.string(),
    semester: Yup.string().oneOf(['First Semester', 'Second Semester'], 'Invalid semester'),
    gateway: Yup.array().of(Yup.string().oneOf(['Paystack', 'Flutterwave', 'Paypal', 'Stripe'], 'Invalid gateway')),
    students: Yup.array().of(Yup.string()),
    users: Yup.array().of(Yup.string()),
  }).test('amount-or-items', 'Either amount or items array must be provided', function testAmountOrItems(value) {
    const { amount, items } = value;
    const hasAmount = amount !== '' && amount !== null && amount !== undefined && !Number.isNaN(Number(amount));
    const hasItems = items && Array.isArray(items) && items.length > 0;
    
    if (!hasAmount && !hasItems) {
      // eslint-disable-next-line react/no-this-in-sfc
      return this.createError({
        path: 'amount',
        message: 'Either amount or items array must be provided',
      });
    }
    
    return true;
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues,
    validationSchema,
    onSubmit: (values) => {
      if (hasCompletedPayments) {
        enqueueSnackbar({
          message: 'Cannot edit fee with completed payments',
          variant: 'error',
        });
        return;
      }
      const { students, users, items, amount, ...rest } = values;
      
      const payload = {
        ...rest,
        students: students.filter((student) => student && student.trim() !== ''),
        users: users.filter((user) => user && user.trim() !== ''),
      };
      
      // If items array is provided and non-empty, omit amount (API will calculate)
      if (items && items.length > 0) {
        payload.items = items.map(item => ({
          name: item.name,
          quantity: Number(item.quantity),
          price: Number(item.price),
        }));
        // Don't include amount - API will calculate it
      } else {
        // If no items, require and send amount
        payload.amount = Number(amount);
      }
      
      mutate({ id: fee?._id, data: payload });
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: ({ id, data }) => FeeApi.updateFee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      enqueueSnackbar({ message: 'Fee updated successfully', variant: 'success' });
      setOpen(false);
    },
    onError: (error) => {
      const errorMessage = error.message || 'An error occurred while updating the fee';
      enqueueSnackbar({ message: errorMessage, variant: 'error' });
    },
  });

  const addItem = () => {
    const { name, quantity, price } = formik.values.currentItem;
    
    // Validate item before adding
    if (!name || !name.trim()) {
      enqueueSnackbar({ message: 'Item name is required', variant: 'error' });
      return;
    }
    
    const numQuantity = Number(quantity);
    const numPrice = Number(price);
    
    if (!quantity || numQuantity <= 0) {
      enqueueSnackbar({ message: 'Quantity must be greater than 0', variant: 'error' });
      return;
    }
    
    if (price === '' || numPrice < 0) {
      enqueueSnackbar({ message: 'Price must be non-negative', variant: 'error' });
      return;
    }
    
    // Add validated item
    formik.setFieldValue('items', [...(formik.values.items || []), {
      name: name.trim(),
      quantity: numQuantity,
      price: numPrice,
    }]);
    formik.setFieldValue('currentItem', { name: '', quantity: '', price: '' });
  };

  const handleModalClose = () => {
    setOpen(false);
    formik.resetForm();
  };

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: isMobile ? '90%' : '60%',
    maxWidth: '800px',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    maxHeight: '90vh',
    overflow: 'auto',
  };

  return (
    <Modal
      open={open}
      onClose={handleModalClose}
      closeAfterTransition
      keepMounted={false}
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 500 } }}
    >
      <Fade in={open}>
        <Box sx={modalStyle}>
          <Typography variant="h5" align="center" gutterBottom>
            Update Fee
          </Typography>
          {hasCompletedPayments && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              This fee has completed payments and cannot be edited. Only fees without completed payments can be modified.
            </Alert>
          )}
          <Box component="form" onSubmit={formik.handleSubmit}>
            <Stack spacing={4}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Fee Name"
                    name="name"
                    fullWidth
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    error={formik.touched.name && Boolean(formik.errors.name)}
                    helperText={formik.touched.name && formik.errors.name}
                    disabled={hasCompletedPayments}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Description"
                    name="description"
                    fullWidth
                    multiline
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    error={formik.touched.description && Boolean(formik.errors.description)}
                    helperText={formik.touched.description && formik.errors.description}
                    disabled={hasCompletedPayments}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Amount"
                    name="amount"
                    type="number"
                    fullWidth
                    value={formik.values.amount}
                    onChange={formik.handleChange}
                    error={formik.touched.amount && Boolean(formik.errors.amount)}
                    helperText={(() => {
                      if (formik.touched.amount && formik.errors.amount) {
                        return formik.errors.amount;
                      }
                      if (formik.values.items.length > 0) {
                        return 'Amount will be calculated from items';
                      }
                      return 'Required if items are not provided';
                    })()}
                    disabled={hasCompletedPayments || formik.values.items.length > 0}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Due Date"
                    name="dueDate"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={formik.values.dueDate}
                    onChange={formik.handleChange}
                    error={formik.touched.dueDate && Boolean(formik.errors.dueDate)}
                    helperText={formik.touched.dueDate && formik.errors.dueDate}
                    disabled={hasCompletedPayments}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <CustomSelect
                    data={programOptions}
                    label="Program(s)"
                    name="programs"
                    formik={formik}
                    multiple
                    disabled={hasCompletedPayments}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomSelect
                    data={classLevelOptions}
                    label="ClassLevel(s)"
                    name="classLevels"
                    formik={formik}
                    multiple
                    disabled={hasCompletedPayments}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomSelect
                    data={formattedStudentOptions}
                    label="Student(s)"
                    name="students"
                    formik={formik}
                    multiple
                    showSelectedCount
                    disabled={!formattedStudentOptions.length || hasCompletedPayments}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomSelect
                    data={formattedStudentOptions}
                    label="User(s)"
                    name="users"
                    formik={formik}
                    multiple
                    showSelectedCount
                    disabled={!formattedStudentOptions.length || hasCompletedPayments}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomSelect
                    data={FEE_TYPE}
                    label="Fee Type"
                    name="feeType"
                    formik={formik}
                    disabled={hasCompletedPayments}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl
                    fullWidth
                    error={formik.touched.status && Boolean(formik.errors.status)}
                    disabled={hasCompletedPayments}
                  >
                    <InputLabel>Status</InputLabel>
                    <Select
                      label="Status"
                      name="status"
                      value={formik.values.status}
                      onChange={formik.handleChange}
                    >
                      <MenuItem value="Pending">Pending</MenuItem>
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Overdue">Overdue</MenuItem>
                    </Select>
                    <FormHelperText>
                      {formik.touched.status && formik.errors.status}
                    </FormHelperText>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomSelect
                    data={SEMESTER_OPTIONS}
                    label="Semester"
                    name="semester"
                    formik={formik}
                    disabled={hasCompletedPayments}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomSelect
                    data={GATEWAY_OPTIONS}
                    label="Payment Gateway(s)"
                    name="gateway"
                    formik={formik}
                    multiple
                    showSelectedCount
                    disabled={hasCompletedPayments}
                  />
                </Grid>
                <Divider sx={{ my: 5, width: '100%' }} />

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Items (Optional - if provided, amount will be auto-calculated)
                  </Typography>

                  <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                      label="Item Name"
                      name="currentItem.name"
                      fullWidth
                      value={formik.values.currentItem.name}
                      onChange={formik.handleChange}
                    />
                    <TextField
                      label="Quantity"
                      name="currentItem.quantity"
                      type="number"
                      fullWidth
                      value={formik.values.currentItem.quantity}
                      onChange={formik.handleChange}
                    />
                    <TextField
                      label="Price"
                      name="currentItem.price"
                      type="number"
                      fullWidth
                      value={formik.values.currentItem.price}
                      onChange={formik.handleChange}
                    />
                    <IconButton color="primary" onClick={addItem}>
                      <Add />
                    </IconButton>
                  </Stack>

                  <TableContainer component={Paper} sx={{ marginTop: 2, borderRadius: 2, boxShadow: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Item Name</TableCell>
                          <TableCell align="center">Quantity</TableCell>
                          <TableCell align="center">Price</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(formik.values.items || []).map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell align="center">{item.quantity}</TableCell>
                            <TableCell align="center">{item.price}</TableCell>
                            <TableCell align="center">
                              <IconButton
                                color="error"
                                onClick={() => {
                                  const updatedItems = formik.values.items.filter((_, i) => i !== index);
                                  formik.setFieldValue('items', updatedItems);
                                }}
                              >
                                <Delete />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>

              <Stack direction="row" justifyContent="flex-end" spacing={2} mt={4}>
                <Button onClick={handleModalClose}>Cancel</Button>
                <Tooltip
                  title={hasCompletedPayments ? 'Cannot update fee with completed payments' : ''}
                >
                  <span>
                    <LoadingButton
                      loading={isPending}
                      variant="contained"
                      type="submit"
                      disabled={hasCompletedPayments}
                    >
                      Update Fee
                    </LoadingButton>
                  </span>
                </Tooltip>
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

EditFee.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  fee: PropTypes.object,
};

export default EditFee;

