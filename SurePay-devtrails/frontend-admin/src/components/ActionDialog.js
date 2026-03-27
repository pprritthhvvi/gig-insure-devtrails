import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
} from '@mui/material';

export default function ActionDialog({ open, title, action, onConfirm, onCancel, loading = false }) {
  const [reason, setReason] = React.useState('');

  const handleConfirm = () => {
    if (!reason.trim()) {
      alert('Please enter a reason');
      return;
    }
    onConfirm(reason);
    setReason('');
  };

  const handleCancel = () => {
    setReason('');
    onCancel();
  };

  const isReject = action === 'reject';

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {isReject && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action will reject the claim and notify the worker.
          </Alert>
        )}
        <TextField
          fullWidth
          multiline
          rows={4}
          label={isReject ? 'Rejection Reason' : 'Approval Reason'}
          placeholder="Enter detailed reason..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={isReject ? 'error' : 'success'}
          disabled={loading || !reason.trim()}
        >
          {loading ? 'Processing...' : isReject ? 'Reject' : 'Approve'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
