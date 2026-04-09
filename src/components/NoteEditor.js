import { useState } from "react";
import {
  Box,
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";

export function NoteEditor({ note, onUpdate, onDelete, loading }) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);

  function submitUpdate(e) {
    e.preventDefault();
    onUpdate({ id: note.id, title, content }, () => setEditing(false));
  }

  return (
    <Paper className="glass-card" sx={{ p: 1.4 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1 }}
      >
        <Typography variant="subtitle1" sx={{ fontSize: 18, fontWeight: 600 }}>
          {note.title}
        </Typography>
        <Stack direction="row" spacing={0.5}>
          <IconButton onClick={() => setExpanded((v) => !v)} size="small">
            {expanded ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
          </IconButton>
          <IconButton onClick={() => setEditing((v) => !v)} size="small">
            <EditRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton
            onClick={() => setDeleteOpen(true)}
            color="error"
            size="small"
          >
            <DeleteRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>

      <Collapse in={expanded || editing}>
        {editing ? (
          <Box component="form" onSubmit={submitUpdate}>
            <Stack spacing={1.2}>
              <TextField
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                size="small"
              />
              <TextField
                label="Content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                multiline
                minRows={4}
              />
              <Stack direction="row" spacing={1}>
                <Button
                  type="submit"
                  variant="contained"
                  color="warning"
                  disabled={loading}
                >
                  Save
                </Button>
                <Button onClick={() => setEditing(false)} disabled={loading}>
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </Box>
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ whiteSpace: "pre-wrap" }}
          >
            {note.content}
          </Typography>
        )}
      </Collapse>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete Note</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this note? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button
            color="error"
            onClick={() => {
              onDelete(note.id, () => setDeleteOpen(false));
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
