import { type LucideIcon } from 'lucide-react';

interface ButtonProps {
  type?: 'primary' | 'secondary';
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

const IconButton = ({ icon: Icon, label, onClick, type = 'primary' }: ButtonProps) => {
  return (
    <button className={type} aria-label={label} onClick={onClick}>
      <Icon size={16} />
    </button>
  );
};

export default IconButton;
