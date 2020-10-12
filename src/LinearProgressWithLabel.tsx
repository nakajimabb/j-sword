import React from 'react';
import { Box, LinearProgress, Typography } from '@material-ui/core';

interface LinearProgressWithLabelProps {
  variant?: 'buffer' | 'determinate' | 'indeterminate' | 'query';
  value: number;
  label: string;
}

const LinearProgressWithLabel: React.FC<LinearProgressWithLabelProps> = ({
  variant,
  value,
  label,
}) => {
  return (
    <Box>
      <Box display="flex" alignItems="center">
        <Box width="100%" mr={1}>
          <LinearProgress variant={variant} value={value} />
        </Box>
        <Box minWidth={35}>
          <Typography variant="body2" color="textSecondary">
            {label}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
export default LinearProgressWithLabel;
