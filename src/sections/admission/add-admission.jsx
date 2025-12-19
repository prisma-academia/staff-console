import * as Yup from "yup";
import Papa from "papaparse";
import PropTypes from "prop-types";
import React, { useState } from "react";
import { useSnackbar } from "notistack";
import { useQuery, useMutation } from "@tanstack/react-query";

import LoadingButton from "@mui/lab/LoadingButton";
import {
  Box,
  Fade,
  Modal,
  Stack,
  Table,
  Paper,
  Button,
  Select,
  Backdrop,
  TableRow,
  MenuItem,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  IconButton,
  InputLabel,
  FormControl,
  TableContainer,
} from "@mui/material";

import config from "src/config";
import { programApi } from "src/api";
import { useAuthStore } from "src/store";

import Iconify from "src/components/iconify";

const validationSchema = Yup.object().shape({
  number: Yup.string().required("Number is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  programme: Yup.string().required("Programme is required"),
});

const AddAdmission = ({ open, setOpen }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState([]);
  const [newRow, setNewRow] = useState({
    number: "",
    email: "",
    programme: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiErrors, setApiErrors] = useState([]);
  const { token } = useAuthStore.getState();

  // Fetch program options
  const { data: programs, isLoading: isLoadingPrograms } = useQuery({
    queryKey: ['programs'],
    queryFn: programApi.getPrograms,
  });

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: ({ data }) => {
          const validatedRows = data.map((row, index) => {
            try {
              validationSchema.validateSync(row, { abortEarly: false });
              return { ...row, _error: false, _message: "" };
            } catch (validationError) {
              return {
                ...row,
                _error: true,
                _message: validationError.errors.join(", "),
              };
            }
          });
          setRows(validatedRows);
          enqueueSnackbar("File uploaded successfully", { variant: "success" });
        },
        error: () => {
          enqueueSnackbar("Error reading file. Please try again.", {
            variant: "error",
          });
        },
      });
    }
  };

  const addAdmission = async (dataObj) => {
    const apiVersion = config.apiVersion.startsWith('/') ? config.apiVersion : `/${config.apiVersion}`;
    const response = await fetch(
      `${config.applicationBaseUrl}${apiVersion}/admission/batch`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataObj),
      }
    );
  
    const result = await response.json();
  
    if (!response.ok) {
      // Check if the API returned an errors array and handle it
      if (Array.isArray(result.errors) && result.errors.length > 0) {
        throw new Error(
          `The following errors occurred:\n${result.errors
            .map((err, i) => `${i + 1}. ${err}`)
            .join("\n")}`
        );
      }
  
      throw new Error(result.message || "An error occurred while publishing.");
    }
  
    return result;
  };
  
  const { mutate, isLoading } = useMutation({
    mutationFn: addAdmission,
    onSuccess: () => {
      enqueueSnackbar("Data published successfully", { variant: "success" });
      setRows([]);
      setIsProcessing(false);
      setOpen(false);
      setApiErrors([])
    },
    onError: (error) => {
      console.log({error})
      setApiErrors([error.message]);
      enqueueSnackbar(error.message, { variant: "error" });
      setIsProcessing(false);
    },
  });

  const handlePublish = () => {
    setApiErrors([]);
    setIsProcessing(true);
    const validData = rows.filter((row) => !row._error);
    if (validData.length === 0) {
      enqueueSnackbar("No valid rows to publish.", { variant: "error" });
      setIsProcessing(false);
      return;
    }
    mutate(validData);
  };

  const handleAddRow = () => {
    try {
      validationSchema.validateSync(newRow, { abortEarly: false });
      setRows([...rows, { ...newRow, _error: false, _message: "" }]);
      setNewRow({ number: "", email: "", programme: "" });
      enqueueSnackbar("Row added successfully", { variant: "success" });
    } catch (validationError) {
      enqueueSnackbar(validationError.errors.join(", "), { variant: "error" });
    }
  };

  const handleRowRemove = (index) => {
    setRows((prevRows) => prevRows.filter((_, i) => i !== index));
    enqueueSnackbar("Row removed successfully", { variant: "info" });
  };

  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: { xs: "90%", sm: "80%", md: "70%", lg: "60%" },
    maxHeight: "85vh",
    bgcolor: "background.paper",
    borderRadius: 2,
    boxShadow: 24,
    p: { xs: 2, sm: 3, md: 4 },
    overflow: "auto",
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="contained"
        color="primary"
        startIcon={<Iconify icon="eva:plus-fill" />}
        sx={{ fontWeight: 600, px: 2.5 }}
      >
        New Admissions
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        closeAfterTransition
        keepMounted={false}
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 500 } }}
      >
        <Fade in={open}>
          <Box sx={modalStyle}>
            <Stack spacing={3}>
              {/* Header */}
              <Stack 
                direction="row" 
                alignItems="center" 
                justifyContent="space-between"
                sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}
              >
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  Add New Admissions
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<Iconify icon="eva:upload-outline" />}
                  component="label"
                  sx={{ minWidth: 140 }}
                >
                  Upload CSV
                  <input type="file" accept=".csv" hidden onChange={handleFileUpload} />
                </Button>
              </Stack>
              
              {/* Error Display */}
              {apiErrors.length > 0 && (
                <Box
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'error.main',
                    borderRadius: 1,
                    bgcolor: 'error.lighter',
                  }}
                >
                  <Typography variant="subtitle1" color="error.main" fontWeight={600} gutterBottom>
                    Errors Found:
                  </Typography>
                  <Typography variant="body2" color="error.dark">
                    {apiErrors}
                  </Typography>
                </Box>
              )}
              
              {/* Manual Entry Form */}
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  bgcolor: 'background.neutral',
                  borderRadius: 1,
                }}
              >
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <TextField
                    label="Number"
                    value={newRow.number}
                    onChange={(e) => setNewRow({ ...newRow, number: e.target.value })}
                    fullWidth
                    size="medium"
                    sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
                  />
                  <TextField
                    label="Email"
                    value={newRow.email}
                    onChange={(e) => setNewRow({ ...newRow, email: e.target.value })}
                    fullWidth
                    size="medium"
                    sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
                  />
                  <FormControl 
                    fullWidth
                    sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
                  >
                    <InputLabel>Programme</InputLabel>
                    <Select
                      value={newRow.programme}
                      onChange={(e) => setNewRow({ ...newRow, programme: e.target.value })}
                      label="Programme"
                      disabled={isLoadingPrograms}
                    >
                      {(programs || []).map((program) => (
                        <MenuItem key={program._id} value={program._id}>
                          {program.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button 
                    onClick={handleAddRow} 
                    variant="contained" 
                    color="primary"
                    sx={{ 
                      minWidth: { xs: '100%', md: '120px' },
                      height: { md: 56 }
                    }}
                    startIcon={<Iconify icon="eva:plus-outline" />}
                  >
                    Add
                  </Button>
                </Stack>
              </Paper>

              {/* Data Table */}
              <Paper 
                elevation={2} 
                sx={{ 
                  border: '1px solid', 
                  borderColor: 'divider',
                  borderRadius: 1,
                  overflow: 'hidden',
                }}
              >
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'background.neutral',
                    fontWeight: 600,
                    borderBottom: '1px solid', 
                    borderColor: 'divider'
                  }}
                >
                  Admission List {rows.length > 0 ? `(${rows.length})` : ''}
                </Typography>
                
                <TableContainer sx={{ height: 350, overflow: "auto" }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'background.neutral' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>S/No.</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Number</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Programme</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                            <Typography variant="body1" color="text.secondary">
                              No records found. Upload a CSV or add rows manually.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        rows.map((row, index) => (
                          <TableRow
                            key={index}
                            sx={{ 
                              bgcolor: row._error ? 'error.lighter' : 'inherit',
                              '&:hover': { bgcolor: 'action.hover' },
                            }}
                          >
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{row.number}</TableCell>
                            <TableCell>{row.email}</TableCell>
                            <TableCell>{row.programme}</TableCell>
                            <TableCell>
                              {row._error ? (
                                <Typography variant="caption" color="error.main">
                                  {row._message}
                                </Typography>
                              ) : (
                                <Box sx={{ 
                                  color: 'success.main', 
                                  display: 'flex', 
                                  alignItems: 'center',
                                  gap: 0.5, 
                                }}>
                                  <Iconify icon="eva:checkmark-circle-fill" width={16} />
                                  <Typography variant="caption">Valid</Typography>
                                </Box>
                              )}
                            </TableCell>
                            <TableCell>
                              <IconButton 
                                onClick={() => handleRowRemove(index)}
                                color="error" 
                                size="small"
                              >
                                <Iconify icon="eva:trash-outline" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* Action Buttons */}
              <Stack 
                direction="row" 
                justifyContent="flex-end" 
                spacing={2} 
                sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider' }}
              >
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => setOpen(false)}
                  sx={{ px: 3 }}
                >
                  Cancel
                </Button>
                <LoadingButton
                  loading={isProcessing || isLoading}
                  variant="contained"
                  color="primary"
                  onClick={handlePublish}
                  loadingPosition="start"
                  startIcon={<Iconify icon="eva:cloud-upload-fill" />}
                  sx={{ px: 3 }}
                  disabled={rows.length === 0}
                >
                  Publish Admissions
                </LoadingButton>
              </Stack>
            </Stack>
          </Box>
        </Fade>
      </Modal>
    </>
  );
};

AddAdmission.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
};

export default AddAdmission;
