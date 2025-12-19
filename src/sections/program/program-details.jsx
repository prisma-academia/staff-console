import * as React from 'react';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import Modal from '@mui/material/Modal';
import Button from '@mui/material/Button';
import Backdrop from '@mui/material/Backdrop';
import LoadingButton from '@mui/lab/LoadingButton';
import { Stack, TextField, Typography, IconButton } from '@mui/material';

import config from 'src/config';
import { useAuthStore } from 'src/store';

import Iconify from 'src/components/iconify';
import CustomSelect from 'src/components/old-select/select';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 3,
  bgColor: 'red',
};
const roles = [
  { name: 'Staff', value: 'staff' },
  { name: 'Staff Admin', value: 'staff admin' },
];

export default function EditProgram({ open, setOpen, obj }) {
  const [firstName, setFirstName] = useState(obj.firstName);
  const [lastName, setLastName] = useState(obj.lastName);
  const [email, setEmail] = useState(obj.email);
  const [employeeId, setEmployeeId] = useState(obj.employeeId);
  const [accessLevel, setAccessLevel] = useState(obj.accessLevel);
  const [role, setRole] = useState(obj.role);

  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();


  const updateUser = async (credentials) => {
    const response = await fetch(`${config.baseUrl}/api/v1/user/${obj.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(errorMessage);
    }

    const result = await response.json();
    if (result.ok) {
      return result.data;
    }
    throw new Error(result.message);
  };
  const suspendUser = async (credentials) => {
    const response = await fetch(`${config.baseUrl}/api/v1/user/${  obj.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(errorMessage);
    }

    const result = await response.json();
    if (result.ok) {
      return result.data;
    }
    throw new Error(result.message);
  };
  const { data, mutate, isError, error, isPending } = useMutation({ mutationFn: updateUser,
    onSuccess:()=> queryClient.invalidateQueries({ queryKey: ['users'] })

  });
  const handleClose = () => setOpen(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleSubmit = async () => {
    try {
      if (!firstName || !lastName || !email || !employeeId || !accessLevel || !role) {
        enqueueSnackbar({ message: 'All fields are required', variant: 'error' });
      } else {
        mutate({ firstName, lastName, email, employeeId, accessLevel, role });
      }
    } catch (err) {
      enqueueSnackbar({ message: err.message });
    }
  };
  const handleSuspend = async (status) => {
    try {
      await suspendUser({status})
      enqueueSnackbar({ message: 'Operation Successful', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['users'] })
      handleClose();
    } catch (err) {
      enqueueSnackbar({ message: err.message });
    }
  };
  useEffect(() => {
    if (isError) {
      enqueueSnackbar({ message: error.message, variant: 'error' });
      return;
    }
    if (data) {
      enqueueSnackbar({ message: 'User updated successfully', variant: 'success' });
      handleClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, isError]);


  return (
    <div>
      {/* <Button
        onClick={() => setOpen(true)}
        variant="contained"
        color="inherit"
        startIcon={<Iconify icon="eva:plus-fill" />}
      >
        New User
      </Button> */}
      <IconButton onClick={() => setOpen(true)}>
            <Iconify color="navy" icon="carbon:settings-edit"/>
          </IconButton>
      {/* <MenuItem onClick={() => setOpen(true)}>
        <Iconify icon="eva:edit-fill" sx={{ mr: 2 }} />
        Edit
      </MenuItem> */}
      <Modal
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        open={open}
        // onClose={handleClose}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
      >
        <Fade in={open}>
          <Box sx={style}>
            <Stack direction="column" justifyContent="space-between" gap={3}>
              <Typography fontWeight={800} fontSize={20} align="center">
                Update User
              </Typography>
              <Stack direction="row" justifyContent="space-between" spacing={2} mb={1}>
                <TextField
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  label="First Name"
                  size="small"
                />
                <TextField
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  label="Last Name"
                  size="small"
                />
              </Stack>
              <TextField
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                label="Email"
                size="small"
              />
              <TextField
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                label="Staff ID"
                size="small"
              />
              <CustomSelect list={roles} value={role} setValue={setRole} label="Role" />
              <CustomSelect
                list={[
                  { name: 'One', value: 1 },
                  { name: 'Two', value: 2 },
                  { name: 'Three', value: 3 },
                ]}
                value={accessLevel}
                setValue={setAccessLevel}
                label="Access Level"
              />
              <Stack
                direction="column"
                alignItems="center"
                justifyContent="space-between"
                spacing={2}
                mb={1}
              >
                <LoadingButton
                  fullWidth
                  variant="contained"
                  color="inherit"
                  loading={isPending}
                  onClick={handleSubmit}
                >
                  Update
                </LoadingButton>
                <LoadingButton
                  fullWidth
                  variant="contained"
                  color={obj.status === "active"?"error":"success"}
                  loading={isPending}
                  onClick={()=>handleSuspend(obj.status === "active"?"disable":"active")}
                >
                  {obj.status === "active"?"Suspend":"Activate"}
                </LoadingButton>
                <Button fullWidth onClick={handleClose} variant="outlined" color="inherit">
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Fade>
      </Modal>
    </div>
  );
}
EditProgram.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  obj: PropTypes.object,
};
