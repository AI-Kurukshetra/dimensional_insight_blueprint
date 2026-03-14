import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function UserAvatar({ fullName }: { fullName: string }) {
  return (
    <Avatar>
      <AvatarFallback>
        {fullName
          .split(" ")
          .filter(Boolean)
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
