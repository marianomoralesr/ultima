import React from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'neutral' | 'increase' | 'decrease';
  icon: React.ElementType;
  color?: 'blue' | 'purple' | 'yellow' | 'green' | 'red' | 'orange';
  description?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  color = 'blue',
  description
}) => {
  const changeColorClass = {
    increase: 'text-green-600 dark:text-green-500',
    decrease: 'text-destructive',
    neutral: 'text-muted-foreground',
  }[changeType];

  const changeIcon = {
    increase: TrendingUp,
    decrease: TrendingDown,
    neutral: Minus,
  }[changeType];

  const ChangeIcon = changeIcon;

  const colorVariants: { [key: string]: { icon: string, bg: string } } = {
    blue: { icon: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/20' },
    purple: { icon: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/20' },
    yellow: { icon: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/20' },
    green: { icon: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/20' },
    red: { icon: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/20' },
    orange: { icon: 'text-primary', bg: 'bg-primary/10' },
  };

  const selectedColor = colorVariants[color] || colorVariants.blue;

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1 flex-1">
          <p className="text-sm font-medium text-muted-foreground">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              {value}
            </h2>
          </div>
        </div>
        <div className={cn(
          "flex items-center justify-center h-12 w-12 rounded-lg shrink-0",
          selectedColor.bg
        )}>
          <Icon className={cn("h-6 w-6", selectedColor.icon)} />
        </div>
      </CardHeader>
      <CardContent>
        {(change || description) && (
          <div className="flex flex-col gap-1">
            {change && (
              <div className={cn("flex items-center gap-1 text-sm font-medium", changeColorClass)}>
                <ChangeIcon className="h-3.5 w-3.5" />
                <span>{change}</span>
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
