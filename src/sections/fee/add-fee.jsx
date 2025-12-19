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
  Select,
  Button,
  Divider,
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

import Iconify from 'src/components/iconify';
import CustomSelect from 'src/components/select';

import { FeeApi, UserApi, programApi, classLevelApi } from '../../api';

const FEE_TYPE = [
  { name: 'Tuition', _id: 'Tuition' },
  { name: 'Hostel', _id: 'Hostel' },
  { name: 'Laboratory', _id: 'Laboratory' },
  { name: 'Others', _id: 'Others' },
];

const AddFee = ({ open, setOpen }) => {
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
    queryFn: UserApi.getStudents,
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

  const { mutate, isPending } = useMutation({
    mutationFn: FeeApi.createFee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      enqueueSnackbar({ message: 'Fee added successfully', variant: 'success' });
      formik.resetForm();
      setOpen(false);
    },
    onError: (error) => {
      const errorMessage = error.message || 'An error occurred while creating the fee';
      enqueueSnackbar({ message: errorMessage, variant: 'error' });
    },
  });

  const validationSchema = Yup.object({
    name: Yup.string().required('Fee name is required'),
    description: Yup.string(),
    amount: Yup.number().required('Amount is required'),
    dueDate: Yup.date().required('Due date is required'),
    programs: Yup.array().required('Program(s) are required'),
    classLevels: Yup.array().required('Class level(s) are required'),
    feeType: Yup.string().required('Fee type is required'),
    status: Yup.string(),
    students: Yup.array().of(Yup.string()),
    users: Yup.array().of(Yup.string()),
  });

  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
      amount: '',
      dueDate: '',
      programs: [],
      classLevels: [],
      feeType: '',
      status: '',
      currentItem: { name: '', quantity: '', price: '' },
      items: [],
      students: [],
      users: [],
    },
    validationSchema,
    onSubmit: (values) => {
      const { students, users, ...rest } = values;
      const payload = {
        ...rest,
        students: students.filter((student) => student && student.trim() !== ''),
        users: users.filter((user) => user && user.trim() !== ''),
      };
      mutate(payload);
    },
  });

  const addItem = () => {
    const { name, quantity, price } = formik.values.currentItem;
    if (name && quantity && price) {
      formik.setFieldValue('items', [...formik.values.items, formik.values.currentItem]);
      formik.setFieldValue('currentItem', { name: '', quantity: '', price: '' });
    }
  };

  const handleModalClose = () => {
    setOpen(false);
    formik.resetForm(); // Reset form when modal closes
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
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="contained"
        color="inherit"
        startIcon={<Iconify icon="eva:plus-fill" />}
      >
        New Fee
      </Button>
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
              Add New Fee
            </Typography>
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
                      helperText={formik.touched.amount && formik.errors.amount}
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
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <CustomSelect
                      data={programOptions}
                      label="Program(s)"
                      name="programs"
                      formik={formik}
                      multiple
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <CustomSelect
                      data={classLevelOptions}
                      label="ClassLevel(s)"
                      name="classLevels"
                      formik={formik}
                      multiple
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
                      disabled={!formattedStudentOptions.length}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {/* <CustomSelect
                      disabled={true}
                      data={formattedStudentOptions}
                      label="User(s)"
                      name="users"
                      formik={formik}
                      multiple
                      showSelectedCount
                      // disabled={!formattedStudentOptions.length}
                    /> */}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <CustomSelect data={FEE_TYPE} label="Fee Type" name="feeType" formik={formik} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl
                      fullWidth
                      error={formik.touched.status && Boolean(formik.errors.status)}
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
                  <Divider sx={{ my: 5 }} />

                  <div>
                    <Typography variant="h6" gutterBottom>
                      Items
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

                    <TableContainer
                      component={Paper}
                      sx={{ marginTop: 2, borderRadius: 2, boxShadow: 1 }}
                    >
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
                          {formik.values.items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.name}</TableCell>
                              <TableCell align="center">{item.quantity}</TableCell>
                              <TableCell align="center">{item.price}</TableCell>
                              <TableCell align="center">
                                <IconButton
                                  color="error"
                                  onClick={() => {
                                    const updatedItems = formik.values.items.filter(
                                      (_, i) => i !== index
                                    );
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
                  </div>
                </Grid>

                <Stack direction="row" justifyContent="flex-end" spacing={2} mt={4}>
                  <Button onClick={handleModalClose}>Cancel</Button>
                  <LoadingButton loading={isPending} variant="contained" type="submit">
                    Add Fee
                  </LoadingButton>
                </Stack>
              </Stack>
            </Box>
          </Box>
        </Fade>
      </Modal>
    </>
  );
};

AddFee.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
};

export default AddFee;
