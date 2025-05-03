
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

const UserAvatar = () => {
  const { user } = useAuth();
  
  const getInitials = () => {
    if (!user) return "U";
    
    const firstInitial = user.first_name ? user.first_name[0] : "";
    const lastInitial = user.last_name ? user.last_name[0] : "";
    
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };
  
  return (
    <Avatar>
      <AvatarFallback className="bg-primary/10 text-primary">
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
