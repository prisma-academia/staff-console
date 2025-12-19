// import * as React from 'react';
// import { useEffect } from 'react';
// import PropTypes from 'prop-types';
// import { useSnackbar } from 'notistack';
// import { useMutation, useQueryClient } from '@tanstack/react-query';

// import Box from '@mui/material/Box';
// import Fade from '@mui/material/Fade';
// import Modal from '@mui/material/Modal';
// import Button from '@mui/material/Button';
// import Backdrop from '@mui/material/Backdrop';
// import LoadingButton from '@mui/lab/LoadingButton';
// import { Stack, MenuItem, TextField, Typography } from '@mui/material';

// import config from 'src/config';
// import { useAuthStore } from 'src/store';

// import Iconify from 'src/components/iconify';

// import {stateList} from '../../assets/state-list'

// const style = {
//   position: 'absolute',
//   top: '50%',
//   left: '50%',
//   transform: 'translate(-50%, -50%)',
//   width: 400,
//   bgcolor: 'background.paper',
//   border: '2px solid #000',
//   boxShadow: 24,
//   p: 3,
//   bgColor: 'red',
// };

// const roles = [
//   { name: 'Staff', value: 'staff' },
//   { name: 'Coordinator', value: 'state admin' },
//   { name: 'QA', value: 'qa' },
// ];


// export default function AddProgram({ open, setOpen }) {
//   const [selectedState, setSelectedState] = React.useState('');
//   const [selectedLGA, setSelectedLGA] = React.useState('');
//   const [isSubmitting, setIsSubmitting] = React.useState(false);
//   const token = useAuthStore((store) => store.token);
//   const queryClient = useQueryClient();
//   const { enqueueSnackbar } = useSnackbar();

//   const createUser = async (credentials) => {
//     const response = await fetch(`${config.baseUrl}/api/v1/users/register`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify(credentials),
//     });

//     if (!response.ok) {
//       const errorMessage = await response.text();
//       throw new Error(errorMessage);
//     }

//     const result = await response.json();
//     if (result.ok) {
//       return result.data;
//     }
//     throw new Error(result.message);
//   };

//   const { mutate } = useMutation(addProgram, {
//     onSuccess: () => {
//       queryClient.invalidateQueries(['programs']);
//       enqueueSnackbar('Program added successfully', { variant: 'success' });
//       setOpen(false);
//     },
//     onError: (error) => {
//       enqueueSnackbar(error.message || 'An error occurred', { variant: 'error' });
//     },
//   });

//   const validationSchema = Yup.object({
//     name: Yup.string().required('Program name is required'),
//     code: Yup.string().required('Program code is required'),
//     department: Yup.string(),
//     durationInYears: Yup.number().required('Duration in years is required'),
//     totalCreditsRequired: Yup.number().required('Total credits required is necessary'),
//   });

//   const formik = useFormik({
//     initialValues: {
//       name: '',
//       code: '',
//       department: '',
//       durationInYears: '',
//       totalCreditsRequired: '',
//     },
//     validationSchema,
//     onSubmit: (values) => {
//       mutate(values);
//     },
//   });

//   const handleClose = () => {
//     setOpen(false);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const formData = new FormData(e.target);
//     const fullName = formData.get('fullName');
//     const phoneNumber = formData.get('phoneNumber');
//     const email = formData.get('email');
//     const state = formData.get('state');
//     const lga = formData.get('lga');
//     const role = formData.get('role');
//     if (!fullName || !phoneNumber || !email || !state || !lga || !role) {
//       enqueueSnackbar({ message: 'All fields are required', variant: 'error' });
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       mutate({ fullName, phoneNumber, email, state, lga, role });
//     } catch (err) {
//       enqueueSnackbar({ message: err.message, variant: 'error' });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   useEffect(() => {
//     if (isError) {
//       enqueueSnackbar({ message: error.message, variant: 'error' });
//     }
//   }, [isError, error, enqueueSnackbar]);

//   const handleStateChange = (e) => {
//     setSelectedState(e.target.value);
//     setSelectedLGA('');
//   };

//   const lgas = selectedState ? stateList.find(state => state.state === selectedState).lgas : [];

