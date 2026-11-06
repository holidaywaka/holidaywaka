
import { forwardRef } from 'react';
import cx from 'clsx';
import { Box } from '@mantine/core';
import type { MantineLoaderComponent } from '@mantine/core';
import classes from './mantineloader.module.css';

export const MantineLoader: MantineLoaderComponent = forwardRef(({ className, ...others }, ref) => (
  <Box component="span" className={cx(classes.loader, className)} {...others} ref={ref} />
));