import Swal from "sweetalert2"

type alertProps = {
    message: string
    icon: 'error' | 'info' | 'success' | 'warning' | 'question'
}
export function getAlert(message: alertProps["message"], icon: alertProps["icon"]) {
    const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        }
    });
    Toast.fire({
        icon: icon,
        title: message
    });
}