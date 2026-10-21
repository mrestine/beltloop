import { type LucideIcon } from 'lucide-react';

interface ButtonProps {
  type?: 'primary' | 'secondary';
  icon: LucideIcon;
  label: string;
  size?: number;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
}

const IconButton = ({
  icon: Icon,
  label,
  onClick,
  type = 'primary',
  size = 16,
  disabled = false,
  className = '',
}: ButtonProps) => {
  return (
    <button
      disabled={disabled}
      className={type + ' ' + className}
      aria-label={label}
      onClick={onClick}
    >
      <Icon size={size} />
    </button>
  );
};

export default IconButton;
