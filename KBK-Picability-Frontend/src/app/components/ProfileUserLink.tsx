interface ProfileUserLinkProps {
    userName: string;
    onOpenProfile: (
        userName: string
    ) => void;
    className?: string;
    children?: React.ReactNode;
    disabled?: boolean;
}

export function ProfileUserLink({
    userName,
    onOpenProfile,
    className = '',
    children,
    disabled = false
}: ProfileUserLinkProps) {
    if (
        disabled ||
        !userName ||
        userName === 'Streaky'
    ) {
        return (
            <span className={className}>
                {children ?? userName}
            </span>
        );
    }

    return (
        <button
            type="button"
            onClick={event => {
                event.stopPropagation();

                onOpenProfile(
                    userName
                );
            }}
            className={`
                inline
                text-left
                hover:underline
                underline-offset-2
                transition-colors
                ${className}
            `}
        >
            {children ?? userName}
        </button>
    );
}