//   return (
//     <div>
//       <Button
//         onClick={() => setOpen(true)}
//         variant="contained"
//         color="inherit"
//         startIcon={<Iconify icon="eva:plus-fill" />}
//       >
//         New Program
//       </Button>
//       <Modal
//         aria-labelledby="transition-modal-title"
//         aria-describedby="transition-modal-description"
//         open={open}
//         closeAfterTransition
//         slots={{ backdrop: Backdrop }}
//         slotProps={{
//           backdrop: {
//             timeout: 500,
//           },
//         }}
//       >
//         <Fade in={open}>
//           <Box sx={style}>
//             <Box component="form" onSubmit={handleSubmit}>
//               <Stack direction="column" justifyContent="space-between" gap={3}>
//                 <Typography fontWeight={800} fontSize={20} align="center">
//                   New Program
//                 </Typography>
//                 <TextField name="fullName" label="Full Name" size="small" />
//                 <TextField name="phoneNumber" label="Phone Number" size="small" />
//                 <TextField name="email" type="email" label="Email" size="small" />
//                 <TextField name="role" label="Role" size="small" select>
//                   <MenuItem disabled value="">
//                     <em>None</em>
//                   </MenuItem>
//                   {roles.map((role) => (
//                     <MenuItem key={role.value} value={role.value}>
//                       {role.name}
//                     </MenuItem>
//                   ))}
//                 </TextField>
//                 <TextField 
//                   name="state" 
//                   label="State" 
//                   size="small" 
//                   select 
//                   value={selectedState} 
//                   onChange={handleStateChange}
//                 >
//                   <MenuItem disabled value="">
//                     <em>None</em>
//                   </MenuItem>
//                   {stateList.map((li) => (
//                     <MenuItem key={li.state} value={li.state}>
//                       {li.state}
//                     </MenuItem>
//                   ))}
//                 </TextField>
//                 <TextField 
//                   name="lga" 
//                   label="LGA" 
//                   size="small" 
//                   select 
//                   value={selectedLGA}
//                   onChange={(e) => setSelectedLGA(e.target.value)}
//                 >
//                   <MenuItem disabled value="">
//                     <em>None</em>
//                   </MenuItem>
//                   {lgas.map((lga) => (
//                     <MenuItem key={lga} value={lga}>
//                       {lga}
//                     </MenuItem>
//                   ))}
//                 </TextField>
//                 <Stack
//                   direction="column"
//                   alignItems="center"
//                   justifyContent="space-between"
//                   spacing={2}
//                   mb={1}
//                 >
//                   <LoadingButton
//                     fullWidth
//                     variant="contained"
//                     color="inherit"
//                     loading={isSubmitting}
//                     type="submit"
//                   >
//                     Add program
//                   </LoadingButton>
//                   <Button fullWidth onClick={handleClose} variant="outlined" color="inherit">
//                     Cancel
//                   </Button>
//                 </Stack>
//               </Stack>
//             </Box>
//           </Box>
//         </Fade>
//       </Modal>
//     </div>
//   );
// }

// AddProgram.propTypes = {
//   open: PropTypes.bool.isRequired,
//   setOpen: PropTypes.func.isRequired,
// };

import React from 'react';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Grid,
  Fade,
  Modal,
  Stack,
  Button,
  useTheme,
  Backdrop,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';

import config from 'src/config';

import Iconify from 'src/components/iconify';

const AddProgram = ({ open, setOpen }) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const addProgram = async (programData) => {
    const response = await fetch(`${config.baseUrl}/api/v1/program`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(programData),
    });
    
    if (!response.ok) {
      throw new Error(await response.text());
    }
    
    return response.json();
  };

  const { mutate } = useMutation({
    mutationFn: addProgram,
    onSuccess: () => {
      queryClient.invalidateQueries(['programs']);
      enqueueSnackbar('Program added successfully', { variant: 'success' });
      setOpen(false);
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'An error occurred', { variant: 'error' });
    },
  });

  const validationSchema = Yup.object({
    name: Yup.string().required('Program name is required'),
    code: Yup.string().required('Program code is required'),
    department: Yup.string(),
    durationInYears: Yup.number().required('Duration in years is required'),
    totalCreditsRequired: Yup.number().required('Total credits required is necessary'),
  });

  const formik = useFormik({
    initialValues: {
      name: '',
      code: '',
      department: '',
      durationInYears: '',
      totalCreditsRequired: '',
    },
    validationSchema,
    onSubmit: (values) => {
      mutate(values);
    },
  });

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: isMobile ? '90%' : '60%',
    maxWidth: '600px',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    maxHeight: '90vh',
    overflow: 'auto',
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="contained" color="inherit" startIcon={<Iconify icon="eva:plus-fill" />}>
        New Program
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} closeAfterTransition BackdropComponent={Backdrop} BackdropProps={{ timeout: 500 }}>
        <Fade in={open}>
          <Box sx={modalStyle}>
            <Typography variant="h5" align="center" gutterBottom>
              Add New Program
            </Typography>
            <Box component="form" onSubmit={formik.handleSubmit}>
              <Stack spacing={3}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField label="Program Name" name="name" fullWidth value={formik.values.name} onChange={formik.handleChange} error={formik.touched.name && Boolean(formik.errors.name)} helperText={formik.touched.name && formik.errors.name} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField label="Program Code" name="code" fullWidth value={formik.values.code} onChange={formik.handleChange} error={formik.touched.code && Boolean(formik.errors.code)} helperText={formik.touched.code && formik.errors.code} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField label="Department" name="department" fullWidth value={formik.values.department} onChange={formik.handleChange} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Duration (Years)" name="durationInYears" type="number" fullWidth value={formik.values.durationInYears} onChange={formik.handleChange} error={formik.touched.durationInYears && Boolean(formik.errors.durationInYears)} helperText={formik.touched.durationInYears && formik.errors.durationInYears} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Total Credits Required" name="totalCreditsRequired" type="number" fullWidth value={formik.values.totalCreditsRequired} onChange={formik.handleChange} error={formik.touched.totalCreditsRequired && Boolean(formik.errors.totalCreditsRequired)} helperText={formik.touched.totalCreditsRequired && formik.errors.totalCreditsRequired} />
                  </Grid>
                </Grid>
                <Stack direction="row" justifyContent="flex-end" spacing={2}>
                  <Button onClick={() => setOpen(false)}>Cancel</Button>
                  <LoadingButton loading={formik.isSubmitting} variant="contained" type="submit">
                    Add Program
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

AddProgram.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
};

export default AddProgram;
