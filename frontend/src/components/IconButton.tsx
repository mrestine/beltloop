import { type LucideIcon } from 'lucide-react';

interface ButtonProps {
  type?: 'primary' | 'secondary';
  icon: LucideIcon;
  label: string;
  size?: number;
  disabled?: boolean;
  onClick: () => void;
}

const IconButton = ({
  icon: Icon,
  label,
  onClick,
  type = 'primary',
  size = 16,
  disabled = false,
}: ButtonProps) => {
  return (
    <button disabled={disabled} className={type} aria-label={label} onClick={onClick}>
      <Icon size={size} />
    </button>
  );
};

export default IconButton;
