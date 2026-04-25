import * as RadixTabs from '@radix-ui/react-tabs';
import { cn } from '@/utils/cn';

export const Tabs = RadixTabs.Root;

export const TabList = ({
  className,
  ...props
}: React.ComponentProps<typeof RadixTabs.List>) => (
  <RadixTabs.List
    className={cn(
      'flex gap-1 border-b border-border overflow-x-auto',
      className,
    )}
    {...props}
  />
);

export const Tab = ({
  className,
  ...props
}: React.ComponentProps<typeof RadixTabs.Trigger>) => (
  <RadixTabs.Trigger
    className={cn(
      'shrink-0 px-3 py-2 text-sm transition-colors',
      'text-text-muted hover:text-text',
      'data-[state=active]:text-text',
      'data-[state=active]:border-b-2 data-[state=active]:border-text',
      '-mb-px',
      className,
    )}
    {...props}
  />
);

export const TabPanel = ({
  className,
  ...props
}: React.ComponentProps<typeof RadixTabs.Content>) => (
  <RadixTabs.Content
    className={cn('focus:outline-none animate-fade-up', className)}
    {...props}
  />
);
