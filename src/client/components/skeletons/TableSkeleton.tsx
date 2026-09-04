import {
  Box,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  showPagination?: boolean;
}

export default function TableSkeleton({
  columns = 5,
  rows = 5,
  showPagination = true,
}: TableSkeletonProps) {
  return (
    <Paper>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {Array.from({ length: columns }, (_, i) => i).map((i) => (
                <TableCell key={`skeleton-${i}`}>
                  <Skeleton variant="text" width={80 + Math.random() * 40} />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: rows }, (_, rowIndex) => rowIndex).map((rowIndex) => (
              <TableRow key={`skeleton-row-${rowIndex}`}>
                {Array.from({ length: columns }, (_, colIndex) => colIndex).map((colIndex) => (
                  <TableCell key={`skeleton-col-${colIndex}`}>
                    <Skeleton
                      variant="text"
                      width={colIndex === 0 ? "70%" : colIndex === columns - 1 ? 40 : "50%"}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {showPagination && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", p: 2, gap: 2 }}>
          <Skeleton variant="text" width={100} />
          <Skeleton variant="text" width={80} />
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="circular" width={32} height={32} />
        </Box>
      )}
    </Paper>
  );
}
